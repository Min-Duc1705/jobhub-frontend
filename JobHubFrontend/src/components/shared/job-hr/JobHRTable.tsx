import React from 'react'
import { Table, Tag, Space, Popconfirm, Tooltip } from 'antd'
import {
  EyeOutlined, EditOutlined, CheckCircleOutlined,
  StopOutlined, DeleteOutlined, TeamOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import type { IJob, JobStatus, JobLevel, JobType } from '../../../types/job'
import {
  JOB_STATUS_LABEL, JOB_STATUS_COLOR,
  JOB_TYPE_LABEL, JOB_LEVEL_LABEL,
} from '../../../types/job'

const JOB_CATEGORY_LABEL: Record<string, string> = {
  Engineering: 'Kỹ thuật & Công nghệ',
  Marketing: 'Tiếp thị & Truyền thông',
  Sales: 'Kinh doanh & Bán hàng',
  Other: 'Khác',
}

interface JobHRTableProps {
  jobs: IJob[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  onPreview: (job: IJob) => void
  onEdit: (job: IJob) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: JobStatus) => void
}

const JobHRTable: React.FC<JobHRTableProps> = ({
  jobs,
  loading,
  total,
  page,
  pageSize,
  setPage,
  setPageSize,
  onPreview,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const navigate = useNavigate()

  const columns = [
    {
      title: 'Tên vị trí',
      key: 'name',
      width: 240,
      render: (_: any, record: IJob) => (
        <div className="job-name-cell">
          <span
            className="job-name"
            onClick={() => navigate(`/hr/jobs/${record.id}/applications`)}
          >
            {record.name}
          </span>
          <span className="job-date">
            Đăng ngày {dayjs(record.createdDate).format('DD/MM/YYYY')}
          </span>
        </div>
      ),
    },
    {
      title: 'Hình thức',
      key: 'jobType',
      width: 130,
      render: (_: any, record: IJob) => (
        <Tag color={
          record.jobType === 'FULL_TIME' ? 'blue' :
          record.jobType === 'PART_TIME' ? 'orange' :
          record.jobType === 'REMOTE'    ? 'green' :
          record.jobType === 'HYBRID'    ? 'purple' : 'gold'
        } style={{ margin: 0 }}>
          {JOB_TYPE_LABEL[record.jobType as JobType] ?? record.jobType}
        </Tag>
      ),
    },
    {
      title: 'Cấp độ',
      key: 'level',
      width: 110,
      render: (_: any, record: IJob) => (
        <Tag color={
          record.level === 'INTERN'    ? 'default' :
          record.level === 'FRESHER'   ? 'cyan' :
          record.level === 'JUNIOR'    ? 'geekblue' :
          record.level === 'MIDDLE'    ? 'blue' :
          record.level === 'SENIOR'    ? 'volcano' :
          record.level === 'LEADER'    ? 'red' :
          record.level === 'MANAGER'   ? 'magenta' : 'purple'
        } style={{ margin: 0 }}>
          {JOB_LEVEL_LABEL[record.level as JobLevel] ?? record.level}
        </Tag>
      ),
    },
    {
      title: 'Ngành nghề',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (cat: string) => (
        cat ? <Tag color="cyan">{JOB_CATEGORY_LABEL[cat] ?? cat}</Tag> : '—'
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
      width: 140,
      render: (loc: string) => loc ?? '—',
    },
    {
      title: 'Lương',
      key: 'salary',
      width: 130,
      render: (_: any, record: IJob) => {
        if (record.isSalaryNegotiable) return <Tag color="cyan">Thoả thuận</Tag>
        if (record.salaryMin == null && record.salaryMax == null) return '—'
        const isUsd = record.salaryCurrency === 'USD'
        if (isUsd) {
          const fmt = (n?: number | null) => n != null ? `$${n.toLocaleString('en-US')}` : ''
          return `${fmt(record.salaryMin)} – ${fmt(record.salaryMax)}`
        }
        const fmt = (n?: number | null) => n != null ? `${(n / 1_000_000).toFixed(0)}M` : ''
        return `${fmt(record.salaryMin)} – ${fmt(record.salaryMax)} ₫`
      },
    },
    {
      title: 'Kỹ năng',
      key: 'skills',
      width: 170,
      render: (_: any, record: IJob) => (
        <Space size={4} wrap>
          {record.skills.filter(s => s != null).slice(0, 2).map(s => (
            <Tag key={s.id} color="geekblue" style={{ margin: 0, fontSize: 11 }}>
              {s.name}
            </Tag>
          ))}
          {record.skills.filter(s => s != null).length > 2 && (
            <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
              +{record.skills.filter(s => s != null).length - 2}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 90,
      align: 'center' as const,
      render: (val: number) => <span style={{ color: '#005daa', fontWeight: 600 }}>{val}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: JobStatus) => (
        <Tag color={JOB_STATUS_COLOR[status] ?? 'default'}>
          {JOB_STATUS_LABEL[status] ?? status}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 160,
      align: 'right' as const,
      render: (_: any, record: IJob) => (
        <Space size={12}>
          <Tooltip title="Xem danh sách ứng viên">
            <TeamOutlined
              style={{ fontSize: 17, color: '#002660', cursor: 'pointer' }}
              onClick={() => navigate(`/hr/jobs/${record.id}/applications`)}
            />
          </Tooltip>
          <Tooltip title="Xem trước (nhuy ứng viên)">
            <EyeOutlined
              style={{ fontSize: 17, color: '#005daa', cursor: 'pointer' }}
              onClick={() => onPreview(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <EditOutlined
              style={{ fontSize: 17, color: '#fa8c16', cursor: 'pointer' }}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          {record.status === 'DRAFT' && (
            <Tooltip title="Đăng ngay">
              <CheckCircleOutlined
                style={{ fontSize: 17, color: '#52c41a', cursor: 'pointer' }}
                onClick={() => onStatusChange(record.id, 'PUBLISHED')}
              />
            </Tooltip>
          )}
          {record.status === 'PUBLISHED' && (
            <Tooltip title="Đóng tin">
              <StopOutlined
                style={{ fontSize: 17, color: '#ff4d4f', cursor: 'pointer' }}
                onClick={() => onStatusChange(record.id, 'CLOSED')}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Xác nhận xóa tin này?"
            description="Hành động không thể hoàn tác."
            onConfirm={() => onDelete(record.id)}
            okText="Xóa" cancelText="Huỷ"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <DeleteOutlined style={{ fontSize: 17, color: '#ff7875', cursor: 'pointer' }} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="hr-job-table-wrap">
      <Table
        dataSource={jobs}
        columns={columns}
        rowKey="id"
        loading={loading}
        locale={{
          emptyText: (
            <div className="hr-empty" style={{ padding: '32px 0', textAlign: 'center' }}>
              <div className="material-symbols-outlined" style={{ fontSize: 48, color: '#747783', marginBottom: 8 }}>work_off</div>
              <p style={{ margin: 0, color: '#747783' }}>Chưa có tin tuyển dụng nào. Hãy đăng tin đầu tiên!</p>
            </div>
          )
        }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          onChange: (p, ps) => { setPage(p); if (ps !== pageSize) { setPageSize(ps); setPage(1) } },
          onShowSizeChange: (_cur, ps) => { setPageSize(ps); setPage(1) },
          showTotal: (total, range) => `Hiển thị ${range[0]} – ${range[1]} trong tổng số ${total} tin`,
        }}
        scroll={{ x: 1260 }}
      />
    </div>
  )
}

export default JobHRTable
