import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Input, Select, Tabs, Skeleton, Empty, App, Pagination } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { useAppSelector } from '../../../redux/hooks'
import { getApplicationsApi, withdrawApplicationApi } from '../../../services/application-service'
import { getSavedJobsApi, unsaveJobApi, getJobByIdApi } from '../../../services/job-service'
import type { IApplication, ApplicationStatus } from '../../../types/application'
import type { IJob } from '../../../types/job'

// Shared Components
import CandidateStats from '../../../components/shared/job-candidate/CandidateStats'
import AppliedJobCard from '../../../components/shared/job-candidate/AppliedJobCard'
import SavedJobCard from '../../../components/shared/job-candidate/SavedJobCard'
import AISalaryWidget from '../../../components/shared/job-candidate/AISalaryWidget'
import JobRecommendationsWidget from '../../../components/shared/job-candidate/JobRecommendationsWidget'
import CandidateApplicationDetailModal from '../../../components/shared/job-candidate/CandidateApplicationDetailModal'

import './AppliedJobsPage.scss'

const AppliedJobsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { user } = useAppSelector((state) => state.auth)

  // Data states
  const [applications, setApplications] = useState<IApplication[]>([])
  const [savedJobs, setSavedJobs] = useState<any[]>([])
  const [jobsMap, setJobsMap] = useState<Record<string, IJob>>({})
  
  // Pagination states for Saved Jobs
  const [savedPage, setSavedPage] = useState(1)
  const [savedPageSize, setSavedPageSize] = useState(10)
  const [savedTotal, setSavedTotal] = useState(0)

  // Loading states
  const [loadingApps, setLoadingApps] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('')
  const [timeFilter, setTimeFilter] = useState<'30' | '90' | ''>('')

  // Detail Modal states
  const [selectedApp, setSelectedApp] = useState<IApplication | null>(null)
  const [selectedAppJob, setSelectedAppJob] = useState<IJob | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Determine active tab from URL path
  const activeTabKey = location.pathname === '/candidate/saved-jobs' ? 'saved' : 'applied'

  const handleTabChange = (key: string) => {
    if (key === 'saved') {
      navigate('/candidate/saved-jobs')
    } else {
      navigate('/candidate/applied-jobs')
    }
  }

  // ── Fetch Applications ──────────────────────────────────────────────────────
  const fetchApplications = async () => {
    if (!user?.id) return
    setLoadingApps(true)
    try {
      const sp = new URLSearchParams()
      sp.set('customerId', user.id)
      sp.set('pageSize', '100') // fetch a large page size for candidate client filtering
      const res = await getApplicationsApi(sp.toString())
      setApplications(res.data?.result ?? [])
    } catch {
      message.error('Không thể tải lịch sử ứng tuyển.')
    } finally {
      setLoadingApps(false)
    }
  }

  // ── Fetch Saved Jobs ────────────────────────────────────────────────────────
  const fetchSavedJobs = async (page = savedPage, size = savedPageSize) => {
    if (!user?.id) return
    setLoadingSaved(true)
    try {
      const sp = new URLSearchParams()
      sp.set('pageNumber', page.toString())
      sp.set('pageSize', size.toString())
      const res = await getSavedJobsApi(sp.toString())
      setSavedJobs(res.data?.result ?? [])
      setSavedTotal(res.data?.meta?.total ?? 0)
    } catch {
      message.error('Không thể tải danh sách công việc đã lưu.')
    } finally {
      setLoadingSaved(false)
    }
  }

  // Fetch initial data
  useEffect(() => {
    if (user?.id) {
      fetchApplications()
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchSavedJobs(savedPage, savedPageSize)
    }
  }, [user?.id, savedPage, savedPageSize])

  // ── Resolve Job Details ─────────────────────────────────────────────────────
  // Fetch detailed job info for applications to display company names/logos/locations
  useEffect(() => {
    const missingJobIds = applications
      .map((app) => app.jobId)
      .filter((id) => id && !jobsMap[id])

    if (missingJobIds.length === 0) return

    const uniqueMissingIds = Array.from(new Set(missingJobIds))

    Promise.all(
      uniqueMissingIds.map((id) =>
        getJobByIdApi(id)
          .then((res) => ({ id, data: res.data }))
          .catch(() => ({ id, data: null }))
      )
    ).then((results) => {
      const newJobs = { ...jobsMap }
      results.forEach((r) => {
        if (r.data) {
          newJobs[r.id] = r.data
        }
      })
      setJobsMap(newJobs)
    })
  }, [applications])

  // ── Unsave action ───────────────────────────────────────────────────────────
  const handleUnsave = async (jobId: string) => {
    try {
      await unsaveJobApi(jobId)
      message.success('Đã bỏ lưu tin tuyển dụng.')
      if (savedJobs.length === 1 && savedPage > 1) {
        setSavedPage((prev) => prev - 1)
      } else {
        fetchSavedJobs(savedPage, savedPageSize)
      }
    } catch {
      message.error('Bỏ lưu thất bại.')
    }
  }

  // ── Withdraw action ─────────────────────────────────────────────────────────
  const handleWithdraw = async (appId: string) => {
    try {
      await withdrawApplicationApi(appId)
      message.success('Đã hủy nộp đơn ứng tuyển thành công.')
      fetchApplications()
    } catch {
      message.error('Hủy nộp đơn ứng tuyển thất bại.')
    }
  }

  // ── Apply action (redirect to detail page) ──────────────────────────────────
  const handleApply = (jobId: string) => {
    navigate(`/jobs/${jobId}`)
  }

  // ── Open details modal ──────────────────────────────────────────────────────
  const handleViewDetail = (app: IApplication) => {
    setSelectedApp(app)
    setSelectedAppJob(jobsMap[app.jobId] ?? null)
    setDetailOpen(true)
  }

  // ── Filtering logic ─────────────────────────────────────────────────────────
  const getFilteredApps = () => {
    return applications.filter((app) => {
      const job = jobsMap[app.jobId]
      const title = job?.name?.toLowerCase() ?? ''
      const company = job?.companyName?.toLowerCase() ?? ''
      const term = searchTerm.toLowerCase()

      // Search match
      const matchesSearch = title.includes(term) || company.includes(term)

      // Status match
      const matchesStatus = !statusFilter || app.status === statusFilter

      // Time match
      let matchesTime = true
      if (timeFilter) {
        const daysDiff = dayjs().diff(dayjs(app.createdDate), 'day')
        matchesTime = daysDiff <= parseInt(timeFilter, 10)
      }

      return matchesSearch && matchesStatus && matchesTime
    })
  }

  const getFilteredSavedJobs = () => {
    return savedJobs.filter((sj) => {
      const job = sj.job
      const title = job?.name?.toLowerCase() ?? ''
      const company = job?.companyName?.toLowerCase() ?? ''
      const term = searchTerm.toLowerCase()
      return title.includes(term) || company.includes(term)
    })
  }

  // ── Statistics calculations ─────────────────────────────────────────────────
  const underReviewCount = applications.filter((a) => a.status === 'PENDING' || a.status === 'REVIEWING').length
  const interviewCount = applications.filter((a) => a.status === 'APPROVED').length

  const filteredApps = getFilteredApps()
  const filteredSaved = getFilteredSavedJobs()

  return (
    <div className="cjp-page">
      <div className="cjp-container">
        
        {/* Header Title */}
        <div className="cjp-header">
          <div className="cjp-header-left">
            <h2>Quản lý Việc làm</h2>
            <p>Theo dõi và quản lý các cơ hội nghề nghiệp của bạn.</p>
          </div>
          
          {/* Global Search Bar */}
          <div className="cjp-header-search">
            <Input 
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm kiếm theo công việc, công ty..." 
              variant="borderless" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '4px 0' }}
            />
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <CandidateStats 
          appliedCount={applications.length}
          underReviewCount={underReviewCount}
          interviewCount={interviewCount}
          savedCount={savedTotal}
        />

        <div className="cjp-main-layout">
          
          {/* Left Side: Tabs + Main List Content */}
          <div className="cjp-content">
            
            <Tabs 
              activeKey={activeTabKey}
              onChange={handleTabChange}
              tabBarStyle={{ borderBottom: '1px solid #c3c6d3', marginBottom: 20 }}
              items={[
                {
                  key: 'applied',
                  label: <span className="font-bold text-sm">Danh sách ứng tuyển ({applications.length})</span>,
                  children: (
                    <div>
                      {/* Applied Filter bar */}
                      <div className="cjp-filter-bar">
                        <div className="cjp-filter-selects">
                          <Select 
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: 160 }}
                            placeholder="Trạng thái"
                            options={[
                              { label: 'Tất cả trạng thái', value: '' },
                              { label: 'Chờ xử lý', value: 'PENDING' },
                              { label: 'Đang xem xét', value: 'REVIEWING' },
                              { label: 'Đã duyệt / Phỏng vấn', value: 'APPROVED' },
                              { label: 'Từ chối / Chưa phù hợp', value: 'REJECTED' },
                            ]}
                          />
                          <Select 
                            value={timeFilter}
                            onChange={setTimeFilter}
                            style={{ width: 160 }}
                            placeholder="Thời gian nộp"
                            options={[
                              { label: 'Tất cả thời gian', value: '' },
                              { label: '30 ngày gần nhất', value: '30' },
                              { label: '90 ngày gần nhất', value: '90' },
                            ]}
                          />
                        </div>
                        <p className="cjp-filter-info">
                          Hiển thị <b>{filteredApps.length}</b> đơn ứng tuyển
                        </p>
                      </div>

                      {/* Applications List */}
                      {loadingApps ? (
                        <div className="cjp-list">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} active avatar paragraph={{ rows: 2 }} className="cjp-job-card" />
                          ))}
                        </div>
                      ) : filteredApps.length === 0 ? (
                        <Empty 
                          image={Empty.PRESENTED_IMAGE_SIMPLE} 
                          description={
                            <div className="text-slate-400">
                              <h3>Chưa có đơn ứng tuyển nào</h3>
                              <p className="text-xs">Bấm tìm việc để bắt đầu nộp hồ sơ ứng tuyển.</p>
                            </div>
                          } 
                        />
                      ) : (
                        <div className="cjp-list">
                          {filteredApps.map((app) => (
                            <AppliedJobCard 
                              key={app.id} 
                              application={app} 
                              job={jobsMap[app.jobId] ?? null}
                              onViewDetail={() => handleViewDetail(app)}
                              onWithdraw={handleWithdraw}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'saved',
                  label: <span className="font-bold text-sm">Việc làm đã lưu ({savedTotal})</span>,
                  children: (
                    <div>
                      {/* Saved Jobs Header Filter Bar Info */}
                      <div className="cjp-filter-bar">
                        <span className="text-xs text-slate-400">Xem và nộp hồ sơ vào các tin tuyển dụng bạn đã lưu</span>
                        <p className="cjp-filter-info">
                          Hiển thị <b>{filteredSaved.length}</b> việc làm đã lưu
                        </p>
                      </div>

                      {/* Saved List */}
                      {loadingSaved ? (
                        <div className="cjp-list">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} active avatar paragraph={{ rows: 2 }} className="cjp-job-card" />
                          ))}
                        </div>
                      ) : filteredSaved.length === 0 ? (
                        <Empty 
                          image={Empty.PRESENTED_IMAGE_SIMPLE} 
                          description={
                            <div className="text-slate-400">
                              <h3>Chưa có tin tuyển dụng nào được lưu</h3>
                              <p className="text-xs">Duyệt qua danh sách tin để lưu những công việc phù hợp.</p>
                            </div>
                          } 
                        />
                      ) : (
                        <>
                          <div className="cjp-list">
                            {filteredSaved.map((sj) => (
                              <SavedJobCard 
                                key={sj.jobId} 
                                savedJob={sj}
                                onUnsave={handleUnsave}
                                onApply={handleApply}
                              />
                            ))}
                          </div>
                          {savedTotal > 0 && (
                            <div className="cjp-pagination">
                              <Pagination
                                current={savedPage}
                                pageSize={savedPageSize}
                                total={savedTotal}
                                onChange={(page, pageSize) => {
                                  setSavedPage(page)
                                  if (pageSize) setSavedPageSize(pageSize)
                                }}
                                showSizeChanger
                                pageSizeOptions={['5', '10', '20', '50']}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                }
              ]}
            />

          </div>

          {/* Right Side: Sidebar AI Widget & Tips */}
          <aside className="cjp-sidebar">
            <AISalaryWidget />
            <JobRecommendationsWidget />
            
            {/* Help tip card */}
            <div className="cjp-tip-card">
              <span className="material-symbols-outlined">lightbulb</span>
              <h6>Mẹo tìm việc</h6>
              <p>
                Cập nhật các kỹ năng hot như "React/Next.js" hoặc "Generative AI" vào CV có thể giúp bạn tăng 40% cơ hội trúng tuyển.
              </p>
            </div>
          </aside>

        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => navigate('/jobs')}
          className="cjp-fab"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="cjp-fab-tooltip">
            Tìm việc làm mới
          </span>
        </button>

        {/* Details modal */}
        <CandidateApplicationDetailModal 
          application={selectedApp}
          job={selectedAppJob}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        />

      </div>
    </div>
  )
}

export default AppliedJobsPage
