import { Button, Tag, Popconfirm } from 'antd'
import { CalendarOutlined, MessageOutlined, FileTextOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { IApplication } from '../../../types/application'
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_COLOR } from '../../../types/application'
import type { IJob } from '../../../types/job'
import './JobCandidateComponents.scss'

interface Props {
  application: IApplication
  job: IJob | null
  onViewDetail: () => void
  onWithdraw: (id: string) => void
}

const AppliedJobCard = ({ application, job, onViewDetail, onWithdraw }: Props) => {
  const { status, createdDate } = application

  // Use values from fetched job, or fallbacks if not resolved yet
  const jobTitle = job?.name ?? 'Đang tải vị trí...'
  const companyName = job?.companyName ?? 'Đang tải công ty...'
  const companyLogo = job?.companyLogo
  const location = job?.location ?? 'Đang tải địa điểm...'

  const statusLabel = APPLICATION_STATUS_LABEL[status] ?? status
  const statusColor = APPLICATION_STATUS_COLOR[status] ?? 'default'

  // If status is APPROVED, it might mean scheduled interview in our mock context,
  // we can display the reviewNote if it exists.
  const hasInterview = status === 'APPROVED' && application.reviewNote

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
            <Tag color={statusColor} style={{ borderRadius: 99, fontWeight: 700, margin: 0 }}>
              {statusLabel}
            </Tag>
          </div>
          <p className="cjp-job-card-company">{companyName} • {location}</p>
          
          <div className="cjp-job-card-meta">
            <div className="meta-item">
              <CalendarOutlined />
              <span>Đã nộp: {dayjs(createdDate).format('DD/MM/YYYY')}</span>
            </div>
            
            {hasInterview && (
              <div className="meta-item" style={{ color: '#2d7a4f', fontWeight: 700 }}>
                <span className="material-symbols-outlined text-sm">event_available</span>
                <span>Lịch hẹn: {application.reviewNote}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="cjp-job-card-actions">
          <Button 
            type="primary" 
            style={{ borderRadius: 8, background: '#002660', borderColor: '#002660', fontWeight: 600 }}
            onClick={onViewDetail}
            icon={<FileTextOutlined />}
            className="flex items-center justify-center"
          >
            Xem chi tiết
          </Button>
          <Button 
            style={{ borderRadius: 8, fontWeight: 500 }}
            icon={<MessageOutlined />}
            className="flex items-center justify-center"
            onClick={() => window.open(`mailto:support@${job?.companyName?.toLowerCase().replace(/\s+/g, '') || 'company'}.com`)}
          >
            Gửi tin nhắn
          </Button>

          {status === 'PENDING' && (
            <Popconfirm
              title="Hủy nộp đơn ứng tuyển này?"
              description="Rút CV của bạn khỏi tin tuyển dụng này."
              onConfirm={() => onWithdraw(application.id)}
              okText="Hủy ứng tuyển"
              cancelText="Không"
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger
                style={{ borderRadius: 8, fontWeight: 500 }}
                icon={<CloseOutlined />}
                className="flex items-center justify-center"
              >
                Hủy ứng tuyển
              </Button>
            </Popconfirm>
          )}
        </div>

      </div>
    </div>
  )
}

export default AppliedJobCard
