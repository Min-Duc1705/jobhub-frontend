import { Button, Tag } from 'antd'
import { BookOutlined, SendOutlined } from '@ant-design/icons'
import type { IJob } from '../../../types/job'
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from '../../../types/job'
import { LEVEL_COLOR, TYPE_COLOR, formatSalary, timeAgo } from './jobDetailHelpers'

interface Props {
  job: IJob
  companyName: string
  companyLogo?: string
  salaryText: string
  saved: boolean
  alreadyApplied: boolean
  onToggleSave: () => void
  onApply: () => void
}

const JobDetailHeader = ({
  job, companyName, companyLogo, salaryText,
  saved, alreadyApplied, onToggleSave, onApply,
}: Props) => {
  const companyInitial = companyName.charAt(0).toUpperCase()

  return (
    <div className="jd-header-card">
      <div className="jd-header-top">
        {companyLogo
          ? <img src={companyLogo} alt={companyName} className="jd-company-logo" />
          : <div className="jd-company-logo-fallback">{companyInitial}</div>
        }

        <div className="jd-header-info">
          <h1 className="jd-title">{job.name}</h1>
          <div className="jd-badges">
            <Tag color={TYPE_COLOR[job.jobType] ?? 'default'}>{JOB_TYPE_LABEL[job.jobType] ?? job.jobType}</Tag>
            <Tag color={LEVEL_COLOR[job.level]  ?? 'default'}>{JOB_LEVEL_LABEL[job.level]  ?? job.level}</Tag>
            {job.status === 'PUBLISHED' && <Tag color="green">Đang tuyển</Tag>}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8, fontSize: 15, color: '#005daa', fontWeight: 600, verticalAlign: 'middle' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#005daa' }}>payments</span>
              {salaryText}
            </span>
          </div>
          <div className="jd-meta-row">
            <div className="jd-meta-item">
              <span className="material-symbols-outlined">business</span>
              <span>{companyName}</span>
            </div>
            {job.location && (
              <div className="jd-meta-item">
                <span className="material-symbols-outlined">location_on</span>
                <span>{job.location}</span>
              </div>
            )}
            <div className="jd-meta-item">
              <span className="material-symbols-outlined">schedule</span>
              <span style={{ color: '#747783', fontStyle: 'italic' }}>{timeAgo(job.createdDate)}</span>
            </div>
          </div>
        </div>

        <div className="jd-header-actions">
          <Button
            icon={<BookOutlined />}
            type={saved ? 'primary' : 'default'}
            onClick={onToggleSave}
            style={{ borderColor: '#005daa', color: saved ? undefined : '#005daa' }}
          >
            {saved ? 'Đã lưu' : 'Lưu tin'}
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            disabled={alreadyApplied}
            style={alreadyApplied
              ? { background: '#52c41a', borderColor: '#52c41a', fontWeight: 700, color: '#fff' }
              : { background: '#002660', borderColor: '#002660', fontWeight: 700 }
            }
            onClick={alreadyApplied ? undefined : onApply}
          >
            {alreadyApplied ? '✓ Đã ứng tuyển' : 'Ứng tuyển ngay'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default JobDetailHeader
