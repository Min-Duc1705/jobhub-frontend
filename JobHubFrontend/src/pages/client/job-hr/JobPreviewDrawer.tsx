import { App, Drawer, Spin, Tag, Tooltip, Divider, Space } from 'antd'
import {
  EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ClockCircleOutlined, PauseCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { IJob, JobStatus, JobLevel, JobType } from '../../../types/job'
import {
  JOB_STATUS_LABEL, JOB_STATUS_COLOR,
  JOB_LEVEL_LABEL, JOB_TYPE_LABEL,
} from '../../../types/job'
import { changeJobStatusApi } from '../../../services/job-service'

const STATUS_ICON: Record<JobStatus, React.ReactNode> = {
  PUBLISHED: <CheckCircleOutlined style={{ color: '#2e7d32' }} />,
  DRAFT: <ClockCircleOutlined style={{ color: '#f57f17' }} />,
  CLOSED: <CloseCircleOutlined style={{ color: '#747783' }} />,
  SUSPENDED: <PauseCircleOutlined style={{ color: '#c62828' }} />,
}

interface Props {
  open: boolean
  job: IJob | null
  onClose: () => void
  onStatusChanged: () => void
}

const cleanHtml = (html: string | undefined | null) => {
  if (!html) return ''
  return html
    // Replace breaks or newlines that immediately follow a bullet/dash/dot list marker
    .replace(/([-\u2012-\u2015\u2022]\s*)(?:<br\s*\/?>|\n|\r\n)\s*/g, '$1')
    // Merge paragraph with only a dash/bullet/dot into the next paragraph
    .replace(/<p>\s*([-\u2012-\u2015\u2022])\s*<\/p>\s*<p>/g, '<p>$1 ')
}

const JobPreviewDrawer = ({ open, job, onClose, onStatusChanged }: Props) => {
  const { notification, modal } = App.useApp()

  if (!job) return null

  const handlePublish = () => {
    modal.confirm({
      title: 'Đăng tin tuyển dụng',
      content: 'Tin sẽ được hiển thị công khai. Bạn có chắc chắn muốn đăng tin này không?',
      okText: 'Đăng ngay',
      cancelText: 'Huỷ',
      okButtonProps: { style: { background: '#002660' } },
      onOk: async () => {
        await changeJobStatusApi(job.id, 'PUBLISHED')
        notification.success({ message: 'Đã đăng tin tuyển dụng!', duration: 2 })
        onStatusChanged()
        onClose()
      },
    })
  }

  const salaryText = job.isSalaryNegotiable
    ? 'Thoả thuận'
    : job.salaryMin != null
      ? `${job.salaryMin.toLocaleString()} – ${job.salaryMax?.toLocaleString() ?? '?'} ${job.salaryCurrency}`
      : 'Chưa cập nhật'

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={660}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <EyeOutlined style={{ color: '#005daa', fontSize: 18 }} />
          <span style={{ fontWeight: 700, color: '#002660' }}>Xem trước tin tuyển dụng</span>
          <Tag color={JOB_STATUS_COLOR[job.status as JobStatus] ?? 'default'} style={{ marginLeft: 'auto' }}>
            {STATUS_ICON[job.status as JobStatus]}{' '}
            {JOB_STATUS_LABEL[job.status as JobStatus] ?? job.status}
          </Tag>
        </div>
      }
      extra={
        job.status === 'DRAFT' && (
          <button
            onClick={handlePublish}
            style={{
              background: '#002660', color: '#fff', border: 'none',
              padding: '8px 20px', borderRadius: 8, fontWeight: 700,
              cursor: 'pointer', fontSize: 14,
            }}
          >
            ✓ Đăng tin ngay
          </button>
        )
      }
    >
      {/* Scoped CSS for Quill-rendered HTML */}
      <style>{`
        .rich-content {
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
        .rich-content p   { margin: 0 0 6px; }
        .rich-content ul,
        .rich-content ol  { margin: 4px 0 8px; padding-left: 22px; }
        .rich-content ul  { list-style-type: disc !important; }
        .rich-content ol  { list-style-type: decimal !important; }
        .rich-content li  {
          margin: 2px 0;
          padding-left: 0 !important;
          list-style-type: inherit !important;
          display: list-item !important;
          background: transparent !important;
        }
        /* Disable Quill custom bullets/elements to prevent misalignment and wrapping */
        .rich-content li::before,
        .rich-content ul li::before,
        .rich-content ol li::before {
          display: none !important;
          content: none !important;
        }
        .rich-content .ql-ui {
          display: none !important;
        }
        .rich-content li br {
          display: none !important;
        }
        .rich-content *   { background: transparent !important; }
        .rich-content strong { font-weight: 700; }
        .rich-content em     { font-style: italic; }
        .rich-content u      { text-decoration: underline; }
      `}</style>

      {/* Candidate preview */}
      <div style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #002660 0%, #005daa 100%)',
          borderRadius: 12, padding: 24, marginBottom: 20, color: '#fff',
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>
            {job.name}
          </h1>
          <Space wrap size={8}>
            <Tag color="gold">{JOB_LEVEL_LABEL[job.level as JobLevel] ?? job.level}</Tag>
            <Tag color="cyan">{JOB_TYPE_LABEL[job.jobType as JobType] ?? job.jobType}</Tag>
            {job.location && <Tag color="default">📍 {job.location}</Tag>}
            <Tag color="green">💰 {salaryText}</Tag>
          </Space>
        </div>

        {/* Meta info */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 12, marginBottom: 20,
        }}>
          {[
            { label: 'Số lượng tuyển', value: `${job.quantity} người` },
            { label: 'Kinh nghiệm', value: job.experienceRequired ?? 'Không yêu cầu' },
            { label: 'Ngày bắt đầu', value: job.startDate ? dayjs(job.startDate).format('DD/MM/YYYY') : '—' },
            { label: 'Hạn nộp', value: job.endDate ? dayjs(job.endDate).format('DD/MM/YYYY') : '—' },
          ].map(item => (
            <div key={item.label} style={{
              background: '#f4f3f3', borderRadius: 8, padding: '10px 14px',
            }}>
              <div style={{ fontSize: 11, color: '#747783', fontWeight: 600, marginBottom: 2 }}>
                {item.label.toUpperCase()}
              </div>
              <div style={{ fontWeight: 600, color: '#002660' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Skills */}
        {job.skills.length > 0 && (
          <>
            <Divider orientation="left" orientationMargin={0}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#002660' }}>Kỹ năng yêu cầu</span>
            </Divider>
            <Space wrap style={{ marginBottom: 20 }}>
              {job.skills.map(s => (
                <Tag key={s.id} color="blue">{s.name}</Tag>
              ))}
            </Space>
          </>
        )}

        {/* Description */}
        {job.description && (
          <>
            <Divider orientation="left" orientationMargin={0}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#002660' }}>Mô tả công việc</span>
            </Divider>
            <div
              className="rich-content"
              style={{ fontSize: 14, lineHeight: 1.7, color: '#1b1c1c', marginBottom: 20 }}
              dangerouslySetInnerHTML={{ __html: cleanHtml(job.description) }}
            />
          </>
        )}

        {/* Requirements */}
        {job.requirements && (
          <>
            <Divider orientation="left" orientationMargin={0}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#002660' }}>
                Yêu cầu ứng viên
                <span style={{ fontSize: 11, color: '#747783', marginLeft: 6, fontWeight: 400 }}>
                  Your skills and experience
                </span>
              </span>
            </Divider>
            <div
              style={{
                marginBottom: 20,
                borderLeft: '3px solid #005daa',
                borderRadius: 8,
                background: '#eef4fb',
                padding: '12px 16px',
              }}
            >
              <div
                className="rich-content"
                style={{ fontSize: 14, lineHeight: 1.7, color: '#1b1c1c' }}
                dangerouslySetInnerHTML={{ __html: cleanHtml(job.requirements) }}
              />
            </div>
          </>
        )}

        {/* Benefits */}
        {job.benefits && (
          <>
            <Divider orientation="left" orientationMargin={0}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#002660' }}>Phúc lợi</span>
            </Divider>
            <div
              className="rich-content"
              style={{ fontSize: 14, lineHeight: 1.7, color: '#1b1c1c' }}
              dangerouslySetInnerHTML={{ __html: cleanHtml(job.benefits) }}
            />
          </>
        )}

        {/* Preview note */}
        <div style={{
          marginTop: 24, background: '#fff9c4', border: '1px solid #f57f17',
          borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e65100',
        }}>
          ⚠️ Đây là bản xem trước nội bộ. Tin chưa được công khai với ứng viên.
        </div>
      </div>
    </Drawer>
  )
}

export default JobPreviewDrawer
