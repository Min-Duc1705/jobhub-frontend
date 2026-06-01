import { Button, Tooltip, Popconfirm } from 'antd'
import { CalendarOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import './JobCandidateComponents.scss'

interface Props {
  savedJob: any
  onUnsave: (jobId: string) => void
  onApply: (jobId: string) => void
}

const SavedJobCard = ({ savedJob, onUnsave, onApply }: Props) => {
  const { jobId, savedAt, job } = savedJob

  const jobTitle = job?.name ?? 'Đang tải vị trí...'
  const companyName = job?.companyName ?? 'Đang tải công ty...'
  const companyLogo = job?.companyLogo
  const location = job?.location ?? 'Đang tải địa điểm...'

  // Salary format
  const formatSalary = () => {
    if (job?.isSalaryNegotiable) return 'Thỏa thuận'
    if (job?.salaryMin && job?.salaryMax) {
      return `${(job.salaryMin / 1000000).toFixed(0)}tr - ${(job.salaryMax / 1000000).toFixed(0)}tr ${job.salaryCurrency || 'VND'}`
    }
    if (job?.salaryMin) return `Từ ${(job.salaryMin / 1000000).toFixed(0)}tr ${job.salaryCurrency || 'VND'}`
    if (job?.salaryMax) return `Đến ${(job.salaryMax / 1000000).toFixed(0)}tr ${job.salaryCurrency || 'VND'}`
    return 'Lương thỏa thuận'
  }

  return (
    <div className="cjp-job-card">
      <div className="cjp-job-card-inner">
        
        {/* Company Logo */}
        <div className="cjp-job-card-logo">
          {companyLogo ? (
            <img src={companyLogo} alt={companyName} />
          ) : (
            <span className="material-symbols-outlined">corporate_fare</span>
          )}
        </div>

        {/* Job Info */}
        <div className="cjp-job-card-body">
          <div className="cjp-job-card-title-row">
            <h4>{jobTitle}</h4>
            <span style={{ color: '#2d7a4f', fontWeight: 600, fontSize: 14 }}>
              {formatSalary()}
            </span>
          </div>
          <p className="cjp-job-card-company">{companyName} • {location}</p>
          
          <div className="cjp-job-card-meta">
            <div className="meta-item">
              <CalendarOutlined />
              <span>Đã lưu: {dayjs(savedAt).format('DD/MM/YYYY')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="cjp-job-card-actions">
          <Button 
            type="primary" 
            style={{ borderRadius: 8, background: '#005daa', borderColor: '#005daa', fontWeight: 600 }}
            onClick={() => onApply(jobId)}
            icon={<SendOutlined />}
            className="flex items-center justify-center"
          >
            Ứng tuyển ngay
          </Button>

          <Popconfirm
            title="Bỏ lưu tin tuyển dụng này?"
            onConfirm={() => onUnsave(jobId)}
            okText="Bỏ lưu"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button 
              danger
              style={{ borderRadius: 8, fontWeight: 500 }}
              icon={<DeleteOutlined />}
              className="flex items-center justify-center"
            >
              Bỏ lưu
            </Button>
          </Popconfirm>
        </div>

      </div>
    </div>
  )
}

export default SavedJobCard
