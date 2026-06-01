import { useState } from 'react'
import { Button, Tag, Tooltip, Popconfirm, message } from 'antd'
import { DownloadOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { IApplication, ApplicationStatus } from '../../../types/application'
import type { CvScoringResult } from '../../../services/ai-service'
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_COLOR,
} from '../../../types/application'

// AI match score (static placeholder — replace with real data when backend supports it)
const AI_TIER = (pct: number) => {
  if (pct >= 90) return 'Xuất sắc'
  if (pct >= 75) return 'Phù hợp cao'
  if (pct >= 60) return 'Tiềm năng'
  return 'Thấp'
}

interface Props {
  application: IApplication
  onView: (app: IApplication) => void
  onUpdateStatus: (id: string, status: ApplicationStatus) => void
  downloadUrl: (resumeId: string) => string
  aiResult?: CvScoringResult
}

/** Card hiển thị 1 ứng viên — avatar fallback, AI score ring, action buttons */
const ApplicationCard = ({ application, onView, onUpdateStatus, downloadUrl, aiResult }: Props) => {
  const { id, customerId, resume, status, createdDate } = application
  const isRejected = status === 'REJECTED'
  const hasAiScore = typeof aiResult?.matching_score === 'number'
  const aiPct      = hasAiScore ? Math.round(aiResult.matching_score) : 0
  const dashArray  = hasAiScore ? `${aiPct}, 100` : '0, 100'
  const ringColor  = isRejected ? '#c3c6d3' : '#002660'

  // candidate display name: use resume title as proxy (no profile API call here)
  const candidateName  = resume?.title ?? 'Ứng viên'
  const initial        = candidateName.charAt(0).toUpperCase()

  const statusColor = APPLICATION_STATUS_COLOR[status] ?? 'default'
  const statusLabel = APPLICATION_STATUS_LABEL[status] ?? status

  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!resume?.id) return
    setDownloading(true)
    try {
      const token = localStorage.getItem('access_token')
      const baseUrl = import.meta.env.VITE_BACKEND_URL ?? ''
      const res = await fetch(`${baseUrl}${downloadUrl(resume.id)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resume.title || 'CV'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('Không thể tải file CV. Vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={`jap-card${isRejected ? ' jap-card--rejected' : ''}`}>

      {/* ── LEFT: identity ── */}
      <div className="jap-card-left">
        <div className="jap-avatar-fallback">{initial}</div>
        <div>
          <h3 className="jap-candidate-name">{candidateName}</h3>
          <p className="jap-candidate-title">{resume?.isOnlineCv ? 'Online CV' : 'File CV'}</p>
          <div className="jap-candidate-location">
            <span className="material-symbols-outlined">person</span>
            ID: {customerId.slice(0, 8)}…
          </div>
        </div>
      </div>

      {/* ── MIDDLE: tags + meta ── */}
      <div className="jap-card-middle">
        <div className="jap-skill-tags">
          {resume?.isOnlineCv ? (
            <span className="jap-skill-tag">Online CV</span>
          ) : (
            <span className="jap-skill-tag">File CV</span>
          )}
        </div>
        <div className="jap-meta-row">
          <div className="jap-meta-item">
            <span className="jap-meta-label">Ngày nộp</span>
            <span className="jap-meta-val">{dayjs(createdDate).format('DD/MM/YYYY')}</span>
          </div>
          <div className="jap-meta-item">
            <span className="jap-meta-label">Trạng thái</span>
            <Tag color={statusColor} style={{ borderRadius: 99, fontWeight: 700, fontSize: 12 }}>
              {statusLabel}
            </Tag>
          </div>
        </div>
      </div>

      {/* ── RIGHT: AI score + actions ── */}
      <div className="jap-card-right">
        {/* AI match ring */}
        <div className={`jap-ai-badge${isRejected ? ' opacity-60' : ''}`}>
          <div className="jap-ai-ring">
            <svg viewBox="0 0 36 36" width="48" height="48">
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke={isRejected ? '#e3e2e2' : 'rgba(0,93,170,0.12)'}
                strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke={ringColor}
                strokeWidth="3"
                strokeDasharray={dashArray}
                strokeLinecap="round"
              />
            </svg>
            <span className="ring-pct">{hasAiScore ? `${aiPct}%` : '--'}</span>
          </div>
          <div className="jap-ai-info">
            <span className="ai-label">AI Match</span>
            <span className="ai-tier">{hasAiScore ? AI_TIER(aiPct) : 'Chưa chấm'}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="jap-actions">
          {/* Download CV */}
          {resume?.id && !resume.isOnlineCv && (
            <Tooltip title="Tải CV">
              <Button
                icon={<DownloadOutlined />}
                loading={downloading}
                onClick={handleDownload}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          )}

          {/* View detail */}
          <Button
            type="primary"
            icon={<EyeOutlined />}
            style={{ flex: 1, borderRadius: 8, background: '#002660', borderColor: '#002660', fontWeight: 700 }}
            onClick={() => onView(application)}
          >
            Xem hồ sơ
          </Button>

          {/* Reject (only if not already rejected/approved) */}
          {status === 'PENDING' || status === 'REVIEWING' ? (
            <Popconfirm
              title="Từ chối đơn này?"
              onConfirm={() => onUpdateStatus(id, 'REJECTED')}
              okText="Xác nhận"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Từ chối">
                <Button
                  danger
                  icon={<CloseOutlined />}
                  style={{ borderRadius: 8 }}
                />
              </Tooltip>
            </Popconfirm>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ApplicationCard
