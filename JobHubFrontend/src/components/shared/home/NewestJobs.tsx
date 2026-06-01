import { Link, useNavigate } from 'react-router-dom'
import { Spin, Empty } from 'antd'
import type { IJob } from '../../../types/job'
import HomeJobCard from './HomeJobCard'

interface NewestJobsProps {
  jobs: IJob[]
  savedJobIds: Set<string>
  onToggleSave: (e: React.MouseEvent, job: IJob) => void;
  loading: boolean
}

const NewestJobs = ({ jobs, savedJobIds, onToggleSave, loading }: NewestJobsProps) => {
  const navigate = useNavigate()

  return (
    <section className="home-jobs" style={{ borderTop: '1px solid #f0f0f0', paddingTop: 48 }}>
      <div className="home-jobs__header">
        <div>
          <h2 className="home-jobs__title">
            <span className="material-symbols-outlined" style={{ color: '#0ea5e9' }}>new_releases</span>
            Việc Làm Mới Nhất
          </h2>
          <p className="home-jobs__desc">Những cơ hội nghề nghiệp IT vừa mới được đăng tải.</p>
        </div>
        <Link to="/jobs?sortBy=createdDate" className="home-jobs__link">
          Xem tất cả <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : jobs.length === 0 ? (
        <Empty description="Không có việc làm mới nào" style={{ padding: '40px 0' }} />
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

export default NewestJobs
