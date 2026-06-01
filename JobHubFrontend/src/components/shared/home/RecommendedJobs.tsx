import { Link, useNavigate } from 'react-router-dom'
import { Spin, Empty } from 'antd'
import type { IJob } from '../../../types/job'
import HomeJobCard from './HomeJobCard'

interface RecommendedJobsProps {
  jobs: IJob[]
  savedJobIds: Set<string>
  onToggleSave: (e: React.MouseEvent, job: IJob) => void;
  loading: boolean
}

const RecommendedJobs = ({ jobs, savedJobIds, onToggleSave, loading }: RecommendedJobsProps) => {
  const navigate = useNavigate()

  return (
    <section className="home-jobs">
      <div className="home-jobs__header">
        <div>
          <h2 className="home-jobs__title">
            <span className="material-symbols-outlined">auto_awesome</span>
            AI Đề Xuất
          </h2>
          <p className="home-jobs__desc">Các vị trí phù hợp nhất dựa trên hồ sơ của bạn.</p>
        </div>
        <Link to="/jobs" className="home-jobs__link">
          Xem tất cả <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : jobs.length === 0 ? (
        <Empty description="Không tìm thấy công việc đề xuất nào" style={{ padding: '40px 0' }} />
      ) : (
        <div className="home-jobs__grid">
          {jobs.map(job => (
            <HomeJobCard
              key={job.id}
              job={job}
              isSaved={savedJobIds.has(job.id)}
              onToggleSave={onToggleSave}
              onCardClick={id => navigate(`/jobs/${id}`)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default RecommendedJobs
