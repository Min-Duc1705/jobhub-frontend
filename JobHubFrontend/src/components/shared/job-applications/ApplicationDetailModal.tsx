import { useEffect, useState } from 'react'
import { Drawer, Select, Spin, Tag, message } from 'antd'
import dayjs from 'dayjs'
import type { IApplication, ApplicationStatus } from '../../../types/application'
import type { CvScoringResult } from '../../../services/ai-service'
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_COLOR } from '../../../types/application'
import TemplateModern from '../../client/resume/templates/TemplateModern'
import TemplateClassic from '../../client/resume/templates/TemplateClassic'
import type { ResumeContent } from '../../../types/resume-builder'
import './ApplicationDetailModal.scss'

function renderTemplate(templateId: number, data: ResumeContent) {
  switch (templateId) {
    case 2:  return <TemplateClassic data={data} />
    default: return <TemplateModern  data={data} />
  }
}

const STATUS_OPTIONS: { label: string; value: ApplicationStatus }[] = [
  { label: 'Chờ xử lý', value: 'PENDING' },
  { label: 'Đang xem xét', value: 'REVIEWING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Đã từ chối', value: 'REJECTED' },
]

interface Props {
  application: IApplication | null
  open: boolean
  onClose: () => void
  onUpdateStatus: (id: string, status: ApplicationStatus, note?: string) => void
  aiResult?: CvScoringResult
}

const fetchBlobUrl = async (apiUrl: string): Promise<string> => {
  const token = localStorage.getItem('access_token')
  const baseUrl = import.meta.env.VITE_BACKEND_URL ?? ''
  const res = await fetch(`${baseUrl}${apiUrl}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

const EmptyLine = ({ children }: { children: string }) => (
  <li style={{ color: '#727682' }}>{children}</li>
)

const ApplicationDetailModal = ({ application, open, onClose, onUpdateStatus, aiResult }: Props) => {
  const [downloading, setDownloading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [tempStatus, setTempStatus] = useState<ApplicationStatus>('PENDING')
  const [zoom, setZoom] = useState(100)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (application) {
      setTempStatus(application.status)
      setNote(application.reviewNote ?? '')
      setZoom(100)
    }
  }, [application?.id, open])

  const hasFile = !!(application?.resume?.id && !application.resume.isOnlineCv)
  const apiDownloadUrl = application ? `/api/v1/resumes/${application.resume?.id}/download` : ''
  const apiPreviewUrl = application ? `/api/v1/resumes/${application.resume?.id}/preview` : ''

  useEffect(() => {
    let alive = true
    const loadPreview = async () => {
      if (!open || !application || !hasFile) {
        setPreviewUrl(null)
        return
      }
      setPreviewing(true)
      try {
        const url = await fetchBlobUrl(apiPreviewUrl)
        if (alive) setPreviewUrl(url)
      } catch {
        if (alive) {
          message.error('Không thể tải xem trước CV. Vui lòng tải xuống.')
          setPreviewUrl(null)
        }
      } finally {
        if (alive) setPreviewing(false)
      }
    }
    loadPreview()
    return () => {
      alive = false
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [open, application?.id])

  if (!application) return null

  const { id, resume, reviewNote, createdDate } = application
  const candidateName = resume?.title ?? 'Ứng viên'
  const hasAiResult = typeof aiResult?.matching_score === 'number'
  const aiPct = hasAiResult ? Math.round(aiResult.matching_score) : 0
  const skills = aiResult?.extracted_skills ?? []
  const strengths = aiResult?.strengths ?? []
  const weaknesses = aiResult?.weaknesses ?? []
  const feedback = aiResult?.ai_feedback || 'Chưa có kết quả AI. Bấm "Chấm AI CV" ở danh sách ứng viên để sinh phân tích.'

  const handleDownload = async () => {
    if (!hasFile) return
    setDownloading(true)
    try {
      const downloadBlobUrl = await fetchBlobUrl(apiDownloadUrl)
      const a = document.createElement('a')
      a.href = downloadBlobUrl
      a.download = `${resume!.title || 'CV'}`
      a.click()
      URL.revokeObjectURL(downloadBlobUrl)
    } catch {
      message.error('Không thể tải file CV. Vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="92%"
      placement="right"
      closable={false}
      styles={{ body: { padding: 0 } }}
      className="adm-drawer"
    >
      <div className="adm-drawer-layout">
        <button className="adm-floating-close" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="adm-left-pane">
          <div className="adm-pane-header">
            <div className="adm-file-info">
              <span className="material-symbols-outlined text-outline">picture_as_pdf</span>
              <span className="adm-filename">{resume?.title || 'CV.pdf'}</span>
            </div>
            <div className="adm-header-actions">
              <button className="adm-action-icon" onClick={() => setZoom(z => Math.max(z - 15, 50))} title="Thu nhỏ">
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
              <button className="adm-action-icon" onClick={() => setZoom(z => Math.min(z + 15, 200))} title="Phóng to">
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button className="adm-action-icon" onClick={handleDownload} disabled={downloading} title="Tải xuống">
                {downloading ? <Spin size="small" /> : <span className="material-symbols-outlined">download</span>}
              </button>
            </div>
          </div>

          <div className="adm-pdf-viewer-body">
            {previewing ? (
              <div className="adm-pdf-loading">
                <Spin size="large" />
                <span>Đang tải file CV...</span>
              </div>
            ) : resume?.isOnlineCv ? (
              <div className="adm-online-cv-wrapper" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.1s ease-out' }}>
                <div className="adm-online-cv-paper">
                  {(() => {
                    try {
                      const content = resume.contentJson ? JSON.parse(resume.contentJson) : null
                      if (!content) return (
                        <div className="adm-online-fallback-wrap">
                          <h2 className="adm-online-fallback-title">Online CV: {resume.title}</h2>
                        </div>
                      )
                      return renderTemplate(resume.templateId ?? 1, content)
                    } catch {
                      return (
                        <div className="adm-online-fallback-wrap">
                          <h2 className="adm-online-fallback-title">Online CV: {resume.title}</h2>
                        </div>
                      )
                    }
                  })()}
                  {application.coverLetter && (
                    <div className="adm-online-section" style={{ padding: '20px 48px 48px 48px' }}>
                      <h3 style={{ borderBottom: '1px solid #e9e8e8', paddingBottom: 8, color: '#002660', fontSize: '16px', fontWeight: 700 }}>Cover Letter:</h3>
                      <p style={{ whiteSpace: 'pre-wrap', color: '#434651', marginTop: 10, fontSize: '14px', lineHeight: '1.6' }}>{application.coverLetter}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : previewUrl ? (
              <div className="adm-pdf-iframe-container">
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=${zoom}`}
                  title="CV Preview"
                />
              </div>
            ) : (
              <div className="adm-pdf-loading">
                <span>Không có file xem trước. Vui lòng tải xuống.</span>
              </div>
            )}
          </div>
        </div>

        <div className="adm-right-pane">
          <div className="adm-ai-glass-bg"></div>

          <div className="adm-ai-scrollable">
            <div className="adm-ai-header">
              <div className="adm-candidate-meta">
                <div className="adm-ai-badge-complete">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  <span className="text-[11px] font-bold tracking-widest uppercase">
                    {hasAiResult ? 'AI Analysis Complete' : 'AI Analysis Pending'}
                  </span>
                </div>
                <h2 className="adm-candidate-name">{candidateName}</h2>
                <p className="adm-applied-time">
                  Applied {dayjs(createdDate).locale('vi').fromNow()}
                </p>
                <div className="adm-status-select-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#434651' }}>Trạng thái:</span>
                  <Select
                    value={tempStatus}
                    options={STATUS_OPTIONS}
                    style={{ flex: 1, minWidth: 120 }}
                    onChange={v => setTempStatus(v)}
                  />
                  <Tag color={APPLICATION_STATUS_COLOR[tempStatus]} style={{ borderRadius: 99, fontWeight: 700, margin: 0 }}>
                    {APPLICATION_STATUS_LABEL[tempStatus]}
                  </Tag>
                </div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#434651' }}>Ghi chú duyệt:</span>
                  <textarea
                    rows={2}
                    value={note}
                    placeholder="Nhập ghi chú cho ứng viên..."
                    onChange={e => setNote(e.target.value)}
                    className="adm-review-note-input"
                  />
                </div>
              </div>

              <div className="adm-score-ring">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-surface-variant"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                    stroke="currentColor"
                  />
                  <path
                    className="stroke-secondary"
                    strokeDasharray={hasAiResult ? `${aiPct}, 100` : '0, 100'}
                    strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                    stroke="currentColor"
                  />
                </svg>
                <div className="adm-score-ring-text">
                  <span className="score-num">{hasAiResult ? `${aiPct}%` : '--'}</span>
                  <span className="score-label">Match</span>
                </div>
              </div>
            </div>

            <hr className="adm-divider" />

            <div className="adm-section">
              <h3 className="adm-section-title">
                <span className="material-symbols-outlined text-[18px]">code</span>
                Extracted Skills
              </h3>
              <div className="adm-skill-tags">
                {skills.length > 0
                  ? skills.map((skill, index) => (
                      <span
                        key={skill}
                        className={`adm-skill-tag ${index < 3 ? 'adm-skill-tag--highlight' : 'adm-skill-tag--default'}`}
                      >
                        {skill}
                      </span>
                    ))
                  : <span className="adm-skill-tag adm-skill-tag--default">No AI data</span>}
              </div>
            </div>

            <div className="adm-pros-cons">
              <div className="adm-pros-card">
                <h4 className="adm-card-title text-secondary">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Strengths
                </h4>
                <ul>
                  {strengths.length > 0
                    ? strengths.map((item, idx) => <li key={idx}>{item}</li>)
                    : <EmptyLine>Chưa có dữ liệu điểm mạnh.</EmptyLine>}
                </ul>
              </div>

              <div className="adm-cons-card">
                <h4 className="adm-card-title text-error">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  Concerns
                </h4>
                <ul>
                  {weaknesses.length > 0
                    ? weaknesses.map((item, idx) => <li key={idx}>{item}</li>)
                    : <EmptyLine>Chưa có dữ liệu cần lưu ý.</EmptyLine>}
                </ul>
              </div>
            </div>

            <div className="adm-evaluator-card">
              <div className="adm-evaluator-quote">
                <span className="material-symbols-outlined">format_quote</span>
              </div>
              <h3 className="adm-evaluator-title">AI Evaluator Notes</h3>
              <p className="adm-evaluator-text">{feedback}</p>
            </div>

            {reviewNote && (
              <div className="adm-review-note-box">
                <h3>Ghi chú nội bộ:</h3>
                <p>{reviewNote}</p>
              </div>
            )}
          </div>

          <div className="adm-ai-footer">
            <div className="adm-footer-buttons">
              <button className="adm-btn-reject" onClick={onClose}>
                <span className="material-symbols-outlined">close</span>
                Hủy
              </button>
              <button className="adm-btn-approve" onClick={() => onUpdateStatus(id, tempStatus, note)}>
                <span className="material-symbols-outlined">save</span>
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

export default ApplicationDetailModal
