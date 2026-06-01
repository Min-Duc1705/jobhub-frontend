import { Link, useNavigate } from 'react-router-dom'
import { Card, Tag, Spin, Empty } from 'antd'
import { useState, useEffect } from 'react'
import { useAppSelector } from '../../../redux/hooks'
import { getMyResumesApi } from '../../../services/resume-service'
import { getJobRecommendationsApi } from '../../../services/ai-service'
import type { IResumeBasic } from '../../../types/application'
import type { IResume, ResumeContent } from '../../../types/resume-builder'
import './JobCandidateComponents.scss'

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

const JobRecommendationsWidget = () => {
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)

  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?.id) return
      setLoading(true)
      try {
        const resumesRes = await getMyResumesApi(user.id)
        const resumes = resumesRes.data?.result ?? []
        const defaultResume = resumes.find(r => r.isDefault) || resumes[0]

        if (defaultResume) {
          const cvText = buildCvText({
            id: '',
            customerId: user.id,
            resume: defaultResume,
            coverLetter: ''
          }, defaultResume)

          const recRes = await getJobRecommendationsApi({ cv_text: cvText, customer_id: user.id })
          // AI service trả về tối đa 6 jobs, ta lấy top 3 hiển thị ở widget sidebar
          setRecommendations((recRes.data ?? []).slice(0, 3))
        }
      } catch (err) {
        console.warn('Lỗi khi tải gợi ý việc làm widget:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [user?.id])

  return (
    <Card 
      variant="outlined" 
      style={{ borderRadius: 12, borderColor: '#c3c6d3' }} 
      className="shadow-sm"
      title={<span className="font-bold text-slate-800 text-sm">Gợi ý cho bạn</span>}
      extra={<Link to="/jobs" className="text-xs font-bold text-[#005daa] hover:underline">Xem tất cả</Link>}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin />
        </div>
      ) : recommendations.length === 0 ? (
        <Empty 
          description="Chưa có gợi ý việc làm nào. Hãy cập nhật CV mặc định để AI phân tích." 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '10px 0' }}
        />
      ) : (
        <div className="cjp-recommendations-list">
          {recommendations.map((job) => (
            <div 
              key={job.id} 
              className="cjp-recommendation-item"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <div className="cjp-rec-logo-wrap">
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt={job.companyName} />
                ) : (
                  <span className="material-symbols-outlined">corporate_fare</span>
                )}
              </div>
              <div className="cjp-rec-info">
                <h6 className="cjp-rec-title">
                  {job.name}
                </h6>
                <p className="cjp-rec-company">{job.companyName}</p>
                <Tag 
                  color={job.matching_score >= 60 ? 'geekblue' : 'default'}
                  style={{ 
                    borderRadius: 4, 
                    fontSize: '9px', 
                    fontWeight: 800, 
                    marginTop: 4,
                    padding: '0 4px',
                  }}
                >
                  MATCH {Math.round(job.matching_score)}%
                </Tag>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default JobRecommendationsWidget
