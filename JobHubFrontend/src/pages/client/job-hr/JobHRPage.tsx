import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Popconfirm, Spin, Tooltip, Table, Tag, Space } from 'antd'
import {
  EyeOutlined, EditOutlined, CheckCircleOutlined,
  StopOutlined, DeleteOutlined, TeamOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAppSelector } from '../../../redux/hooks'
import type { IJob, JobStatus, JobLevel, JobType } from '../../../types/job'
import {
  JOB_STATUS_LABEL, JOB_STATUS_COLOR,
  JOB_TYPE_LABEL, JOB_LEVEL_LABEL,
} from '../../../types/job'
import {
  getJobsApi, deleteJobApi, changeJobStatusApi, previewJobApi,
} from '../../../services/job-service'
import JobFormModal   from './JobFormModal'
import JobPreviewDrawer from './JobPreviewDrawer'
import './JobHRPage.scss'

const PAGE_SIZE = 10

const JOB_CATEGORY_LABEL: Record<string, string> = {
  Engineering: 'Kỹ thuật & Công nghệ',
  Marketing: 'Tiếp thị & Truyền thông',
  Sales: 'Kinh doanh & Bán hàng',
  Other: 'Khác',
}

// ── Main page ─────────────────────────────────────────────────────────────────
const JobHRPage = () => {
  const { notification } = App.useApp()
  const navigate          = useNavigate()
  const user        = useAppSelector(s => s.auth.user)
  const authLoading = useAppSelector(s => s.auth.isLoading)

  // Data state
  const [jobs,    setJobs]    = useState<IJob[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(false)

  // Filters / pagination
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [levelFilter,  setLevelFilter]  = useState('')
  const [page,         setPage]         = useState(1)
  const [pageSize,     setPageSize]     = useState(PAGE_SIZE)

  // Modal state
  const [openForm,    setOpenForm]    = useState(false)
  const [editJob,     setEditJob]     = useState<IJob | null>(null)
  const [previewJob,  setPreviewJob]  = useState<IJob | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchJobs = async (p: number, ps: number, s: string, status: string, level: string) => {
    if (!user?.id) return          // chờ user load xong mới fetch
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      sp.set('pageNumber',   String(p))
      sp.set('pageSize',     String(ps))
      sp.set('sortBy',       'createdDate')
      sp.set('isDescending', 'true')
      sp.set('customerId',   user.id)
      if (s)      sp.set('searchTerm', s)
      if (status) sp.set('status',     status)
      if (level)  sp.set('level',      level)

      const res = await getJobsApi(sp.toString())
      setJobs(res.data?.result ?? [])
      setTotal(res.data?.meta?.total ?? 0)
    } catch {
      notification.error({ message: 'Không thể tải danh sách tin tuyển dụng', duration: 2 })
    } finally {
      setLoading(false)
    }
  }

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Single effect: reacts to user load, page, filters, and search (debounced)
  useEffect(() => {
    // Nếu auth đang loading hoặc user chưa có → không làm gì
    if (authLoading || !user?.id) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchJobs(page, pageSize, search, statusFilter, levelFilter)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [user?.id, authLoading, page, pageSize, search, statusFilter, levelFilter])

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteJobApi(id)
      notification.success({ message: 'Xóa tin tuyển dụng thành công', duration: 2 })
      fetchJobs(page, pageSize, search, statusFilter, levelFilter)
    } catch (err: any) {
      notification.error({ message: err?.response?.data?.message || 'Xóa thất bại', duration: 3 })
    }
  }

  const handlePreview = async (job: IJob) => {
    setPreviewLoading(true); setPreviewOpen(true)
    try {
      const res = await previewJobApi(job.id)
      setPreviewJob(res.data ?? job)
    } catch {
      setPreviewJob(job)
    } finally { setPreviewLoading(false) }
  }

  const handleEdit   = (job: IJob) => { setEditJob(job); setOpenForm(true) }
  const handleCreate = ()          => { setEditJob(null); setOpenForm(true) }

  const reload = () => fetchJobs(page, pageSize, search, statusFilter, levelFilter)

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
          <Tooltip title="Xem trước (như ứng viên)">
            <EyeOutlined
              style={{ fontSize: 17, color: '#005daa', cursor: 'pointer' }}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <EditOutlined
              style={{ fontSize: 17, color: '#fa8c16', cursor: 'pointer' }}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {record.status === 'DRAFT' && (
            <Tooltip title="Đăng ngay">
              <CheckCircleOutlined
                style={{ fontSize: 17, color: '#52c41a', cursor: 'pointer' }}
                onClick={async () => {
                  await changeJobStatusApi(record.id, 'PUBLISHED')
                  notification.success({ message: 'Đã đăng tin tuyển dụng!', duration: 2 })
                  reload()
                }}
              />
            </Tooltip>
          )}
          {record.status === 'PUBLISHED' && (
            <Tooltip title="Đóng tin">
              <StopOutlined
                style={{ fontSize: 17, color: '#ff4d4f', cursor: 'pointer' }}
                onClick={async () => {
                  await changeJobStatusApi(record.id, 'CLOSED')
                  notification.success({ message: 'Đã đóng tin tuyển dụng!', duration: 2 })
                  reload()
                }}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Xác nhận xóa tin này?"
            description="Hành động không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
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

  const activeCount = jobs.filter(j => j.status === 'PUBLISHED').length

  return (
    <div className="hr-job-page">
      <div className="hr-job-container">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="hr-job-header">
          <div>
            <nav className="hr-job-breadcrumb">
              <span>Jobs</span>
              <span>/</span>
              <span>Quản lý Tin tuyển dụng</span>
            </nav>
            <h1 className="hr-job-title">Quản lý Tin tuyển dụng</h1>
            <p className="hr-job-subtitle">
              Bạn đang có <span>{activeCount}</span> tin đang hoạt động trên tổng số{' '}
              <span>{total}</span> tin.
            </p>
          </div>
          <button className="btn-post-job" onClick={handleCreate}>
            <span className="material-symbols-outlined">add</span>
            Đăng tin mới
          </button>
        </div>

        {/* ── AI Insights ────────────────────────────────────────────────── */}
        <div className="hr-insight-grid">
          <div className="insight-card">
            <div className="insight-icon">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <div>
              <p className="insight-label">AI INSIGHT</p>
              <p className="insight-text">Lương DevOps tăng 12% theo thị trường.</p>
            </div>
            <a className="insight-link" href="#">Chi tiết</a>
          </div>
          <div className="insight-card">
            <div className="insight-icon insight-icon--tertiary">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div>
              <p className="insight-label" style={{ color: '#380077' }}>SMART MATCH</p>
              <p className="insight-text">12 ứng viên tiềm năng chưa liên hệ.</p>
            </div>
            <a className="insight-link" href="#">Xem ngay</a>
          </div>
          <div className="insight-card insight-card--primary">
            <div className="insight-icon">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
              <p className="insight-label">HIỆU SUẤT</p>
              <p className="insight-text">Tỷ lệ lấp đầy đạt 85% (+12%)</p>
            </div>
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="hr-filter-bar">
          <div className="filter-search-wrap" style={{ gridColumn: 'span 2' }}>
            <span className="material-symbols-outlined">search</span>
            <input
              placeholder="Tìm kiếm tên công việc..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="filter-select-wrap">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">Tất cả Trạng thái</option>
              <option value="PUBLISHED">Đang tuyển</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="CLOSED">Đã đóng</option>
              <option value="SUSPENDED">Bị khoá</option>
            </select>
            <span className="material-symbols-outlined">expand_more</span>
          </div>
          <div className="filter-select-wrap">
            <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1) }}>
              <option value="">Tất cả Cấp độ</option>
              {(Object.keys(JOB_LEVEL_LABEL) as JobLevel[]).map(l => (
                <option key={l} value={l}>{JOB_LEVEL_LABEL[l]}</option>
              ))}
            </select>
            <span className="material-symbols-outlined">expand_more</span>
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
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

        {/* ── Bento Section ──────────────────────────────────────────────── */}
        <div className="hr-bento">
          <div className="bento-main">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h4 className="bento-main-title">🤖 AI Smart Match</h4>
              <p className="bento-main-desc">
                Công nghệ AI phát hiện 12 ứng viên tiềm năng cao cho các vị trí đang tuyển của bạn chưa được liên hệ.
              </p>
            </div>
            <div className="bento-actions" style={{ position: 'relative', zIndex: 1 }}>
              <button className="btn-bento-primary">Gửi lời mời hàng loạt</button>
              <button className="btn-bento-secondary">Xem danh sách</button>
            </div>
            <div className="bento-bg-icon">
              <span className="material-symbols-outlined">psychology</span>
            </div>
          </div>
          <div className="bento-side">
            <div className="bento-side-header">
              <span className="material-symbols-outlined">analytics</span>
              <p>Phân tích tuyển dụng</p>
            </div>
            <p className="bento-side-desc">
              Thời gian trung bình để tuyển được một vị trí là <strong>14 ngày</strong>,
              nhanh hơn 3 ngày so với quý trước.
            </p>
            <button className="btn-bento-link">
              Xem báo cáo đầy đủ
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <JobFormModal
        open={openForm}
        data={editJob}
        onClose={() => { setOpenForm(false); setEditJob(null) }}
        onSuccess={() => { setOpenForm(false); setEditJob(null); reload() }}
      />

      <JobPreviewDrawer
        open={previewOpen && !previewLoading}
        job={previewJob}
        onClose={() => { setPreviewOpen(false); setPreviewJob(null) }}
        onStatusChanged={() => reload()}
      />
    </div>
  )
}

export default JobHRPage
