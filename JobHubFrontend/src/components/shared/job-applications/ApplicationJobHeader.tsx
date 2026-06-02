import type { IJob } from '../../../types/job'
import TimeAgo from '../common/TimeAgo/TimeAgo'

interface Props {
  job: IJob | null
  total: number
  totalApproved: number
}

/** Header card hiển thị tên job, trạng thái, thống kê số lượng */
const ApplicationJobHeader = ({ job, total, totalApproved }: Props) => {
  if (!job) return null

  return (
    <div className="jap-job-header">
      <div className="jap-job-header-inner">
        <div className="jap-job-info">
          <div className="jap-job-badge-row">
            <span className="jap-job-active-badge">
              <span className="dot" />
              {job.status === 'PUBLISHED' ? 'Đang tuyển' : job.status}
            </span>
            {job.location && (
              <span style={{ fontSize: 13, color: '#747783', display: 'flex', alignItems: 'center', gap: 2 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                {job.location}
              </span>
            )}
          </div>
          <h1 className="jap-job-title">{job.name}</h1>
          <p className="jap-job-meta">
            {job.companyName ?? 'Công ty'} &nbsp;•&nbsp; Đã đăng&nbsp;
            <span style={{ color: '#005daa', fontWeight: 600 }}>
              <TimeAgo date={job.createdDate} />
            </span>
          </p>
        </div>

        <div className="jap-stats-group">
          <div className="jap-stat-item">
            <span className="stat-num" style={{ color: '#002660' }}>{total}</span>
            <span className="stat-label">Ứng viên</span>
          </div>
          <div className="jap-stat-item">
            <span className="stat-num" style={{ color: '#005daa' }}>{totalApproved}</span>
            <span className="stat-label">Đã duyệt</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicationJobHeader
