import { Button, Tag } from 'antd'
import { BookOutlined, BookFilled } from '@ant-design/icons'
import type { IJob } from '../../../types/job'
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from '../../../types/job'
import { formatTimeAgo } from '../common/TimeAgo/TimeAgo'
import { LEVEL_COLOR } from '../job-detail/jobDetailHelpers'

interface Props {
  job: IJob
  isSaved: boolean
  onToggleSave: (e: React.MouseEvent, job: IJob) => void
  onCardClick: (jobId: string) => void
}

const JobCard = ({ job, isSaved, onToggleSave, onCardClick }: Props) => {
  const formatSalary = (job: IJob): string => {
    if (job.isSalaryNegotiable) return 'Thương lượng'
    if (!job.salaryMin && !job.salaryMax) return 'Thương lượng'
    const cur = job.salaryCurrency ?? 'VND'
    if (cur === 'USD') {
      const min = job.salaryMin ? `$${job.salaryMin.toLocaleString('en-US')}` : ''
      const max = job.salaryMax ? `$${job.salaryMax.toLocaleString('en-US')}` : ''
      return min && max ? `${min} – ${max}` : min || max
    }
    const fmt = (n?: number) => n ? `${(n / 1_000_000).toFixed(0)}M` : ''
    const min = fmt(job.salaryMin)
    const max = fmt(job.salaryMax)
    return min && max ? `${min} – ${max} ₫` : (min || max) ? `${min || max} ₫` : 'Thương lượng'
  }



  const isRemote = (job: IJob) => job.jobType === 'REMOTE' || job.jobType === 'HYBRID'

  return (
    <div
      className="job-card-item group"
      style={{ cursor: 'pointer' }}
      onClick={() => onCardClick(job.id)}
    >
      {/* Company logo */}
      <div className="card-main-header">
        <div className="company-logo-container">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.companyName ?? job.name}
              className="company-logo"
              style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 10, border: '1px solid #f0f0f0' }}
            />
          ) : (
            <div
              style={{
                width: 48, height: 48, borderRadius: 10,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 20,
              }}
            >
              {(job.companyName ?? job.name).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="job-details-text">
          <h3 className="job-title-heading">{job.name}</h3>
          <div className="company-location-row">
            {job.companyName && (
              <span className="company-name" style={{ fontWeight: 500, color: '#555' }}>{job.companyName}</span>
            )}
            {job.companyName && <span className="separator">•</span>}
            <Tag color={LEVEL_COLOR[job.level] ?? 'default'} style={{ marginRight: 6, fontWeight: 600 }}>
              {JOB_LEVEL_LABEL[job.level]}
            </Tag>
            <span className="separator">•</span>
            <span className="location-info">
              {isRemote(job) ? (
                <span className="material-symbols-outlined inline-icon">public</span>
              ) : (
                <span className="material-symbols-outlined inline-icon">location_on</span>
              )}
              {job.location || (isRemote(job) ? 'Remote' : 'Chưa cập nhật')}
            </span>
          </div>
        </div>

        <button
          className={`btn-bookmark ${isSaved ? 'btn-bookmark--active' : ''}`}
          onClick={e => onToggleSave(e, job)}
          style={{ flexShrink: 0, marginLeft: 8 }}
        >
          {isSaved ? <BookFilled /> : <BookOutlined />}
        </button>
      </div>

      {/* Skills */}
      {job.skills.length > 0 && (
        <div className="card-tags-container">
          {job.skills.slice(0, 5).map(s => (
            <span key={s.id} className="job-tag">{s.name}</span>
          ))}
          {job.skills.length > 5 && (
            <span className="job-tag">+{job.skills.length - 5}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="card-footer-row">
        <div className="footer-meta">
          <span className="salary-range-badge">{formatSalary(job)}</span>
          <span className="job-tag" style={{ marginLeft: 8 }}>{JOB_TYPE_LABEL[job.jobType]}</span>
          <span className="posted-time">{formatTimeAgo(job.createdDate)}</span>
        </div>
        <Button
          className="btn-apply-now"
          type="primary"
          onClick={e => { e.stopPropagation(); onCardClick(job.id) }}
        >
          Xem chi tiết
        </Button>
      </div>
    </div>
  )
}

export default JobCard
