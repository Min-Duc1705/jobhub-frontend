import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Empty, Popconfirm, Spin, Tag, Tooltip, Upload } from 'antd'
import { message } from '../../../utils/antd'
import { useAppSelector } from '../../../redux/hooks'
import {
  getMyResumesApi, deleteResumeApi, setDefaultResumeApi,
  uploadResumeFileApi, createResumeApi, getResumeDownloadUrl,
  renameCvApi,
} from '../../../services/resume-service'
import TemplateSelectorModal from '../../../components/client/resume/TemplateSelectorModal'
import { createOnlineCvApi } from '../../../services/resume-service'
import { DEFAULT_RESUME_CONTENT, RESUME_TEMPLATES, type IResume, type ResumeTemplate } from '../../../types/resume-builder'
import './ResumeManagerPage.scss'

// ── Thumbnail helpers ─────────────────────────────────────────────────────────
const getThumb = (id: string) => localStorage.getItem(`cv-thumb-${id}`)

// ── Mini-document placeholder ─────────────────────────────────────────────────
function MiniDocPlaceholder({ accent, label }: { accent: string; label: string }) {
  return (
    <div className="rmp-card__thumb-doc">
      {/* Colored header */}
      <div className="rmp-card__doc-header" style={{ background: accent }}>
        <div className="rmp-card__doc-avatar" />
        <div className="rmp-card__doc-name-block">
          <div className="rmp-card__doc-line rmp-card__doc-line--name" />
          <div className="rmp-card__doc-line rmp-card__doc-line--title" />
        </div>
      </div>
      {/* Body lines */}
      <div className="rmp-card__doc-body">
        {[0, 1, 2].map(i => (
          <div key={i} className="rmp-card__doc-section">
            <div
              className="rmp-card__doc-section-title"
              style={{ background: `${accent}55` }}
            />
            <div className="rmp-card__doc-text-line rmp-card__doc-text-line--full" />
            <div className="rmp-card__doc-text-line rmp-card__doc-text-line--long" />
            <div className="rmp-card__doc-text-line rmp-card__doc-text-line--med" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ResumeManagerPage() {
  const navigate = useNavigate()
  const { user } = useAppSelector(s => s.auth)

  const [resumes,       setResumes]       = useState<IResume[]>([])
  const [loading,       setLoading]       = useState(true)
  const [uploading,     setUploading]     = useState(false)
  const [showTplPicker, setShowTplPicker] = useState(false)
  const [creating,      setCreating]      = useState(false)
  const [editingId,     setEditingId]     = useState<string | null>(null)
  const [editingTitle,  setEditingTitle]  = useState('')

  const load = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await getMyResumesApi(user.id)
      setResumes(res.data?.result ?? [])
    } catch {
      message.error('Không thể tải danh sách CV')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [user?.id])

  const handleDelete = async (id: string) => {
    try {
      await deleteResumeApi(id)
      localStorage.removeItem(`cv-thumb-${id}`)
      message.success('Đã xóa CV')
      setResumes(prev => prev.filter(r => r.id !== id))
    } catch { message.error('Xóa thất bại') }
  }

  // ── Rename ───────────────────────────────────────────────────────────────────
  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditingTitle(currentTitle)
  }

  const commitRename = async (id: string) => {
    const trimmed = editingTitle.trim()
    setEditingId(null)
    if (!trimmed) return
    const prev = resumes.find(r => r.id === id)?.title
    if (trimmed === prev) return
    try {
      await renameCvApi(id, trimmed)
      setResumes(r => r.map(cv => cv.id === id ? { ...cv, title: trimmed } : cv))
    } catch {
      message.error('Đổi tên thất bại')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultResumeApi(id)
      message.success('Đã đặt CV mặc định')
      setResumes(prev => prev.map(r => ({ ...r, isDefault: r.id === id })))
    } catch { message.error('Thất bại') }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await uploadResumeFileApi(fd)
      const { url, originalFileName, extractedText } = uploadRes.data
      await createResumeApi({ title: originalFileName, url, extractedText, isDefault: resumes.length === 0 })
      message.success('Tải lên thành công')
      load()
    } catch { message.error('Tải lên thất bại') }
    finally { setUploading(false) }
    return false
  }

  const handleSelectTemplate = async (tpl: ResumeTemplate) => {
    setShowTplPicker(false)
    setCreating(true)
    try {
      const res = await createOnlineCvApi({
        title:       `CV Online — ${tpl.name}`,
        templateId:  tpl.id,
        contentJson: JSON.stringify(DEFAULT_RESUME_CONTENT),
        isDefault:   resumes.length === 0,
      })
      navigate(`/candidate/resume/builder/${res.data?.id}`)
    } catch { message.error('Tạo CV thất bại') }
    finally { setCreating(false) }
  }

  if (loading) return <div className="rmp-loading"><Spin size="large" /></div>

  return (
    <div className="rmp">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="rmp__header">
        <div>
          <h1 className="rmp__title">Quản lý CV</h1>
          <p className="rmp__subtitle">Tạo CV online đẹp mắt hoặc tải lên file CV của bạn</p>
        </div>
        <div className="rmp__actions">
          <Upload
            beforeUpload={(f) => { handleUpload(f); return false }}
            accept=".pdf,.doc,.docx"
            showUploadList={false}
          >
            <Button
              icon={<span className="material-symbols-outlined">upload_file</span>}
              loading={uploading}
              size="large"
            >
              Tải CV lên
            </Button>
          </Upload>
          <Button
            type="primary"
            size="large"
            icon={<span className="material-symbols-outlined">add</span>}
            onClick={() => setShowTplPicker(true)}
            loading={creating}
          >
            Tạo CV Online
          </Button>
        </div>
      </div>

      {/* ── Empty ───────────────────────────────────────────────────────────── */}
      {resumes.length === 0 ? (
        <div className="rmp__empty">
          <Empty
            image={<span className="material-symbols-outlined rmp__empty-icon">description</span>}
            description={
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#1b1c1c', marginBottom: 4 }}>
                  Bạn chưa có CV nào
                </p>
                <p style={{ color: '#747783', fontSize: 14 }}>
                  Tạo CV online hoặc tải file CV lên để bắt đầu ứng tuyển
                </p>
              </div>
            }
          >
            <Button type="primary" size="large" onClick={() => setShowTplPicker(true)}>
              Tạo CV đầu tiên
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="rmp__grid">
          {resumes.map(resume => {
            const tpl   = resume.isOnlineCv ? RESUME_TEMPLATES.find(t => t.id === resume.templateId) : null
            const accent = tpl?.colorAccent ?? '#64748b'
            const thumb  = getThumb(resume.id)

            return (
              <div key={resume.id} className={`rmp-card ${resume.isDefault ? 'rmp-card--default' : ''}`}>

                {/* ── Thumbnail ─────────────────────────────────────────── */}
                <div className="rmp-card__thumb">
                  {thumb ? (
                    <img src={thumb} alt={resume.title} className="rmp-card__thumb-img" />
                  ) : (
                    <MiniDocPlaceholder
                      accent={accent}
                      label={tpl?.name ?? 'File CV'}
                    />
                  )}

                  {/* Default badge */}
                  {resume.isDefault && (
                    <div className="rmp-card__badge">
                      <span className="material-symbols-outlined">star</span>
                      Mặc định
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="rmp-card__thumb-overlay">
                    {resume.isOnlineCv ? (
                      <>
                        <Button
                          type="primary"
                          className="rmp-card__overlay-btn"
                          icon={<span className="material-symbols-outlined">edit</span>}
                          onClick={() => navigate(`/candidate/resume/builder/${resume.id}`)}
                        >
                          Chỉnh sửa
                        </Button>
                        {!resume.isDefault && (
                          <Button
                            className="rmp-card__overlay-btn"
                            ghost
                            icon={<span className="material-symbols-outlined">star</span>}
                            onClick={() => handleSetDefault(resume.id)}
                            style={{ color: '#FFD700', borderColor: '#FFD700' }}
                          >
                            Đặt mặc định
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        type="primary"
                        className="rmp-card__overlay-btn"
                        icon={<span className="material-symbols-outlined">download</span>}
                        href={getResumeDownloadUrl(resume.id)}
                        target="_blank"
                      >
                        Tải xuống
                      </Button>
                    )}
                  </div>
                </div>

                {/* ── Info ──────────────────────────────────────────────── */}
                <div className="rmp-card__info">
                  {editingId === resume.id ? (
                    <input
                      className="rmp-card__name-input"
                      value={editingTitle}
                      autoFocus
                      onChange={e => setEditingTitle(e.target.value)}
                      onBlur={() => commitRename(resume.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.currentTarget.blur() }
                        if (e.key === 'Escape') { setEditingId(null) }
                      }}
                    />
                  ) : (
                    <div
                      className="rmp-card__name"
                      title={`${resume.title} (double-click để đổi tên)`}
                      onDoubleClick={() => startEdit(resume.id, resume.title)}
                    >
                      {resume.title}
                    </div>
                  )}
                  <div className="rmp-card__meta-row">
                    <span
                      className="rmp-card__type-tag"
                      style={
                        resume.isOnlineCv
                          ? { color: accent, borderColor: `${accent}55`, background: `${accent}10` }
                          : { color: '#64748b', borderColor: '#e2e8f0', background: '#f8fafc' }
                      }
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                        {resume.isOnlineCv ? 'web' : 'picture_as_pdf'}
                      </span>
                      {resume.isOnlineCv ? tpl?.name ?? 'Online' : 'File CV'}
                    </span>
                    <span className="rmp-card__date">
                      {new Date(resume.createdDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* ── Footer ────────────────────────────────────────────── */}
                <div className="rmp-card__footer">
                  {resume.isOnlineCv ? (
                    <Button
                      className="rmp-card__primary-btn"
                      icon={<span className="material-symbols-outlined">edit</span>}
                      onClick={() => navigate(`/candidate/resume/builder/${resume.id}`)}
                    >
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <Button
                      className="rmp-card__primary-btn"
                      icon={<span className="material-symbols-outlined">download</span>}
                      href={getResumeDownloadUrl(resume.id)}
                      target="_blank"
                    >
                      Tải xuống
                    </Button>
                  )}

                  <Popconfirm
                    title="Xóa CV này?"
                    description="Hành động này không thể hoàn tác."
                    okText="Xóa"
                    okButtonProps={{ danger: true }}
                    cancelText="Hủy"
                    onConfirm={() => handleDelete(resume.id)}
                  >
                    <Tooltip title="Xóa CV">
                      <Button
                        danger
                        className="rmp-card__icon-btn"
                        icon={<span className="material-symbols-outlined">delete</span>}
                      />
                    </Tooltip>
                  </Popconfirm>
                </div>

              </div>
            )
          })}

          {/* ── Add card ────────────────────────────────────────────────── */}
          <div className="rmp-card rmp-card--add" onClick={() => setShowTplPicker(true)}>
            <span className="material-symbols-outlined rmp-card__add-icon">add_circle</span>
            <span className="rmp-card__add-label">Thêm CV mới</span>
          </div>
        </div>
      )}

      <TemplateSelectorModal
        open={showTplPicker}
        onSelect={handleSelectTemplate}
        onCancel={() => setShowTplPicker(false)}
      />
    </div>
  )
}
