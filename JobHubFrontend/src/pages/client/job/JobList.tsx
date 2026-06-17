import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Select, Pagination, Spin, Empty, App } from 'antd'
import type { IJob, JobType, JobLevel } from '../../../types/job'
import { getJobsApi, getSavedJobsApi, saveJobApi, unsaveJobApi } from '../../../services/job-service'
import { useAppSelector } from '../../../redux/hooks'
import { useProvinceNames } from '../../../hooks/useProvinces'
import JobHeroSearch from '../../../components/shared/job-list/JobHeroSearch'
import JobListFilters from '../../../components/shared/job-list/JobListFilters'
import JobCard from '../../../components/shared/job-list/JobCard'
import './JobList.scss'

const PAGE_SIZE = 10

const getPageFromSearch = (search: string) => {
  const params = new URLSearchParams(search)
  const parsedPage = Number.parseInt(params.get('page') || '1', 10)
  return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

const buildJobsUrl = (params: URLSearchParams) => {
  const query = params.toString()
  return query ? `/jobs?${query}` : '/jobs'
}

const JobList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  const { user } = useAppSelector(state => state.auth)

  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())

  // Parse URL search params on initialization
  const queryParams = new URLSearchParams(location.search)
  const initialKeyword = queryParams.get('keyword') || ''
  const initialLocation = queryParams.get('location') || ''
  let initialSortBy = queryParams.get('sortBy') || 'newest'
  if (initialSortBy === 'createdDate') initialSortBy = 'newest'
  if (initialSortBy === 'salary') initialSortBy = 'salary_desc'

  // Search bar state
  const [keyword,       setKeyword]       = useState(initialKeyword)
  const [locationInput, setLocationInput] = useState(initialLocation)

  // Sidebar filter state (local — áp dụng khi nhấn Apply)
  const [tempTypes,  setTempTypes]  = useState<JobType[]>([])
  const [tempLevels, setTempLevels] = useState<JobLevel[]>([])

  // Committed filter state (gửi lên API)
  const [appliedKeyword,  setAppliedKeyword]  = useState(initialKeyword)
  const [appliedLocation, setAppliedLocation] = useState(initialLocation)
  const [appliedTypes,    setAppliedTypes]    = useState<JobType[]>([])
  const [appliedLevels,   setAppliedLevels]   = useState<JobLevel[]>([])
  const [sortBy,          setSortBy]          = useState(initialSortBy)

  // API / pagination state
  const [jobs,        setJobs]        = useState<IJob[]>([])
  const [total,       setTotal]       = useState(0)
  const [currentPage, setCurrentPage] = useState(() => getPageFromSearch(location.search))
  const [loading,     setLoading]     = useState(false)

  // ── Provinces (shared hook — cache toàn module, chỉ fetch 1 lần toàn app)
  const { options: provinceOptions, loading: loadingProvinces } = useProvinceNames()

  // Fetch user's saved job IDs
  useEffect(() => {
    const fetchSavedJobIds = async () => {
      if (!user?.id) {
        setSavedJobIds(new Set())
        return
      }
      try {
        const res = await getSavedJobsApi('pageNumber=1&pageSize=1000')
        const ids = new Set((res.data?.result ?? []).map((sj: any) => sj.jobId))
        setSavedJobIds(ids)
      } catch {
        // Ignore
      }
    }
    fetchSavedJobIds()
  }, [user?.id])

  // Synchronize state when URL query params change (e.g. from homepage redirect or View All link)
  useEffect(() => {
    const qParams = new URLSearchParams(location.search)
    const urlKeyword = qParams.get('keyword') || ''
    const urlLocation = qParams.get('location') || ''
    let urlSortBy = qParams.get('sortBy') || 'newest'
    if (urlSortBy === 'createdDate') urlSortBy = 'newest'
    if (urlSortBy === 'salary') urlSortBy = 'salary_desc'
    const urlPage = getPageFromSearch(location.search)

    setKeyword(urlKeyword)
    setLocationInput(urlLocation)
    setAppliedKeyword(urlKeyword)
    setAppliedLocation(urlLocation)
    setSortBy(urlSortBy)
    setCurrentPage(urlPage)
  }, [location.search])

  const handleToggleSave = async (e: React.MouseEvent, job: IJob) => {
    e.stopPropagation()
    if (!user?.id) {
      message.warning('Vui lòng đăng nhập để lưu tin tuyển dụng.')
      return
    }
    const isSaved = savedJobIds.has(job.id)
    try {
      if (isSaved) {
        await unsaveJobApi(job.id)
        message.success('Đã bỏ lưu tin tuyển dụng.')
        setSavedJobIds(prev => {
          const next = new Set(prev)
          next.delete(job.id)
          return next
        })
      } else {
        await saveJobApi(job.id)
        message.success('Lưu tin tuyển dụng thành công.')
        setSavedJobIds(prev => {
          const next = new Set(prev)
          next.add(job.id)
          return next
        })
      }
    } catch {
      message.error(isSaved ? 'Bỏ lưu thất bại.' : 'Lưu tin tuyển dụng thất bại.')
    }
  }

  // Fetch jobs
  const fetchJobs = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('pageNumber', String(page))
      params.set('pageSize',   String(PAGE_SIZE))
      if (appliedKeyword)               params.set('searchTerm',  appliedKeyword)
      if (appliedLocation)              params.set('location', appliedLocation)
      if (appliedTypes.length)          params.set('jobType',  appliedTypes.join(','))
      if (appliedLevels.length)         params.set('level',    appliedLevels.join(','))
      if (sortBy === 'newest') {
        params.set('sortBy', 'createdDate')
        params.set('isDescending', 'true')
      }
      if (sortBy === 'salary_desc') {
        params.set('sortBy', 'salary')
        params.set('isDescending', 'true')
      }

      const res = await getJobsApi(params.toString())
      setJobs(res.data?.result  ?? [])
      setTotal(res.data?.meta?.total ?? 0)
    } catch {
      setJobs([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [appliedKeyword, appliedLocation, appliedTypes, appliedLevels, sortBy])

  useEffect(() => {
    fetchJobs(currentPage)
  }, [fetchJobs, currentPage])

  useEffect(() => {
    if (loading || total === 0) return

    const totalPages = Math.ceil(total / PAGE_SIZE)
    if (currentPage <= totalPages) return

    const params = new URLSearchParams(location.search)
    params.set('page', String(totalPages))
    navigate(buildJobsUrl(params), { replace: true })
  }, [currentPage, loading, location.search, navigate, total])

  // Handlers
  const handleSearch = () => {
    const params = new URLSearchParams(location.search)
    if (keyword) params.set('keyword', keyword)
    else params.delete('keyword')

    if (locationInput) params.set('location', locationInput)
    else params.delete('location')

    params.delete('page') // Reset pagination to page 1
    navigate(buildJobsUrl(params))
  }

  const handleApplyFilters = () => {
    setAppliedTypes(tempTypes)
    setAppliedLevels(tempLevels)
    setCurrentPage(1)

    const params = new URLSearchParams(location.search)
    params.delete('page')
    navigate(buildJobsUrl(params), { replace: true })
  }

  const handleClearAll = () => {
    setKeyword('')
    setLocationInput('')
    setTempTypes([])
    setTempLevels([])
    setAppliedTypes([])
    setAppliedLevels([])
    setCurrentPage(1)
    navigate('/jobs')
  }

  const toggleType = (t: JobType) =>
    setTempTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const toggleLevel = (l: JobLevel) =>
    setTempLevels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])

  return (
    <main className="job-list-page">
      {/* Hero Search Section */}
      <JobHeroSearch
        keyword={keyword}
        locationInput={locationInput}
        onChangeKeyword={setKeyword}
        onChangeLocation={setLocationInput}
        onSearch={handleSearch}
        provinceOptions={provinceOptions}
        loadingProvinces={loadingProvinces}
      />

      {/* Main Layout */}
      <div className="main-content-layout">
        {/* Sidebar Filters */}
        <JobListFilters
          tempTypes={tempTypes}
          tempLevels={tempLevels}
          toggleType={toggleType}
          toggleLevel={toggleLevel}
          onApply={handleApplyFilters}
          onClear={handleClearAll}
        />

        {/* Job List */}
        <div className="job-list-content">
          {/* Header: count + sort */}
          <div className="job-list-info">
            <h2 className="jobs-count">
              {loading ? 'Đang tải...' : <><span className="font-bold">{total}</span> việc làm phù hợp</>}
            </h2>
            <div className="sort-container">
              <span className="sort-label">Sắp xếp:</span>
              <Select
                className="select-sort"
                variant="borderless"
                value={sortBy}
                onChange={val => {
                  const params = new URLSearchParams(location.search)
                  if (val && val !== 'newest') params.set('sortBy', val)
                  else params.delete('sortBy')
                  params.delete('page') // Reset pagination to page 1
                  navigate(buildJobsUrl(params))
                }}
                options={[
                  { value: 'newest',     label: 'Mới nhất' },
                  { value: 'salary_desc', label: 'Lương cao nhất' },
                ]}
              />
            </div>
          </div>

          {/* Job Cards */}
          <div className="job-cards-wrapper">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Spin size="large" />
              </div>
            ) : jobs.length === 0 ? (
              <Empty description="Không tìm thấy việc làm phù hợp" style={{ padding: '60px 20px' }} />
            ) : (
              jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedJobIds.has(job.id)}
                  onToggleSave={handleToggleSave}
                  onCardClick={jobId => navigate(`/jobs/${jobId}`)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="pagination-container">
              <span className="pagination-info">
                Hi&#7875;n th&#7883; t&#7915; <strong>{Math.min((currentPage - 1) * PAGE_SIZE + 1, total)}</strong> &#273;&#7871;n <strong>{Math.min(currentPage * PAGE_SIZE, total)}</strong> trong t&#7893;ng s&#7889; <strong>{total}</strong> vi&#7879;c l&#224;m
              </span>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={total}
                onChange={page => {
                  const params = new URLSearchParams(location.search)
                  if (page > 1) params.set('page', String(page))
                  else params.delete('page')
                  navigate(buildJobsUrl(params))
                }}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default JobList
