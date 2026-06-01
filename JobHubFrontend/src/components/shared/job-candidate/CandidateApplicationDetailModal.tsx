import { useState } from 'react'
import { Modal, Tag, Descriptions, Button, Divider, Spin, message } from 'antd'
import { DownloadOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { IApplication } from '../../../types/application'
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_COLOR } from '../../../types/application'
import type { IJob } from '../../../types/job'
import '../job-applications/ApplicationDetailModal.scss'

interface Props {
  application: IApplication | null
  job: IJob | null
  open: boolean
  onClose: () => void
}

// Fetch file from backend with authorization (Bearer token from localStorage)
const fetchBlobUrl = async (apiUrl: string): Promise<string> => {
  const token   = localStorage.getItem('access_token')
  const baseUrl = import.meta.env.VITE_BACKEND_URL ?? ''
  const res = await fetch(`${baseUrl}${apiUrl}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

const CandidateApplicationDetailModal = ({ application, job, open, onClose }: Props) => {
  const [downloading, setDownloading] = useState(false)
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null)
  const [previewing,  setPreviewing]  = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  if (!application) return null

  const { id, resume, status, coverLetter, createdDate, lastModifiedDate, reviewNote } = application
  const statusLabel = APPLICATION_STATUS_LABEL[status]
  const statusColor = APPLICATION_STATUS_COLOR[status]
  const apiDownloadUrl = `/api/v1/resumes/${resume?.id}/download`
  const hasFile = !!(resume?.id && !resume.isOnlineCv)

  const handleDownload = async () => {
    if (!hasFile) return
    setDownloading(true)
    try {
      const url = await fetchBlobUrl(apiDownloadUrl)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resume!.title || 'CV'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('Không thể tải file CV. Vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  const handlePreview = async () => {
    if (!hasFile) return
    setPreviewing(true)
    setPreviewOpen(true)
    try {
      if (!previewUrl) {
        const url = await fetchBlobUrl(apiDownloadUrl)
        setPreviewUrl(url)
      }
    } catch {
      message.error('Không thể tải xem CV. Hãy thử tải xuống.')
      setPreviewOpen(false)
    } finally {
      setPreviewing(false)
    }
  }

  const handleClosePreview = () => setPreviewOpen(false)

  const handleClose = () => {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    setPreviewOpen(false)
    onClose()
  }

  return (
    <>
      {/* ════════════════ Detail Modal ════════════════ */}
      <Modal
        open={open}
        onCancel={handleClose}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined"
              style={{ color: '#002660', fontSize: 20, fontVariationSettings: '"FILL" 1' }}>
              person_search
            </span>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#002660' }}>Chi tiết đơn ứng tuyển</span>
          </div>
        }
        footer={[
          <Button key="close" onClick={handleClose} style={{ borderRadius: 6 }}>Đóng</Button>
        ]}
        width={620}
      >
        {/* Status display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Trạng thái hiện tại:</span>
          <Tag color={statusColor} style={{ borderRadius: 99, fontWeight: 700, margin: 0, padding: '2px 10px', fontSize: 12 }}>
            {statusLabel}
          </Tag>
        </div>

        {/* Info */}
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Công việc" span={2}>
            <span style={{ fontWeight: 700, color: '#002660' }}>{job?.name ?? 'Đang tải...'}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Công ty" span={2}>
            {job?.companyName ?? 'Đang tải...'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày nộp">
            {dayjs(createdDate).format('HH:mm DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật gần nhất">
            {lastModifiedDate ? dayjs(lastModifiedDate).format('HH:mm DD/MM/YYYY') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Loại CV">
            {resume?.isOnlineCv ? 'Online CV' : 'File CV'}
          </Descriptions.Item>
          <Descriptions.Item label="Tên CV">
            <span style={{ color: '#002660', fontWeight: 600 }}>{resume?.title ?? '—'}</span>
          </Descriptions.Item>
        </Descriptions>

        {/* File CV row */}
        {hasFile && (
          <div className="adm-cv-row" style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f4f6fb', borderRadius: 8 }}>
            <span className="material-symbols-outlined" style={{ color: '#005daa', fontSize: 22 }}>
              description
            </span>
            <span className="adm-cv-name" style={{ flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {resume!.title}
            </span>
            <Button icon={<EyeOutlined />} loading={previewing} onClick={handlePreview}
              style={{ borderRadius: 6, fontWeight: 600 }}>
              Xem trước
            </Button>
            <Button icon={<DownloadOutlined />} loading={downloading} onClick={handleDownload}
              type="primary" style={{ borderRadius: 6, background: '#002660', borderColor: '#002660', fontWeight: 600 }}>
              Tải xuống
            </Button>
          </div>
        )}

        {resume?.isOnlineCv && (
          <div className="adm-online-banner" style={{ marginTop: 20, padding: 12, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, color: '#d46b08', fontSize: 13 }}>
            ℹ️ Đây là Online CV được tạo từ hệ thống builder — không có file đính kèm.
          </div>
        )}

        {/* Cover letter */}
        {coverLetter && (
          <>
            <Divider orientation="left" style={{ fontSize: 13, color: '#747783', margin: '20px 0 10px' }}>Thư xin việc</Divider>
            <p className="adm-cover-letter" style={{ whiteSpace: 'pre-line', padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#334155' }}>
              {coverLetter}
            </p>
          </>
        )}

        {/* Recruiter feedback / note */}
        {reviewNote && (
          <>
            <Divider orientation="left" style={{ fontSize: 13, color: '#747783', margin: '20px 0 10px' }}>Phản hồi từ Nhà tuyển dụng</Divider>
            <p className="adm-review-note" style={{ whiteSpace: 'pre-line', padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13, color: '#166534', fontWeight: 500 }}>
              {reviewNote}
            </p>
          </>
        )}
      </Modal>

      {/* ════════════════ PDF Preview Modal ════════════════ */}
      <Modal
        open={previewOpen}
        onCancel={handleClosePreview}
        className="adm-preview-modal"
        title={
          <div className="adm-preview-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="adm-preview-icon" style={{ width: 40, height: 40, background: '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyItems: 'center', border: '1px solid #e2e8f0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#005daa', margin: 'auto' }}>description</span>
            </div>
            <div>
              <div className="adm-preview-file-name" style={{ fontWeight: 700, color: '#0f172a' }}>{resume?.title ?? 'Xem trước CV'}</div>
              <div className="adm-preview-file-type" style={{ fontSize: 11, color: '#64748b' }}>PDF Document</div>
            </div>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button icon={<DownloadOutlined />} loading={downloading} onClick={handleDownload}
              type="primary" style={{ background: '#002660', borderColor: '#002660', borderRadius: 8, fontWeight: 600 }}>
              Tải xuống
            </Button>
            <Button onClick={handleClosePreview} style={{ borderRadius: 8 }}>Đóng</Button>
          </div>
        }
        width="78vw"
        style={{ top: 32 }}
      >
        {previewing ? (
          <div className="adm-pdf-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 12 }}>
            <Spin size="large" />
            <span style={{ color: '#64748b', fontSize: 14 }}>Đang tải file CV...</span>
          </div>
        ) : previewUrl ? (
          <div className="adm-pdf-viewport" style={{ background: '#f1f5f9', padding: '16px', borderRadius: 8, display: 'flex', justifyContent: 'center' }}>
            <div className="adm-pdf-card" style={{ width: '100%', height: '65vh', background: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderRadius: 8, overflow: 'hidden' }}>
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                title="CV Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}

export default CandidateApplicationDetailModal
