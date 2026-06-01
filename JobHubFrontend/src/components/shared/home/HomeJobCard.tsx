import { BookOutlined, BookFilled } from '@ant-design/icons'
import type { IJob } from '../../../types/job'
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from '../../../types/job'

interface Props {
  job: IJob
  isSaved: boolean
  onToggleSave: (e: React.MouseEvent, job: IJob) => void
  onCardClick: (jobId: string) => void
}

const HomeJobCard = ({ job, isSaved, onToggleSave, onCardClick }: Props) => {
  const getCityName = (loc?: string): string => {
    if (!loc) return 'Chưa cập nhật'
    const parts = loc.split(',')
    let lastPart = parts[parts.length - 1].trim()
    if (['việt nam', 'vietnam', 'viet nam', 'vn'].includes(lastPart.toLowerCase()) && parts.length > 1) {
      lastPart = parts[parts.length - 2].trim()
    }
    return lastPart || 'Chưa cập nhật'
  }

  const formatSalary = (job: IJob): string => {
    if (job.isSalaryNegotiable) return 'Thương lượng'
    if (!job.salaryMin && !job.salaryMax) return 'Thương lượng'
    const cur = job.salaryCurrency ?? 'VND'
    if (cur === 'USD') {
      const min = job.salaryMin ? `$${job.salaryMin.toLocaleString('en-US')}` : ''
      const max = job.salaryMax ? `$${job.salaryMax.toLocaleString('en-US')}` : ''
      return min && max ? `${min} – ${max}` : min || max
    }
    const fmt = (n?: number) => n ? `${(n / 1_000_000).toFixed(0)}tr` : ''
    const min = fmt(job.salaryMin)
    const max = fmt(job.salaryMax)
    return min && max ? `${min} - ${max}` : (min || max) ? `${min || max}` : 'Thương lượng'
  }

  const companyInitial = (job.companyName ?? job.name).charAt(0).toUpperCase()

  return (
    <div className="job-card" onClick={() => onCardClick(job.id)}>
      <button
        className={`job-card__save ${isSaved ? 'job-card__save--saved' : ''}`}
        onClick={e => onToggleSave(e, job)}
      >
        {isSaved ? <BookFilled style={{ fontSize: 18 }} /> : <BookOutlined style={{ fontSize: 18 }} />}
      </button>

      <div className="job-card__header">
        <div className="job-card__logo">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.companyName ?? job.name} />
          ) : (
            <div className="job-card__logo-fallback">
              {companyInitial}
            </div>
          )}
        </div>
        <div className="job-card__info">
          <h3 className="job-card__title">{job.name}</h3>
          <p className="job-card__company">
            {job.companyName ?? 'Công ty'}
          </p>
        </div>
      </div>

      <div className="job-card__tags">
        <span className="job-card__tag job-card__tag--primary">
          {JOB_LEVEL_LABEL[job.level]}
        </span>
        <span className="job-card__tag job-card__tag--secondary">
          {JOB_TYPE_LABEL[job.jobType]}
        </span>
        {job.skills.slice(0, 2).map(s => (
          <span key={s.id} className="job-card__tag job-card__tag--default">
            {s.name}
          </span>
        ))}
        {job.skills.length > 2 && (
          <span className="job-card__tag job-card__tag--default">
            +{job.skills.length - 2}
          </span>
        )}
      </div>

      <div className="job-card__footer">
        <span className="job-card__location">
          <span className="material-symbols-outlined">location_on</span>
          {getCityName(job.location)}
        </span>
        <span className="job-card__salary">{formatSalary(job)}</span>
      </div>
    </div>
  )
}

export default HomeJobCard
