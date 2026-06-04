import { Link, useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import type { IJob } from '../../../types/job'
import HomeJobCard from './HomeJobCard'

interface RecommendedJobsProps {
  jobs: IJob[]
  savedJobIds: Set<string>
  onToggleSave: (e: React.MouseEvent, job: IJob) => void;
  loading: boolean
  isAIRecommended?: boolean  // true = dữ liệu từ AI, false = fallback từ newest jobs
}

const RecommendedJobs = ({ jobs, savedJobIds, onToggleSave, loading, isAIRecommended = false }: RecommendedJobsProps) => {
  const navigate = useNavigate()

  return (
    <section className="home-jobs">
      <div className="home-jobs__header">
        <div>
          <h2 className="home-jobs__title">
            {isAIRecommended ? (
              <span className="material-symbols-outlined">auto_awesome</span>
            ) : (
              <span className="material-symbols-outlined" style={{ color: '#f97316' }}>trending_up</span>
            )}
            {isAIRecommended ? 'AI Đề Xuất' : 'Việc Làm Phổ Biến'}
          </h2>
          <p className="home-jobs__desc">
            {isAIRecommended
              ? 'Các vị trí phù hợp nhất dựa trên hồ sơ của bạn.'
              : 'Những công việc IT đang được quan tâm nhiều nhất.'}
          </p>
        </div>
        <Link to="/jobs" className="home-jobs__link">
          Xem tất cả <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
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
