import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { App, Breadcrumb, Button, Pagination, Skeleton, Empty } from 'antd'
import { LeftOutlined, ReloadOutlined } from '@ant-design/icons'

import type { IJob } from '../../../types/job'
import type { IApplication, ApplicationStatus, IResumeBasic } from '../../../types/application'
import type { IResume, ResumeContent } from '../../../types/resume-builder'
import type { CvScoringResult } from '../../../services/ai-service'
import { getJobByIdApi } from '../../../services/job-service'
import { getApplicationsApi, updateApplicationStatusApi } from '../../../services/application-service'
import { getResumeDownloadUrl } from '../../../services/resume-service'
import { scoreCvBatchApi, getCvAnalysesApi } from '../../../services/ai-service'

import ApplicationJobHeader from '../../../components/shared/job-applications/ApplicationJobHeader'
import ApplicationFilterBar from '../../../components/shared/job-applications/ApplicationFilterBar'
import type { MatchScoreFilter, SortByFilter } from '../../../components/shared/job-applications/ApplicationFilterBar'
import ApplicationCard from '../../../components/shared/job-applications/ApplicationCard'
import ApplicationDetailModal from '../../../components/shared/job-applications/ApplicationDetailModal'

import './JobApplicationsPage.scss'

const PAGE_SIZE = 10

export const buildJobDescription = (job: IJob) => [
  `Title: ${job.name}`,
  `Company: ${job.companyName ?? ''}`,
  `Level: ${job.level}`,
  `Location: ${job.location ?? ''}`,
  `Experience: ${job.experienceRequired ?? ''}`,
  `Skills: ${job.skills?.map(s => s.name).join(', ') ?? ''}`,
  `Description: ${job.description ?? ''}`,
  `Requirements: ${job.requirements ?? ''}`,
].filter(Boolean).join('\n')

export const parseResumeContent = (contentJson?: string): ResumeContent | null => {
  if (!contentJson) return null
  try {
    return JSON.parse(contentJson) as ResumeContent
  } catch {
    return null
  }
}

