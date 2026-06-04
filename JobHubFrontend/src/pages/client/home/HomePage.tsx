import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from 'antd'
import { useProvinceNames } from '../../../hooks/useProvinces'
import { useAppSelector } from '../../../redux/hooks'
import { getVerifiedCompaniesApi } from '../../../services/company-service'
import { getJobsApi, getSavedJobsApi, saveJobApi, unsaveJobApi } from '../../../services/job-service'
import type { ICompany } from '../../../types/company'
import type { IJob } from '../../../types/job'
import HomeHero from '../../../components/shared/home/HomeHero'
import FeaturedCompanies from '../../../components/shared/home/FeaturedCompanies'
import RecommendedJobs from '../../../components/shared/home/RecommendedJobs'
import NewestJobs from '../../../components/shared/home/NewestJobs'
import { getMyResumesApi } from '../../../services/resume-service'
import { getJobRecommendationsApi } from '../../../services/ai-service'
import type { IResumeBasic } from '../../../types/application'
import type { IResume, ResumeContent } from '../../../types/resume-builder'
import './HomePage.scss'

const parseResumeContent = (contentJson?: string): ResumeContent | null => {
  if (!contentJson) return null
  try {
    return JSON.parse(contentJson) as ResumeContent
  } catch {
    return null
  }
}

const buildOnlineCvText = (resume: IResume | IResumeBasic): string => {
  const content = parseResumeContent(resume.contentJson)
  if (!content) return resume.title || ''

  const lines = [
    content.personal?.fullName,
    content.personal?.title,
    content.personal?.summary,
    ...(content.skills ?? []).flatMap(group => [group.category, ...(group.items ?? [])]),
    ...(content.experiences ?? []).flatMap(exp => [
      exp.position,
      exp.company,
      exp.description,
      ...(exp.bullets ?? []),
      ...(exp.tags ?? []),
    ]),
    ...(content.projects ?? []).flatMap(project => [
      project.name,
      project.description,
      ...(project.tags ?? []),
    ]),
    ...(content.education ?? []).flatMap(edu => [edu.school, edu.degree]),
    ...(content.certifications ?? []).flatMap(cert => [cert.name, cert.issuer]),
  ]

  return lines.filter(Boolean).join('\n')
}

const buildCvText = (application: any, resume?: IResume | IResumeBasic | null) => {
  const resObj = resume ?? application.resume
  const lines = [
    `Application ID: ${application.id}`,
    `Candidate ID: ${application.customerId}`,
    `Resume title: ${application.resume?.title ?? resObj?.title ?? ''}`,
    `Resume type: ${application.resume?.isOnlineCv ? 'Online CV' : 'File CV'}`,
    `Cover letter: ${application.coverLetter ?? ''}`,
  ]

  if (resObj?.isOnlineCv) {
    lines.push(buildOnlineCvText(resObj))
  } else {
    lines.push(resObj?.extractedText || '')
  }

  return lines.filter(Boolean).join('\n')
}

