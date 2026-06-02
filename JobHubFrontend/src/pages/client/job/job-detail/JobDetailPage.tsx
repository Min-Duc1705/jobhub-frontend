import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { App, Breadcrumb, Skeleton } from 'antd'
import JobStickyBar from '../../../../components/shared/job-detail/JobStickyBar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

import type { RootState } from '../../../../redux/store'
import type { IJob } from '../../../../types/job'
import type { ICompany } from '../../../../types/company'
import { getJobByIdApi, getJobsApi, getSavedJobsApi, saveJobApi, unsaveJobApi } from '../../../../services/job-service'
import { getCompanyByIdApi } from '../../../../services/company-service'
import { getApplicationsApi } from '../../../../services/application-service'
import { getCustomerByIdApi } from '../../../../services/customer-service'
import { formatSalary } from '../../../../components/shared/job-detail/jobDetailHelpers'
import { trackJobInteractionApi } from '../../../../services/ai-service'
import JobDetailHeader from '../../../../components/shared/job-detail/JobDetailHeader'
import JobContentLeft  from '../../../../components/shared/job-detail/JobContentLeft'
import JobSidebar      from '../../../../components/shared/job-detail/JobSidebar'
import JobApplyModal   from '../../../../components/shared/job-detail/JobApplyModal'
import './JobDetailPage.scss'

dayjs.extend(relativeTime)
dayjs.locale('vi')

/* ═══════════════════════════════════════════════════════════════
   JobDetailPage
   ═══════════════════════════════════════════════════════════════ */
