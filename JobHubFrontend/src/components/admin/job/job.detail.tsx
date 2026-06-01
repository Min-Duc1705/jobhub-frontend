import { Drawer, Descriptions, Tag, Space, Divider, Avatar } from 'antd'
import dayjs from 'dayjs'

import type { IJob, JobStatus, JobLevel, JobType } from '../../../types/job'
import {
  JOB_STATUS_LABEL, JOB_STATUS_COLOR,
  JOB_LEVEL_LABEL, JOB_TYPE_LABEL
} from '../../../types/job'

interface Props {
  open: boolean
  onClose: () => void
  data: IJob | null
}

const JOB_CATEGORY_LABEL: Record<string, string> = {
  Engineering: 'Kỹ thuật & Công nghệ',
  Marketing: 'Tiếp thị & Truyền thông',
  Sales: 'Kinh doanh & Bán hàng',
  Other: 'Khác',
}

const DetailJobDrawer = ({ open, onClose, data }: Props) => {
  if (!data) return null

  const getSalaryDisplay = () => {
    if (data.isSalaryNegotiable) {
      return <Tag color="green">Thoả thuận</Tag>
    }
    const min = data.salaryMin ? data.salaryMin.toLocaleString() : '—'
    const max = data.salaryMax ? data.salaryMax.toLocaleString() : '—'
    return `${min} - ${max} ${data.salaryCurrency}`
  }

  return (
    <Drawer
      title={
        <Space>
          <span style={{ fontWeight: 700, color: '#002660', fontSize: 16 }}>
            🔍 Chi tiết tin tuyển dụng #{data.id.substring(0, 8)}
          </span>
        </Space>
      }
      placement="right"
      width={720}
      onClose={onClose}
      open={open}
      destroyOnClose
    >
      {/* Header Info */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <Avatar
          src={data.companyLogo}
          alt={data.companyName}
          shape="square"
          size={64}
          style={{ border: '1px solid #f0f0f0', backgroundColor: '#fff' }}
        >
          {data.companyName?.substring(0, 1).toUpperCase()}
        </Avatar>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: 20, color: '#1f1f1f', fontWeight: 600 }}>{data.name}</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#555', fontWeight: 500 }}>{data.companyName}</span>
            <span style={{ color: '#d9d9d9' }}>|</span>
            <Tag color={JOB_STATUS_COLOR[data.status as JobStatus] ?? 'default'}>
              {JOB_STATUS_LABEL[data.status as JobStatus] ?? data.status}
            </Tag>
          </div>
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Thông tin chi tiết */}
      <Descriptions title="Thông tin cơ bản" bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Cấp độ">
          {JOB_LEVEL_LABEL[data.level as JobLevel] ?? data.level}
        </Descriptions.Item>
        <Descriptions.Item label="Hình thức">
          <Tag color="blue">{JOB_TYPE_LABEL[data.jobType as JobType] ?? data.jobType}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Ngành nghề">
          {JOB_CATEGORY_LABEL[data.category ?? 'Other'] ?? data.category ?? 'Khác'}
        </Descriptions.Item>
        <Descriptions.Item label="Số lượng tuyển">
          {data.quantity} người
        </Descriptions.Item>
        <Descriptions.Item label="Mức lương" span={2}>
          {getSalaryDisplay()}
        </Descriptions.Item>
        <Descriptions.Item label="Địa điểm" span={2}>
          {data.location ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Kinh nghiệm">
          {data.experienceRequired ?? 'Không yêu cầu'}
        </Descriptions.Item>
        <Descriptions.Item label="Lượt xem">
          {data.viewCount.toLocaleString()} lượt
        </Descriptions.Item>
        <Descriptions.Item label="Ngày đăng">
          {data.startDate ? dayjs(data.startDate).format('DD/MM/YYYY') : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Hạn nộp">
          <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
            {data.endDate ? dayjs(data.endDate).format('DD/MM/YYYY') : '—'}
          </span>
        </Descriptions.Item>
      </Descriptions>

      {/* Kỹ năng yêu cầu */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f', marginBottom: 10 }}>Kỹ năng yêu cầu</h3>
        <Space size={8} wrap>
          {data.skills?.length > 0 ? (
            data.skills.map(s => (
              <Tag key={s.id} color="purple" style={{ padding: '4px 12px', borderRadius: 4, fontSize: 13 }}>
                {s.name}
              </Tag>
            ))
          ) : (
            <span style={{ color: '#8c8c8c' }}>Không yêu cầu kỹ năng cụ thể</span>
          )}
        </Space>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Nội dung chi tiết */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {data.description && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f', marginBottom: 8 }}>Mô tả công việc</h3>
            <div
              className="quill-content"
              style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 8, lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: data.description }}
            />
          </div>
        )}

        {data.requirements && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f', marginBottom: 8 }}>Yêu cầu ứng viên</h3>
            <div
              className="quill-content"
              style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 8, lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: data.requirements }}
            />
          </div>
        )}

        {data.benefits && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f', marginBottom: 8 }}>Phúc lợi</h3>
            <div
              className="quill-content"
              style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 8, lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: data.benefits }}
            />
          </div>
        )}
      </div>

      <Divider style={{ margin: '20px 0' }} />
      
      <div style={{ color: '#8c8c8c', fontSize: 12, textAlign: 'right' }}>
        Tạo ngày: {dayjs(data.createdDate).format('DD/MM/YYYY HH:mm')} 
        {data.lastModifiedDate && ` | Cập nhật cuối: ${dayjs(data.lastModifiedDate).format('DD/MM/YYYY HH:mm')}`}
      </div>
    </Drawer>
  )
}

export default DetailJobDrawer