const HomePage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { user } = useAppSelector(state => state.auth)

  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')

  // ── States
  const [companies, setCompanies] = useState<ICompany[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<IJob[]>([])
  const [newestJobs, setNewestJobs] = useState<IJob[]>([])
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())

  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [loadingRecommended, setLoadingRecommended] = useState(false)
  const [loadingNewest, setLoadingNewest] = useState(false)

  // ── Provinces (dùng hook cache chung — chỉ fetch 1 lần toàn app)
  const { options: provinceOptions, loading: loadingProvinces } = useProvinceNames()

  // ── Search handler
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (keyword) params.append('keyword', keyword)
    if (location) params.append('location', location)
    navigate(`/jobs?${params.toString()}`)
  }

  // ── Fetch companies & newest jobs on mount
  useEffect(() => {
    setLoadingCompanies(true)
    getVerifiedCompaniesApi('pageNumber=1&pageSize=6')
      .then(res => setCompanies(res.data?.result ?? []))
      .catch(() => { })
      .finally(() => setLoadingCompanies(false))

    setLoadingNewest(true)
    getJobsApi('pageNumber=1&pageSize=6&sortBy=createdDate&isDescending=true')
      .then(res => setNewestJobs(res.data?.result ?? []))
      .catch(() => { })
      .finally(() => setLoadingNewest(false))
  }, [])

  // ── Fetch AI recommendations (reactive to user login)
  // Dùng useRef để chỉ fetch recommendation 1 lần cho mỗi userId (tránh effect re-run khi user object refresh)
  const recFetchedForRef = useState<string | null>(null)
  const [recFetchedFor, setRecFetchedFor] = recFetchedForRef

  useEffect(() => {
    // Chờ auth state resolve xong (user = null nghĩa là chưa check, undefined = chưa login)
    // Skip nếu đã fetch cho user này rồi
    const currentKey = user?.id ?? '__guest__'
    if (recFetchedFor === currentKey) return

    const fetchRecommendations = async () => {
      setLoadingRecommended(true)
      setRecFetchedFor(currentKey)
      try {
        if (user?.id) {
          const resumesRes = await getMyResumesApi(user.id)
          const resumes = resumesRes.data?.result ?? []
          const defaultResume = resumes.find(r => r.isDefault) || resumes[0]

          if (defaultResume) {
            const cacheKey = `job-recs-${user.id}-${defaultResume.id}`
            const cached = sessionStorage.getItem(cacheKey)
            if (cached) {
              try {
                setRecommendedJobs(JSON.parse(cached))
                setLoadingRecommended(false)
                return
              } catch (e) {
                // ignore
              }
            }

            const cvText = buildCvText({
              id: '',
              customerId: user.id,
              resume: defaultResume,
              coverLetter: ''
            }, defaultResume)

            const recRes = await getJobRecommendationsApi({ cv_text: cvText, customer_id: user.id })
            const recJobs = recRes.data ?? []
            if (recJobs.length > 0) {
              setRecommendedJobs(recJobs)
              sessionStorage.setItem(cacheKey, JSON.stringify(recJobs))
              setLoadingRecommended(false)
              return
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi khi gợi ý việc làm AI, chuyển sang chế độ dự phòng:', err)
      }

      // Fallback: dùng lại newestJobs nếu đã có (tránh gọi jobs API lần 3)
      // Nếu newestJobs chưa load xong thì chờ thêm 1 chút
      setRecommendedJobs(prev => {
        if (prev.length > 0) return prev
        // newestJobs sẽ được set sau — dùng [] tạm
        return []
      })
      setLoadingRecommended(false)
    }

    fetchRecommendations()
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Khi newestJobs load xong mà recommendedJobs vẫn rỗng → dùng newestJobs làm fallback
  useEffect(() => {
    if (newestJobs.length > 0 && recommendedJobs.length === 0 && !loadingRecommended) {
      setRecommendedJobs(newestJobs.slice(0, 3))
    }
  }, [newestJobs]) // eslint-disable-line react-hooks/exhaustive-deps


  // ── Fetch saved jobs (only once for logged in user)
  useEffect(() => {
    const fetchSaved = async () => {
      if (!user?.id) {
        setSavedJobIds(new Set())
        return
      }
      try {
        const res = await getSavedJobsApi('pageNumber=1&pageSize=1000')
        const ids = new Set((res.data?.result ?? []).map((sj: any) => sj.jobId))
        setSavedJobIds(ids)
      } catch { }
    }
    fetchSaved()
  }, [user?.id])

  // ── Shared Toggle Save Handler
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

  return (
    <div className="home-page">
      {/* HERO SECTION */}
      <HomeHero
        keyword={keyword}
        location={location}
        onChangeKeyword={setKeyword}
        onChangeLocation={setLocation}
        onSearch={handleSearch}
        provinceOptions={provinceOptions}
        loadingProvinces={loadingProvinces}
      />

      {/* FEATURED COMPANIES SECTION */}
      <FeaturedCompanies
        companies={companies}
        loading={loadingCompanies}
      />

      {/* RECOMMENDED JOBS SECTION */}
      <RecommendedJobs
        jobs={recommendedJobs}
        savedJobIds={savedJobIds}
        onToggleSave={handleToggleSave}
        loading={loadingRecommended}
      />

      {/* NEWEST JOBS SECTION */}
      <NewestJobs
        jobs={newestJobs}
        savedJobIds={savedJobIds}
        onToggleSave={handleToggleSave}
        loading={loadingNewest}
      />
    </div>
  )
}

export default HomePage