const JobDetailPage = () => {
  const { id }           = useParams<{ id: string }>()
  const navigate          = useNavigate()
  const { notification }  = App.useApp()
  const currentUser       = useSelector((s: RootState) => s.auth.user)

  const [job,            setJob]            = useState<IJob | null>(null)
  const [company,        setCompany]        = useState<ICompany | null>(null)
  const [similar,        setSimilar]        = useState<IJob[]>([])
  const [loading,        setLoading]        = useState(true)
  const [saved,          setSaved]          = useState(false)
  const [applyOpen,      setApplyOpen]      = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  // ── Fetch job + company + similar ──────────────────────────────
  useEffect(() => {
    if (!id) return
    setLoading(true)
    getJobByIdApi(id)
      .then(res => {
        const j = res.data
        if (!j) { navigate('/jobs'); return }
        setJob(j)
        if (j.companyId) {
          getCompanyByIdApi(j.companyId)
            .then(cr => setCompany(cr.data ?? null))
            .catch(() => {})
        }

        // Lấy công việc tương tự dựa trên kỹ năng (skills) hoặc từ khóa tiêu đề, fallback về cùng công ty
        const skillIds = j.skills?.map(s => s.id) ?? []
        const queryParams = skillIds.length > 0
          ? skillIds.map(id => `skillIds=${id}`).join('&')
          : `searchTerm=${encodeURIComponent(j.name.split(' ')[0])}`

        getJobsApi(`${queryParams}&pageSize=10&sortBy=createdDate&isDescending=true`)
          .then(sr => {
            const list = (sr.data?.result ?? []).filter(s => s.id !== j.id)
            if (list.length > 0) {
              setSimilar(list.slice(0, 3))
            } else {
              // Fallback: việc làm cùng công ty
              getJobsApi(`companyId=${j.companyId}&pageSize=4&sortBy=createdDate&isDescending=true`)
                .then(cr => setSimilar((cr.data?.result ?? []).filter(s => s.id !== j.id).slice(0, 3)))
                .catch(() => {})
            }
          })
          .catch(() => {})
      })
      .catch(() => {
        notification.error({ message: 'Không tìm thấy tin tuyển dụng', duration: 3 })
        navigate('/jobs')
      })
      .finally(() => setLoading(false))
  }, [id])

  // ── Kiểm tra đã ứng tuyển chưa ────────────────────────────────
  useEffect(() => {
    if (!id || !currentUser) return
    getApplicationsApi(`jobId=${id}&customerId=${currentUser.id}&pageSize=1`)
      .then(res => setAlreadyApplied((res.data?.meta?.total ?? 0) > 0))
      .catch(() => {})
  }, [id, currentUser])

  // ── Kiểm tra đã lưu chưa ──────────────────────────────────────
  useEffect(() => {
    if (!id || !currentUser) {
      setSaved(false)
      return
    }
    getSavedJobsApi('pageNumber=1&pageSize=1000')
      .then(res => {
        const savedList = res.data?.result ?? []
        const isJobSaved = savedList.some((sj: any) => sj.jobId === id)
        setSaved(isJobSaved)
      })
      .catch(() => {})
  }, [id, currentUser])

  // ── Ghi nhận tương tác VIEW & CLICK ───────────────────────────
  useEffect(() => {
    if (id && currentUser?.id) {
      trackJobInteractionApi({
        customer_id: currentUser.id,
        job_id: id,
        interaction_type: 'VIEW'
      }).catch(() => {})

      trackJobInteractionApi({
        customer_id: currentUser.id,
        job_id: id,
        interaction_type: 'CLICK'
      }).catch(() => {})
    }
  }, [id, currentUser?.id])

  // ── Open apply modal (auth guard) ─────────────────────────────
  const openApplyModal = () => {
    if (!currentUser) {
      notification.warning({ message: 'Vui lòng đăng nhập để ứng tuyển', duration: 2 })
      navigate('/login')
      return
    }
    setApplyOpen(true)
  }

  // ── Lưu/Bỏ lưu tin tuyển dụng ──────────────────────────────────
  const handleToggleSave = async () => {
    if (!currentUser) {
      notification.warning({ message: 'Vui lòng đăng nhập để lưu tin tuyển dụng', duration: 2 })
      navigate('/login')
      return
    }
    if (!id) return
    const wasSaved = saved
    try {
      if (wasSaved) {
        await unsaveJobApi(id)
        setSaved(false)
        notification.success({ message: 'Đã bỏ lưu tin tuyển dụng', duration: 1.5 })
      } else {
        await saveJobApi(id)
        setSaved(true)
        notification.success({ message: 'Lưu tin tuyển dụng thành công!', duration: 1.5 })
        trackJobInteractionApi({
          customer_id: currentUser.id,
          job_id: id,
          interaction_type: 'SAVE'
        }).catch(() => {})
      }
    } catch {
      notification.error({ message: wasSaved ? 'Bỏ lưu thất bại' : 'Lưu tin tuyển dụng thất bại', duration: 2 })
    }
  }

  // ── Nhắn tin với nhà tuyển dụng ────────────────────────────────
  const handleMessage = async () => {
    if (!currentUser) {
      notification.warning({ message: 'Vui lòng đăng nhập để nhắn tin', duration: 2 })
      navigate('/login')
      return
    }
    if (!job?.customerId) {
      notification.error({ message: 'Không thể nhắn tin với tin tuyển dụng này', duration: 2 })
      return
    }
    
    try {
      const res = await getCustomerByIdApi(job.customerId)
      if (res && res.data && res.data.appUserId) {
        navigate(`/chat?userId=${res.data.appUserId}`)
      } else {
        notification.error({ message: 'Không tìm thấy thông tin liên hệ của nhà tuyển dụng', duration: 2 })
      }
    } catch (err) {
      console.error('Error fetching HR appUserId:', err)
      notification.error({ message: 'Không thể kết nối tới tài khoản của nhà tuyển dụng', duration: 2 })
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="jd-wrap">
        <Skeleton active paragraph={{ rows: 4 }} style={{ marginBottom: 24 }} />
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    )
  }

  if (!job) return null

  const salaryText  = formatSalary(job)
  const companyName = job.companyName ?? company?.name ?? 'Công ty'
  const companyLogo = job.companyLogo ?? company?.logo

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="jd-page">
      <div className="jd-wrap">

        {/* Breadcrumb */}
        <Breadcrumb
          className="jd-breadcrumb"
          items={[
            { title: <Link to="/">Trang chủ</Link> },
            { title: <Link to="/jobs">Việc làm</Link> },
            { title: job.name },
          ]}
        />

        {/* Header */}
        <JobDetailHeader
          job={job}
          companyName={companyName}
          companyLogo={companyLogo}
          salaryText={salaryText}
          saved={saved}
          alreadyApplied={alreadyApplied}
          showChatButton={!!job.customerId && (!currentUser || currentUser.id.toLowerCase() !== job.customerId.toLowerCase())}
          onToggleSave={handleToggleSave}
          onApply={openApplyModal}
          onMessage={handleMessage}
        />

        {/* Grid */}
        <div className="jd-grid">
          <JobContentLeft job={job} />
          <JobSidebar
            job={job}
            company={company}
            similar={similar}
            companyName={companyName}
            companyLogo={companyLogo}
          />
        </div>

      </div>

      {/* Mobile sticky bar */}
      <JobStickyBar
        saved={saved}
        alreadyApplied={alreadyApplied}
        showChatButton={!!job.customerId && (!currentUser || currentUser.id.toLowerCase() !== job.customerId.toLowerCase())}
        onToggleSave={handleToggleSave}
        onApply={openApplyModal}
        onMessage={handleMessage}
      />

      {/* Apply Modal */}
      {currentUser && (
        <JobApplyModal
          open={applyOpen}
          job={job}
          company={company}
          currentUserId={currentUser.id}
          onSuccess={() => setAlreadyApplied(true)}
          onClose={() => setApplyOpen(false)}
        />
      )}
    </div>
  )
}

export default JobDetailPage