export const buildOnlineCvText = (resume: IResume | IResumeBasic): string => {
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

export const buildCvText = (application: IApplication, resume?: IResume | IResumeBasic | null) => {
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

const JobApplicationsPage = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { notification } = App.useApp()

  const [job, setJob] = useState<IJob | null>(null)
  const [applications, setApplications] = useState<IApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [jobLoading, setJobLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState<Record<string, CvScoringResult>>({})

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('')
  const [matchScore, setMatchScore] = useState<MatchScoreFilter>('')
  const [sortBy, setSortBy] = useState<SortByFilter>('createdDate')
  const [page, setPage] = useState(1)

  const [selectedApp, setSelectedApp] = useState<IApplication | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load job info + existing AI scores song song (cả 2 chỉ cần jobId, không phụ thuộc nhau)
  useEffect(() => {
    if (!jobId) return
    setJobLoading(true)

    Promise.all([
      getJobByIdApi(jobId)
        .then(res => setJob(res.data ?? null))
        .catch(() => notification.error({ message: 'Không tìm thấy tin tuyển dụng', duration: 2 }))
        .finally(() => setJobLoading(false)),

      getCvAnalysesApi(jobId)
        .then(res => {
          const analyses = res.data ?? []
          const resultsMap = analyses.reduce<Record<string, CvScoringResult>>((acc, item) => {
            if (item.application_id) acc[item.application_id] = item
            return acc
          }, {})
          setAiResults(resultsMap)
        })
        .catch(() => console.warn('Không thể tải lịch sử chấm điểm AI')),
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  const fetchApplications = async (
    s: string,
    status: ApplicationStatus | '',
    sort: SortByFilter,
  ) => {
    if (!jobId) return
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      sp.set('jobId', jobId)
      sp.set('pageNumber', '1')
      sp.set('pageSize', '1000') // Fetch all candidates (max 1000) for global filtering/sorting
      
      const backendSort = (sort === 'scoreDesc' || sort === 'scoreAsc') ? 'createdDate' : sort
      sp.set('sortBy', backendSort)
      sp.set('isDescending', 'true')
      if (status) sp.set('status', status)
      if (s) sp.set('searchTerm', s)

      const res = await getApplicationsApi(sp.toString())
      setApplications(res.data?.result ?? [])
    } catch {
      notification.error({ message: 'Không thể tải danh sách ứng viên', duration: 2 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchApplications(search, statusFilter, sortBy), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, sortBy, jobId])

  const handleUpdateStatus = async (id: string, status: ApplicationStatus, note?: string) => {
    try {
      await updateApplicationStatusApi(id, { status, reviewNote: note })
      notification.success({ message: 'Đã cập nhật trạng thái đơn ứng tuyển', duration: 2 })
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status, reviewNote: note } : a))
      if (selectedApp?.id === id) setSelectedApp(s => s ? { ...s, status, reviewNote: note } : s)
    } catch {
      notification.error({ message: 'Cập nhật thất bại', duration: 2 })
    }
  }

  const handleReset = () => {
    setSearch('')
    setStatusFilter('')
    setMatchScore('')
    setSortBy('createdDate')
    setPage(1)
  }

  const handleRunAiScoring = async () => {
    if (!job || applications.length === 0) return

    setAiLoading(true)
    try {
      const cvList = applications.map(app => ({
        application_id: app.id,
        job_id: jobId,
        customer_id: app.customerId,
        cv_text: buildCvText(app),
      }))

      const response = await scoreCvBatchApi({
        job_description: buildJobDescription(job),
        cv_list: cvList,
      }, Math.max(10, cvList.length))

      const nextResults = response.data.results.reduce<Record<string, CvScoringResult>>((acc, item) => {
        if (item.application_id) acc[item.application_id] = item
        return acc
      }, {})

      setAiResults(prev => ({ ...prev, ...nextResults }))
      notification.success({
        message: 'Đã chấm AI CV',
        description: `Đã nhận ${response.data.results.length} kết quả từ CVIntelligenceService.`,
        duration: 3,
      })
    } catch (err: any) {
      console.error('Lỗi chấm AI CV:', err)
      notification.error({
        message: 'Chấm AI CV thất bại',
        description: err?.response?.data?.message || err?.message || 'Kiểm tra CVIntelligenceService, API Gateway và token đăng nhập HR.',
        duration: 5,
      })
    } finally {
      setAiLoading(false)
    }
  }

  const totalApproved = applications.filter(a => a.status === 'APPROVED').length
  const minScore = matchScore ? parseInt(matchScore, 10) : 0
  let filteredApps = minScore > 0
    ? applications.filter(a => (aiResults[a.id]?.matching_score ?? 0) >= minScore)
    : applications

  if (sortBy === 'scoreDesc') {
    filteredApps = [...filteredApps].sort((a, b) => {
      const scoreA = aiResults[a.id]?.matching_score ?? 0
      const scoreB = aiResults[b.id]?.matching_score ?? 0
      return scoreB - scoreA
    })
  } else if (sortBy === 'scoreAsc') {
    filteredApps = [...filteredApps].sort((a, b) => {
      const scoreA = aiResults[a.id]?.matching_score ?? 0
      const scoreB = aiResults[b.id]?.matching_score ?? 0
      return scoreA - scoreB
    })
  }

  // Calculate total and current page slice locally for global sorting/filtering
  const total = filteredApps.length
  const displayedApps = filteredApps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="jap-page">
      <div className="jap-container">
        <Breadcrumb
          items={[
            { title: <Link to="/">Trang chủ</Link> },
            { title: <Link to="/hr/jobs">Quản lý tin tuyển dụng</Link> },
            { title: job?.name ?? 'Chi tiết' },
            { title: 'Ứng viên' },
          ]}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button
            icon={<LeftOutlined />}
            onClick={() => navigate('/hr/jobs')}
            style={{ borderRadius: 8 }}
          >
            Quay lại
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchApplications(search, statusFilter, sortBy)}
            style={{ borderRadius: 8 }}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<span className="material-symbols-outlined">auto_awesome</span>}
            loading={aiLoading}
            disabled={!job || applications.length === 0}
            onClick={handleRunAiScoring}
            style={{
              borderRadius: 8,
              background: (!job || applications.length === 0) ? undefined : '#002660',
              borderColor: (!job || applications.length === 0) ? undefined : '#002660',
              fontWeight: 700
            }}
          >
            Chấm AI CV
          </Button>
        </div>

        {jobLoading
          ? <Skeleton active paragraph={{ rows: 2 }} />
          : <ApplicationJobHeader job={job} total={total} totalApproved={totalApproved} />
        }

        <ApplicationFilterBar
          search={search}
          statusFilter={statusFilter}
          matchScore={matchScore}
          sortBy={sortBy}
          onSearchChange={v => { setSearch(v); setPage(1) }}
          onStatusChange={v => { setStatusFilter(v); setPage(1) }}
          onMatchChange={v => { setMatchScore(v); setPage(1) }}
          onSortChange={v => { setSortBy(v); setPage(1) }}
          onReset={handleReset}
        />

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} active avatar paragraph={{ rows: 2 }} style={{ background: '#fff', borderRadius: 12, padding: 16 }} />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <Empty
            className="jap-empty"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={(statusFilter || matchScore) ? 'Không có ứng viên khớp bộ lọc' : 'Chưa có ứng viên nào'}
          />
        ) : (
          <div className="jap-list">
            {displayedApps.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                aiResult={aiResults[app.id]}
                onView={a => { setSelectedApp(a); setDetailOpen(true) }}
                onUpdateStatus={handleUpdateStatus}
                downloadUrl={getResumeDownloadUrl}
              />
            ))}
          </div>
        )}

        {!loading && total > PAGE_SIZE && (
          <div className="jap-pagination">
            <span className="jap-pagination-info">
              Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, total)}-{Math.min(page * PAGE_SIZE, total)} trong tổng số <strong>{total}</strong> ứng viên
            </span>
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={total}
              onChange={p => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>

      <ApplicationDetailModal
        application={selectedApp}
        job={job}
        aiResult={selectedApp ? aiResults[selectedApp.id] : undefined}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdateStatus={(id, status, note) => {
          handleUpdateStatus(id, status, note)
          setDetailOpen(false)
        }}
        onAiResultGenerated={(appId, result) => {
          setAiResults(prev => ({ ...prev, [appId]: result }))
        }}
      />
    </div>
  )
}

export default JobApplicationsPage
