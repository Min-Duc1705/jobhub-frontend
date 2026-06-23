import { useEffect, useRef, useState } from 'react'
import { App } from 'antd'
import { useAppSelector } from '../../../redux/hooks'
import type { IJob, JobStatus } from '../../../types/job'
import {
  getJobsApi, deleteJobApi, changeJobStatusApi, previewJobApi,
} from '../../../services/job-service'
import { getCampaignsApi, getCampaignConversationsApi } from '../../../services/hire-agent-service'
import JobFormModal from './JobFormModal'
import JobPreviewDrawer from './JobPreviewDrawer'

// Import sub-components
import JobHRInsights from '../../../components/shared/job-hr/JobHRInsights'
import JobHRFilters from '../../../components/shared/job-hr/JobHRFilters'
import JobHRTable from '../../../components/shared/job-hr/JobHRTable'
import JobHRBento from '../../../components/shared/job-hr/JobHRBento'

import './JobHRPage.scss'

const PAGE_SIZE = 10

// ── Main page ─────────────────────────────────────────────────────────────────
const JobHRPage = () => {
  const { notification } = App.useApp()
  const user = useAppSelector(s => s.auth.user)
  const authLoading = useAppSelector(s => s.auth.isLoading)

  // Data state
  const [jobs, setJobs] = useState<IJob[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [smartMatchCount, setSmartMatchCount] = useState<number | null>(null)

  const fetchSmartMatchCount = async () => {
    if (!user?.id) return
    try {
      const res = await getCampaignsApi()
      if (res.data) {
        const campaignsList = res.data
        if (campaignsList.length === 0) {
          setSmartMatchCount(0)
          return
        }
        const convPromises = campaignsList.map(c =>
          getCampaignConversationsApi(c.id).catch(() => ({ data: [] }))
        )
        const results = await Promise.all(convPromises)
        let count = 0
        results.forEach(r => {
          if (r.data) {
            count += r.data.filter((conv: any) => conv.status === 'Screening').length
          }
        })
        setSmartMatchCount(count)
      }
    } catch (err) {
      console.error('Lỗi khi tải số ứng viên Smart Match:', err)
    }
  }

  // Filters / pagination
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  // Modal state
  const [openForm, setOpenForm] = useState(false)
  const [editJob, setEditJob] = useState<IJob | null>(null)
  const [previewJob, setPreviewJob] = useState<IJob | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchJobs = async (p: number, ps: number, s: string, status: string, level: string) => {
    if (!user?.id) return // chờ user load xong mới fetch
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      sp.set('pageNumber', String(p))
      sp.set('pageSize', String(ps))
      sp.set('sortBy', 'createdDate')
      sp.set('isDescending', 'true')
      sp.set('customerId', user.id)
      if (s) sp.set('searchTerm', s)
      if (status) sp.set('status', status)
      if (level) sp.set('level', level)

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
    if (authLoading || !user?.id) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchJobs(page, pageSize, search, statusFilter, levelFilter)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, page, pageSize, search, statusFilter, levelFilter])

  useEffect(() => {
    if (authLoading || !user?.id) return
    fetchSmartMatchCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])

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
    setPreviewLoading(true)
    setPreviewOpen(true)
    try {
      const res = await previewJobApi(job.id)
      setPreviewJob(res.data ?? job)
    } catch {
      setPreviewJob(job)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleStatusChange = async (id: string, status: JobStatus) => {
    try {
      await changeJobStatusApi(id, status)
      const successMsg = status === 'PUBLISHED' ? 'Đã đăng tin tuyển dụng!' : 'Đã đóng tin tuyển dụng!'
      notification.success({ message: successMsg, duration: 2 })
      fetchJobs(page, pageSize, search, statusFilter, levelFilter)
    } catch (err: any) {
      notification.error({ message: err?.response?.data?.message || 'Cập nhật trạng thái thất bại', duration: 3 })
    }
  }

  const handleEdit = (job: IJob) => {
    setEditJob(job)
    setOpenForm(true)
  }

  const handleCreate = () => {
    setEditJob(null)
    setOpenForm(true)
  }

  const reload = () => {
    fetchJobs(page, pageSize, search, statusFilter, levelFilter)
    fetchSmartMatchCount()
  }

  const activeCount = jobs.filter(j => j.status === 'PUBLISHED').length
  const recruiterSkills = jobs
    .flatMap(j => (j.skills || []).map(s => s?.name))
    .filter((v, i, a) => v && a.indexOf(v) === i) as string[]

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
          <div className="hr-job-header-actions">
            <button className="btn-reload" onClick={reload} disabled={loading}>
              <span className={`material-symbols-outlined ${loading ? 'spin' : ''}`}>
                refresh
              </span>
              Tải lại
            </button>
            <button className="btn-post-job" onClick={handleCreate}>
              <span className="material-symbols-outlined">add</span>
              Đăng tin mới
            </button>
          </div>
        </div>

        {/* ── AI Insights ────────────────────────────────────────────────── */}
        <JobHRInsights smartMatchCount={smartMatchCount} skills={recruiterSkills} />

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <JobHRFilters
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          levelFilter={levelFilter}
          setLevelFilter={setLevelFilter}
          setPage={setPage}
        />

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <JobHRTable
          jobs={jobs}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          onPreview={handlePreview}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />

        {/* ── Bento Section ──────────────────────────────────────────────── */}
        <JobHRBento smartMatchCount={smartMatchCount} />

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
