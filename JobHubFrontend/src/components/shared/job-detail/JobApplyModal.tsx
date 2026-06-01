import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  App, Button, Modal, Radio, Space, Spin, Alert,
  Tag, Input, Tabs, Upload, Progress,
} from 'antd'
import {
  SendOutlined, FileTextOutlined,
  UploadOutlined, InboxOutlined, DeleteOutlined,
} from '@ant-design/icons'
import type { UploadFile, RcFile } from 'antd/es/upload/interface'
import type { IJob } from '../../../types/job'
import type { ICompany } from '../../../types/company'
import type { IResume } from '../../../types/resume-builder'
import { getMyResumesApi, uploadResumeFileApi, createResumeApi } from '../../../services/resume-service'
import { createApplicationApi } from '../../../services/application-service'
import { trackJobInteractionApi } from '../../../services/ai-service'

interface Props {
  open: boolean
  job: IJob | null
  company: ICompany | null
  currentUserId: string
  onSuccess: () => void
  onClose: () => void
}

const ACCEPT = '.pdf,.doc,.docx'
const MAX_MB = 5

const JobApplyModal = ({ open, job, company, currentUserId, onSuccess, onClose }: Props) => {
  const navigate         = useNavigate()
  const { notification } = App.useApp()

  // Tab: 'existing' | 'upload'
  const [activeTab,        setActiveTab]        = useState<'existing' | 'upload'>('existing')

  // Existing CV state
  const [resumes,          setResumes]          = useState<IResume[]>([])
  const [resumesLoading,   setResumesLoading]   = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)

  // Upload CV state
  const [uploadFile,       setUploadFile]       = useState<RcFile | null>(null)
  const [uploadProgress,   setUploadProgress]   = useState(0)
  const [uploading,        setUploading]        = useState(false)

  // Shared
  const [coverLetter,      setCoverLetter]      = useState('')
  const [applying,         setApplying]         = useState(false)

  // ── Load CV list when modal opens ────────────────────────────
  const handleAfterOpen = (isOpen: boolean) => {
    if (!isOpen) {
      // reset upload state on close
      setUploadFile(null)
      setUploadProgress(0)
      setActiveTab('existing')
      return
    }
    setResumesLoading(true)
    getMyResumesApi(currentUserId)
      .then(res => {
        const list = res.data?.result ?? []
        setResumes(list)
        const def = list.find(r => r.isDefault) ?? list[0]
        if (def) setSelectedResumeId(def.id)
      })
      .catch(() => notification.error({ message: 'Không thể tải danh sách CV', duration: 2 }))
      .finally(() => setResumesLoading(false))
  }

  // ── Validate & store file (no auto upload) ───────────────────
  const beforeUpload = (file: RcFile) => {
    const isValidType = /\.(pdf|doc|docx)$/i.test(file.name)
    if (!isValidType) {
      notification.error({ message: 'Chỉ hỗ trợ file PDF, DOC, DOCX', duration: 2 })
      return Upload.LIST_IGNORE
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      notification.error({ message: `File không được vượt quá ${MAX_MB}MB`, duration: 2 })
      return Upload.LIST_IGNORE
    }
    setUploadFile(file)
    return false // prevent auto upload
  }

  // ── Submit handler ───────────────────────────────────────────
  const handleApply = async () => {
    if (!job) return

    let resumeIdToUse: string | null = null

    // ── Case 1: upload new file ──
    if (activeTab === 'upload') {
      if (!uploadFile) {
        notification.warning({ message: 'Vui lòng chọn file CV để tải lên', duration: 2 })
        return
      }
      setUploading(true)
      setUploadProgress(0)
      try {
        // Simulate progress during upload
        const progressInterval = setInterval(() => {
          setUploadProgress(p => Math.min(p + 15, 85))
        }, 200)

        const formData = new FormData()
        formData.append('file', uploadFile)
        const uploadRes = await uploadResumeFileApi(formData)
        clearInterval(progressInterval)
        setUploadProgress(100)

        const { url, originalFileName, extractedText } = uploadRes.data
        const resumeRes = await createResumeApi({
          title: originalFileName ?? uploadFile.name,
          url,
          extractedText,
        })
        resumeIdToUse = resumeRes.data.id
      } catch {
        notification.error({ message: 'Tải file thất bại, vui lòng thử lại', duration: 3 })
        setUploading(false)
        setUploadProgress(0)
        return
      } finally {
        setUploading(false)
      }
    }

    // ── Case 2: existing CV ──
    if (activeTab === 'existing') {
      if (!selectedResumeId) {
        notification.warning({ message: 'Vui lòng chọn CV để ứng tuyển', duration: 2 })
        return
      }
      resumeIdToUse = selectedResumeId
    }

    if (!resumeIdToUse) return

    setApplying(true)
    try {
      await createApplicationApi({
        jobId: job.id,
        resumeId: resumeIdToUse,
        coverLetter: coverLetter.trim() || undefined,
      })
      onSuccess()
      trackJobInteractionApi({
        customer_id: currentUserId,
        job_id: job.id,
        interaction_type: 'APPLY'
      }).catch(() => {})
      onClose()
      setCoverLetter('')
      setUploadFile(null)
      setUploadProgress(0)
      notification.success({
        message: '🎉 Ứng tuyển thành công!',
        description: `Đơn ứng tuyển cho vị trí "${job.name}" đã được gửi. Chúc bạn may mắn!`,
        duration: 4,
      })
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Ứng tuyển thất bại, vui lòng thử lại.'
      notification.error({ message: msg, duration: 3 })
    } finally {
      setApplying(false)
    }
  }

  // ── Derived ──────────────────────────────────────────────────
  const companyName = job?.companyName ?? company?.name ?? 'Công ty'
  const companyLogo = job?.companyLogo ?? company?.logo

  const isSubmitDisabled =
    (activeTab === 'existing' && !selectedResumeId) ||
    (activeTab === 'upload'   && !uploadFile)

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterOpenChange={handleAfterOpen}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ color: '#002660', fontSize: 22, fontVariationSettings: '"FILL" 1' }}>send</span>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#002660' }}>Ứng tuyển: {job?.name}</span>
        </div>
      }
      footer={[
        <Button key="cancel" onClick={onClose}>Hủy</Button>,
        <Button
          key="submit"
          type="primary"
          loading={applying || uploading}
          disabled={isSubmitDisabled}
          icon={<SendOutlined />}
          style={{ background: '#002660', borderColor: '#002660', fontWeight: 700 }}
          onClick={handleApply}
        >
          Nộp đơn
        </Button>,
      ]}
      width={560}
      destroyOnClose
    >
      <div style={{ padding: '8px 0' }}>

        {/* Job summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f4f3f3', borderRadius: 8, marginBottom: 16 }}>
          {companyLogo
            ? <img src={companyLogo} alt={companyName} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'contain', background: '#fff', border: '1px solid #e9e8e8', padding: 3 }} />
            : <div style={{ width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>
                {companyName.charAt(0).toUpperCase()}
              </div>
          }
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1b1c1c' }}>{job?.name}</div>
            <div style={{ fontSize: 12, color: '#747783' }}>
              {companyName}{job?.location ? ` • ${job.location}` : ''}
            </div>
          </div>
        </div>

        {/* CV Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={k => setActiveTab(k as 'existing' | 'upload')}
          size="small"
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'existing',
              label: (
                <span>
                  <FileTextOutlined style={{ marginRight: 5 }} />
                  CV có sẵn
                </span>
              ),
              children: (
                <Spin spinning={resumesLoading} tip="Đang tải CV...">
                  {resumes.length === 0 && !resumesLoading ? (
                    <Alert
                      type="warning"
                      message="Bạn chưa có CV nào"
                      description={
                        <span>
                          Hãy{' '}
                          <span
                            style={{ color: '#005daa', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => { onClose(); navigate('/candidate/resume') }}
                          >
                            tạo CV
                          </span>
                          {' '}hoặc tải lên file CV ở tab bên cạnh.
                        </span>
                      }
                      showIcon
                    />
                  ) : (
                    <Radio.Group
                      value={selectedResumeId}
                      onChange={e => setSelectedResumeId(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {resumes.map(r => (
                          <Radio
                            key={r.id}
                            value={r.id}
                            style={{
                              width: '100%', padding: '10px 14px',
                              background: selectedResumeId === r.id ? '#e8f0fe' : '#f9f9f9',
                              borderRadius: 8,
                              border: `1px solid ${selectedResumeId === r.id ? '#002660' : '#e9e8e8'}`,
                              transition: 'all .2s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#005daa', fontVariationSettings: '"FILL" 1' }}>
                                {r.isOnlineCv ? 'description' : 'picture_as_pdf'}
                              </span>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#1b1c1c' }}>
                                  {r.title}
                                  {r.isDefault && <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>Mặc định</Tag>}
                                </div>
                                <div style={{ fontSize: 11, color: '#747783' }}>
                                  {r.isOnlineCv ? 'Online CV' : 'File CV'}
                                </div>
                              </div>
                            </div>
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  )}
                </Spin>
              ),
            },
            {
              key: 'upload',
              label: (
                <span>
                  <UploadOutlined style={{ marginRight: 5 }} />
                  Tải lên CV
                </span>
              ),
              children: (
                <div>
                  {!uploadFile ? (
                    <Upload.Dragger
                      accept={ACCEPT}
                      beforeUpload={beforeUpload}
                      maxCount={1}
                      showUploadList={false}
                      style={{ borderRadius: 10, borderColor: '#002660' }}
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: '#002660', fontSize: 36 }} />
                      </p>
                      <p style={{ fontWeight: 600, color: '#1b1c1c', marginBottom: 4 }}>
                        Kéo thả hoặc click để tải lên CV
                      </p>
                      <p style={{ fontSize: 12, color: '#747783' }}>
                        Hỗ trợ PDF, DOC, DOCX • Tối đa {MAX_MB}MB
                      </p>
                    </Upload.Dragger>
                  ) : (
                    <div style={{ padding: '14px 16px', background: '#f0f7ff', border: '1px solid #91c8f6', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: uploading ? 10 : 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#005daa', fontVariationSettings: '"FILL" 1' }}>
                          picture_as_pdf
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1b1c1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {uploadFile.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#747783' }}>
                            {(uploadFile.size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                        {!uploading && (
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => { setUploadFile(null); setUploadProgress(0) }}
                          />
                        )}
                      </div>
                      {uploading && (
                        <Progress
                          percent={uploadProgress}
                          size="small"
                          strokeColor={{ '0%': '#667eea', '100%': '#002660' }}
                          status={uploadProgress === 100 ? 'success' : 'active'}
                        />
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#747783', marginTop: 8 }}>
                    * CV sẽ được lưu vào hồ sơ của bạn sau khi nộp đơn.
                  </div>
                </div>
              ),
            },
          ]}
        />

        {/* Cover letter */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, color: '#002660', verticalAlign: 'middle' }}>edit_note</span>
            Thư xin việc{' '}
            <span style={{ fontWeight: 400, color: '#747783', fontSize: 12 }}>(không bắt buộc)</span>
          </div>
          <Input.TextArea
            rows={4}
            placeholder="Giới thiệu bản thân, lý do ứng tuyển và điểm mạnh của bạn..."
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
            maxLength={1000}
            showCount
            style={{ borderRadius: 8, fontSize: 13 }}
          />
        </div>

      </div>
    </Modal>
  )
}

export default JobApplyModal
