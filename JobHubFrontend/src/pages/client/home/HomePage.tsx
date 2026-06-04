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
  const [isAIRecommended, setIsAIRecommended] = useState(false) // true = có data AI thật

  // ── Provinces (dùng hook cache chung — chỉ fetch 1 lần toàn app)
  const { options: provinceOptions, loading: loadingProvinces } = useProvinceNames()

  // ── Search handler
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (keyword) params.append('keyword', keyword)
    if (location) params.append('location', location)
    navigate(`/jobs?${params.toString()}`)
  }

  // ── Fetch companies & newest jobs song song khi mount
  useEffect(() => {
    setLoadingCompanies(true)
    setLoadingNewest(true)

    Promise.all([
      getVerifiedCompaniesApi('pageNumber=1&pageSize=6')
        .then(res => setCompanies(res.data?.result ?? []))
        .catch(() => {})
        .finally(() => setLoadingCompanies(false)),

      getJobsApi('pageNumber=1&pageSize=6&sortBy=createdDate&isDescending=true')
        .then(res => setNewestJobs(res.data?.result ?? []))
        .catch(() => {})
        .finally(() => setLoadingNewest(false)),
    ])
  }, [])


  // ── Fetch AI recommendations chạy NGẦM (background worker)
  // Hiển thị "Việc làm phổ biến" (newestJobs) ngay lập tức,
  // khi AI xong thì tự động chuyển sang "AI Đề Xuất" — không block UI
  const [recFetchedFor, setRecFetchedFor] = useState<string | null>(null)

  // Khi newestJobs load xong → hiển thị ngay "Việc làm phổ biến" làm mặc định
  useEffect(() => {
    if (newestJobs.length > 0 && recommendedJobs.length === 0) {
      setIsAIRecommended(false)
      setRecommendedJobs(newestJobs.slice(0, 6))
    }
  }, [newestJobs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Background worker: fetch AI recommendations mà KHÔNG block loading state
  useEffect(() => {
    const currentKey = user?.id ?? '__guest__'
    if (recFetchedFor === currentKey) return
    setRecFetchedFor(currentKey)

    // Không set loadingRecommended = true → section vẫn hiển thị "Việc làm phổ biến"
    const runAiRecommendationsInBackground = async () => {
      if (!user?.id) return // Guest: không cần AI

      try {
        const resumesRes = await getMyResumesApi(user.id)
        const resumes = resumesRes.data?.result ?? []
        const defaultResume = resumes.find(r => r.isDefault) || resumes[0]
        if (!defaultResume) return

        // Kiểm tra cache trước (sessionStorage)
        const cacheKey = `job-recs-${user.id}-${defaultResume.id}`
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          try {
            const cachedJobs = JSON.parse(cached)
            if (cachedJobs.length > 0) {
              setRecommendedJobs(cachedJobs)
              setIsAIRecommended(true)
              return
            }
          } catch { /* cache lỗi, bỏ qua */ }
        }

        // Gọi AI API ngầm (không await bên ngoài — chạy hoàn toàn background)
        const cvText = buildCvText({
          id: '',
          customerId: user.id,
          resume: defaultResume,
          coverLetter: ''
        }, defaultResume)

        const recRes = await getJobRecommendationsApi({ cv_text: cvText, customer_id: user.id })
        const recJobs = recRes.data ?? []
        if (recJobs.length > 0) {
          // Lưu cache và cập nhật UI — chuyển từ "Phổ biến" sang "AI Đề Xuất"
          sessionStorage.setItem(cacheKey, JSON.stringify(recJobs))
          setRecommendedJobs(recJobs)
          setIsAIRecommended(true)
        }
      } catch (err) {
        // Lỗi 503 hoặc bất kỳ lỗi API: im lặng, giữ nguyên "Việc làm phổ biến"
        console.warn('[AI Rec] Background worker thất bại, giữ nguyên Việc làm phổ biến:', err)
      }
    }

    // Chờ newestJobs render xong (100ms) rồi mới chạy background worker
    const timer = setTimeout(() => {
      runAiRecommendationsInBackground()
    }, 300)
    return () => clearTimeout(timer)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch saved jobs song song với render ban đầu
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
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
        isAIRecommended={isAIRecommended}
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
