import { useState, useEffect } from 'react'
import { Button } from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import type { IJob } from '../../../types/job'
import type { ICompany, CompanySize } from '../../../types/company'
import { SIZE_LABEL } from './jobDetailHelpers'
import SimilarJobsWidget from './SimilarJobsWidget'
import { predictSalaryApi } from '../../../services/ai-service'
import './JobSidebar.scss'

interface Props {
  job: IJob
  company: ICompany | null
  similar: IJob[]
  companyName: string
  companyLogo?: string
}

const JobSidebar = ({ job, company, similar, companyName, companyLogo }: Props) => {
  const navigate       = useNavigate()
  const companyInitial = companyName.charAt(0).toUpperCase()

  const [predictedSalary, setPredictedSalary] = useState<{ min: number; max: number; confidence: number } | null>(null)
  const [loadingPredict, setLoadingPredict] = useState(false)

  useEffect(() => {
    if (!job) return
    setLoadingPredict(true)

    // Trích xuất số năm kinh nghiệm từ experienceRequired
    let expYears = 1
    const expStr = job.experienceRequired || ''
    const match = expStr.match(/\d+/)
    if (match) {
      expYears = parseInt(match[0], 10)
    } else if (expStr.toLowerCase().includes('dưới 1 năm') || expStr.toLowerCase().includes('không yêu cầu')) {
      expYears = 0
    }

    predictSalaryApi({
      job_title: job.name,
      years_of_experience: expYears,
      skill_set: job.skills?.map(s => s.name) ?? [],
      location: job.location || 'Khác',
      level: job.level || 'JUNIOR',
    })
      .then(res => {
        if (res) {
          setPredictedSalary({
            min: res.min_salary,
            max: res.max_salary,
            confidence: res.confidence,
          })
        }
      })
      .catch(err => {
        console.warn('Lỗi dự báo lương AI:', err)
      })
      .finally(() => setLoadingPredict(false))
  }, [job])

  return (
    <div className="jd-sidebar">

      {/* AI Salary Predictor */}
      <div className="jd-ai-card">
        <div className="jd-ai-card-label">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
          <span>Dự đoán lương AI</span>
        </div>
        <div className="jd-ai-card-sub">Phân tích dựa trên thị trường IT Việt Nam.</div>
        <div className="jd-ai-salary-row">
          <span className="jd-ai-label">Khoảng lương dự báo</span>
          <span className="jd-ai-value">
            {loadingPredict 
              ? 'Đang tính toán...' 
              : (predictedSalary 
                  ? `${predictedSalary.min.toFixed(1)}M – ${predictedSalary.max.toFixed(1)}M ₫` 
                  : 'Không đủ dữ liệu'
                )
            }
          </span>
        </div>
        <div className="jd-ai-bar-track">
          <div className="jd-ai-bar-fill" style={{ width: `${predictedSalary ? Math.round(predictedSalary.confidence * 100) : 0}%` }} />
        </div>
        <div className="jd-ai-note">
          Độ tin cậy của AI: <span style={{ color: '#ffd666' }}>{predictedSalary ? Math.round(predictedSalary.confidence * 100) : 85}%</span>. Cập nhật {dayjs().format('MM/YYYY')}.
        </div>
      </div>

      {/* Company card */}
      <div className="jd-company-card">
        <div className="jd-company-banner" />
        <div className="jd-company-body">
          {companyLogo
            ? <img src={companyLogo} alt={companyName} className="jd-company-avatar" />
            : <div className="jd-company-avatar-fallback">{companyInitial}</div>
          }
          <div className="jd-company-name">{companyName}</div>
          <div className="jd-company-type">
            {company?.industry ?? 'Công nghệ thông tin'}
            {company?.companySize ? ` • ${SIZE_LABEL[company.companySize as CompanySize]}` : ''}
          </div>
          {company?.description && (
            <div
              className="jd-company-desc"
              dangerouslySetInnerHTML={{ __html: company.description }}
            />
          )}
          <div className="jd-company-meta">
            <div>
              <div className="jd-company-meta-label">Địa chỉ</div>
              <div className="jd-company-meta-val">{company?.address ?? job.location ?? '—'}</div>
            </div>
            <div>
              <div className="jd-company-meta-label">Website</div>
              <div className="jd-company-meta-val">
                {company?.website
                  ? <a href={company.website} target="_blank" rel="noreferrer" style={{ color: '#005daa' }}>
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  : '—'
                }
              </div>
            </div>
          </div>
          <Button
            block
            onClick={() => navigate(`/companies/${job.companyId}`)}
            style={{ borderColor: '#002660', color: '#002660', fontWeight: 600, fontSize: 13 }}
          >
            Xem hồ sơ công ty →
          </Button>
        </div>
      </div>

      {/* Similar jobs */}
      <SimilarJobsWidget similar={similar} companyName={companyName} />

    </div>
  )
}

export default JobSidebar
