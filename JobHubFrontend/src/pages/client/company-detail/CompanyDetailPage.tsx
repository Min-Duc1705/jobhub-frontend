import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin, Empty } from 'antd'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../redux/store'
import { getCompanyByIdApi } from '../../../services/company-service'
import { getJobsApi } from '../../../services/job-service'
import { getCustomerByIdApi } from '../../../services/customer-service'
import { getMyResumesApi } from '../../../services/resume-service'
import { predictSalaryApi } from '../../../services/ai-service'
import type { ICompany } from '../../../types/company'
import type { IJob } from '../../../types/job'
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from '../../../types/job'
import type { ResumeContent } from '../../../types/resume-builder'
import './CompanyDetailPage.scss'

// ── Bộ từ khóa kỹ thuật dùng để extract skills từ CV text thô ─────────────────
const TECH_KEYWORDS = [
  'JavaScript','TypeScript','Python','Java','C#','C++','Go','Rust','Kotlin','Swift',
  'React','Vue','Angular','Next.js','Nuxt','Svelte','HTML','CSS','SCSS','Tailwind',
  'Node.js','Express','NestJS','Spring','Django','FastAPI','Flask','Laravel','ASP.NET',
  'PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','SQLite','Oracle','SQL Server',
  'Docker','Kubernetes','AWS','Azure','GCP','Terraform','CI/CD','Jenkins','GitHub Actions',
  'Git','Linux','Nginx','Apache','GraphQL','REST','gRPC','WebSocket','RabbitMQ','Kafka',
  'TensorFlow','PyTorch','Pandas','NumPy','Scikit-learn','OpenCV','LangChain',
  'Figma','Agile','Scrum','JIRA','Confluence','Photoshop',
]

/** Trích xuất skills từ text thô của CV bằng keyword matching */
const extractSkillsFromText = (text: string): string[] => {
  if (!text) return []
  const found = new Set<string>()
  const lower = text.toLowerCase()
  for (const kw of TECH_KEYWORDS) {
    // Tìm kiếm có word boundary để tránh false positive
    if (lower.includes(kw.toLowerCase())) {
      found.add(kw)
    }
  }
  return [...found]
}

const COMPANY_SIZE_LABEL: Record<string, string> = {
  STARTUP:    'Startup',
  SME:        'Vừa và nhỏ',
  ENTERPRISE: 'Tập đoàn lớn',
}

const stripHtml = (raw: string): string => {
  if (!raw) return ''
  return raw
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

const formatSalary = (job: IJob) => {
  if (job.isSalaryNegotiable || (!job.salaryMin && !job.salaryMax)) return 'Thỏa thuận'
  const isUsd = job.salaryCurrency === 'USD'
  const fmt = (n: number) => {
    if (isUsd) return `$${n.toLocaleString('en-US')}`
    return `${(n / 1_000_000).toFixed(0)} triệu`
  }
  
  if (job.salaryMin && job.salaryMax) {
    if (isUsd) return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`
    return `${(job.salaryMin / 1_000_000).toFixed(0)} – ${(job.salaryMax / 1_000_000).toFixed(0)} triệu`
  }
  if (job.salaryMin) return `Từ ${fmt(job.salaryMin)}`
  if (job.salaryMax) return `Đến ${fmt(job.salaryMax)}`
  return 'Thỏa thuận'
}

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const initFetched = useRef(false)

  // ── Redux auth ─────────────────────────────────────────────────────────────
  const currentUser = useSelector((s: RootState) => s.auth.user)

  const [company, setCompany] = useState<ICompany | null>(null)
  const [jobs,    setJobs]    = useState<IJob[]>([])
  const [loading, setLoading] = useState(true)
  const [slideIndex, setSlideIndex] = useState(0)  // gallery slideshow index

  // ── AI Premium salary prediction ───────────────────────────────────────────
  const [aiSalaryRange, setAiSalaryRange] = useState<string>('')
  const [loadingAi,     setLoadingAi]     = useState<boolean>(false)
  const [aiConfidence,  setAiConfidence]  = useState<number | null>(null)
  const [aiHint,        setAiHint]        = useState<string | null>(null)
  const [aiVisible,     setAiVisible]     = useState<boolean>(false)  // Ẩn card cho đến khi có dữ liệu

  // ── Lightbox
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const lightboxImgs = company?.activityImages ?? []
  const lightboxIdx  = lightboxSrc ? lightboxImgs.indexOf(lightboxSrc) : -1

  const openLightbox = (src: string) => setLightboxSrc(src)
  const closeLightbox = () => setLightboxSrc(null)
  const prevLightbox = () => {
    if (lightboxImgs.length < 2) return
    const i = (lightboxIdx - 1 + lightboxImgs.length) % lightboxImgs.length
    setLightboxSrc(lightboxImgs[i])
  }
  const nextLightbox = () => {
    if (lightboxImgs.length < 2) return
    const i = (lightboxIdx + 1) % lightboxImgs.length
    setLightboxSrc(lightboxImgs[i])
  }

  useEffect(() => {
    if (!id || initFetched.current) return
    initFetched.current = true

    const fetchData = async () => {
      setLoading(true)
      try {
        const [compRes, jobRes] = await Promise.all([
          getCompanyByIdApi(id),
          getJobsApi(`companyId=${id}&pageNumber=1&pageSize=20&sortBy=createdDate&isDescending=true`),
        ])
        setCompany(compRes.data ?? null)
        setJobs(jobRes.data?.result ?? [])
      } catch {
        setCompany(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ── AI Salary Prediction Effect ─────────────────────────────────────────────
  useEffect(() => {
    if (loading) return   // Chờ dữ liệu company + jobs nạp xong

    // ── Trường hợp 1: Chưa đăng nhập ─────────────────────────────────────────
    if (!currentUser) {
      const pubJobs = jobs.filter(j => j.status === 'PUBLISHED')
      const validJobs = pubJobs.filter(
        j => !j.isSalaryNegotiable && j.salaryMin && j.salaryMax
      )
      if (validJobs.length > 0) {
        // Chỉ hiện card khi có dữ liệu lương thực tế từ các job
        const avgMin = validJobs.reduce((acc, j) => acc + (j.salaryMin ?? 0), 0) / validJobs.length
        const avgMax = validJobs.reduce((acc, j) => acc + (j.salaryMax ?? 0), 0) / validJobs.length
        const toM = (v: number) => (v / 1_000_000).toFixed(0) + 'M'
        setAiSalaryRange(`${toM(avgMin)} – ${toM(avgMax)} đ`)
        setAiHint('Đăng nhập để xem dự đoán cá nhân hóa')
        setAiConfidence(null)
        setAiVisible(true)
      } else {
        // Không có dữ liệu lương → ẩn luôn
        setAiVisible(false)
      }
      return
    }

    // ── Trường hợp 2: Đã đăng nhập → gọi AI ──────────────────────────────────
    const fetchPersonalizedPrediction = async () => {
      setLoadingAi(true)
      setAiHint(null)
      try {
        // Lấy song song: profile + danh sách CV
        const [profileRes, resumeRes] = await Promise.all([
          getCustomerByIdApi(currentUser.id),
          getMyResumesApi(currentUser.id).catch(() => null),
        ])
        const profile = profileRes.data

        if (!profile) {
          setAiSalaryRange('15M – 35M đ')
          setAiHint('Hoàn thiện hồ sơ để nâng độ chính xác')
          return
        }

        const yearsExp  = profile.yearsOfExperience ?? 0
        const location  = profile.address || company?.address || 'Hồ Chí Minh'
        const jobTitle  = profile.summary?.trim() || 'Software Engineer'

        // Suy luận level từ số năm kinh nghiệm
        let level = 'JUNIOR'
        if (yearsExp <= 1)      level = 'FRESHER'
        else if (yearsExp <= 3) level = 'JUNIOR'
        else if (yearsExp <= 5) level = 'MIDDLE'
        else                    level = 'SENIOR'

        // ─────────────────────────────────────────────────────────────────────
        // CHIẾN LƯỢC TRÍCH XUẤT SKILLS: CV-first, profile là fallback
        // Ưu tiên 1: contentJson của Online CV Builder (cấu trúc có sẵn)
        // Ưu tiên 2: extractedText từ CV PDF upload (keyword matching)
        // Ưu tiên 3: profile.skills thủ công
        // ─────────────────────────────────────────────────────────────────────
        let skills: string[] = []
        let skillSource: 'cv_online' | 'cv_pdf' | 'profile' | 'none' = 'none'

        const resumes = resumeRes?.data?.result ?? []
        // Ưu tiên CV mặc định, nếu không có thì lấy CV mới nhất
        const defaultCv = resumes.find(r => r.isDefault) ?? resumes[0] ?? null

        if (defaultCv) {
          // Ưu tiên 1: Online CV Builder có contentJson
          if (defaultCv.isOnlineCv && defaultCv.contentJson) {
            try {
              const content = JSON.parse(defaultCv.contentJson) as ResumeContent
              // Flatten tất cả skill items từ mọi nhóm kỹ năng
              const cvSkills = content.skills
                ?.flatMap(g => g.items)
                .filter(Boolean)
                .map(s => s.trim())
                .filter(s => s.length > 0)
              if (cvSkills && cvSkills.length > 0) {
                skills = cvSkills.slice(0, 30)   // Giới hạn 30 skills để gọi API
                skillSource = 'cv_online'
              }
            } catch {
              // JSON parse fail → thử extractedText
            }
          }

          // Ưu tiên 2: CV PDF có extractedText → dùng keyword matching
          if (skills.length === 0 && defaultCv.extractedText) {
            const extracted = extractSkillsFromText(defaultCv.extractedText)
            if (extracted.length > 0) {
              skills = extracted
              skillSource = 'cv_pdf'
            }
          }
        }

        // Ưu tiên 3: profile.skills thủ công (fallback cuối)
        if (skills.length === 0) {
          const profileSkills = profile.skills?.map((s: { skillName: string }) => s.skillName) ?? []
          if (profileSkills.length > 0) {
            skills = profileSkills
            skillSource = 'profile'
          }
        }

        // ── Không có skills từ bất kỳ nguồn nào → Ẩn card
        if (skills.length === 0) {
          setAiVisible(false)
          return
        }

        // ── Gọi AI predict ────────────────────────────────────────────────────
        const aiRes = await predictSalaryApi({
          job_title:           jobTitle,
          years_of_experience: yearsExp,
          skill_set:           skills,
          location:            location,
          level:               level,
        })

        setAiSalaryRange(
          `${aiRes.min_salary.toFixed(0)}M – ${aiRes.max_salary.toFixed(0)}M đ`
        )
        setAiConfidence(aiRes.confidence ? Math.round(aiRes.confidence * 100) : null)
        setAiVisible(true)

        // Hiện nguồn data đã dùng
        const sourceLabel =
          skillSource === 'cv_online' ? `Phân tích từ CV online (${skills.length} kỹ năng)` :
          skillSource === 'cv_pdf'    ? `Trích xuất từ CV PDF (${skills.length} kỹ năng)` :
                                        `Từ hồ sơ cá nhân (${skills.length} kỹ năng)`
        setAiHint(sourceLabel)

      } catch (err) {
        console.warn('Lỗi dự đoán lương Premium:', err)
        setAiSalaryRange('15M – 35M đ')
        setAiHint('Không thể kết nối AI, hiển thị ước tính mặc định')
      } finally {
        setLoadingAi(false)
      }
    }

    fetchPersonalizedPrediction()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, company, loading])

  const logoSrc = (c: ICompany) =>
    c.logo?.trim()
      ? c.logo
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=003a8c&color=fff&size=256&bold=true`

  if (loading) return (
    <div className="cd-loading-screen"><Spin size="large" tip="Đang tải..." /></div>
  )

  if (!company) return (
    <div className="cd-loading-screen">
      <Empty description="Không tìm thấy công ty" />
      <button className="cd-btn-back" onClick={() => navigate('/companies')}>← Quay lại danh sách</button>
    </div>
  )

  const descriptionText = stripHtml(company.description ?? '')
  const publishedJobs = jobs.filter(j => j.status === 'PUBLISHED')

  return (
    <div className="company-detail-page">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="cd-hero">
        <div
          className="cd-hero-bg"
          style={company.coverImage ? { backgroundImage: `url('${company.coverImage}')` } : undefined}
        />
        <div className="cd-hero-overlay" />
      </section>

      {/* ── Brand Card (nhô lên đè lên hero bằng margin-top âm) ───────────── */}
      <div className="cd-brand-band">
        <div className="cd-brand-card">
          {/* Logo nằm trong card, nhô lên bằng margin-top âm */}
          <div className="cd-logo-wrap">
            <img
              src={logoSrc(company)}
              alt={company.name}
              className="cd-logo"
              onError={e => { (e.target as HTMLImageElement).src = logoSrc({ ...company, logo: '' }) }}
            />
          </div>

          {/* Thông tin + Nút action */}
          <div className="cd-brand-info">
            <div className="cd-brand-main">
              <div className="cd-name-wrapper">
                <h1 className="cd-company-name">{company.name}</h1>
                {company.isVerified && (
                  <span className="cd-verified-badge">
                    <span className="material-symbols-outlined">verified</span>
                    Đã xác minh
                  </span>
                )}
              </div>
              <div className="cd-meta-row">
                {company.industry && (
                  <span className="cd-meta-item">
                    <span className="material-symbols-outlined">domain</span>
                    {company.industry}
                  </span>
                )}
                {company.companySize && (
                  <span className="cd-meta-item">
                    <span className="material-symbols-outlined">groups</span>
                    {COMPANY_SIZE_LABEL[company.companySize]}
                  </span>
                )}
              </div>
              {company.address && (
                <div className="cd-address-row">
                  <span className="material-symbols-outlined">location_on</span>
                  <span className="cd-address-text">{company.address}</span>
                </div>
              )}
            </div>

            <div className="cd-brand-actions">
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="cd-btn-outline">
                  <span className="material-symbols-outlined">language</span>
                  Website
                </a>
              )}
              <button
                className="cd-btn-primary"
                onClick={() => document.getElementById('cd-jobs-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span className="material-symbols-outlined">work</span>
                {publishedJobs.length} việc làm đang mở
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Sub-Nav ────────────────────────────────────────────────── */}
      <nav className="cd-sub-nav">
        <div className="cd-sub-nav-inner">
          <a href="#cd-about" className="cd-nav-link">Tổng quan</a>
          <a href="#cd-jobs-section" className="cd-nav-link">Việc làm ({publishedJobs.length})</a>
          <a href="#cd-culture" className="cd-nav-link">Văn hóa</a>
          <a href="#cd-benefits" className="cd-nav-link">Phúc lợi</a>
        </div>
      </nav>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="cd-body">

        {/* LEFT: Main Content */}
        <div className="cd-main">

          {/* Giới thiệu */}
          <section id="cd-about" className="cd-section">
            <h2 className="cd-section-title">Giới thiệu</h2>
            {descriptionText ? (
              <p className="cd-description-text">{descriptionText}</p>
            ) : (
              <p className="cd-description-text cd-no-data">Chưa có thông tin giới thiệu.</p>
            )}
          </section>

          {/* Stats */}
          <section className="cd-section cd-stats-grid">
            <div className="cd-stat-card">
              <span className="material-symbols-outlined cd-stat-icon">calendar_today</span>
              <div className="cd-stat-value">
                {company.createdDate ? new Date(company.createdDate).getFullYear() : '—'}
              </div>
              <div className="cd-stat-label">Năm thành lập</div>
            </div>
            <div className="cd-stat-card">
              <span className="material-symbols-outlined cd-stat-icon">groups</span>
              <div className="cd-stat-value">
                {company.companySize ? COMPANY_SIZE_LABEL[company.companySize] : '—'}
              </div>
              <div className="cd-stat-label">Quy mô</div>
            </div>
            <div className="cd-stat-card">
              <span className="material-symbols-outlined cd-stat-icon">work</span>
              <div className="cd-stat-value">{publishedJobs.length}</div>
              <div className="cd-stat-label">Vị trí mở</div>
            </div>
            <div className="cd-stat-card">
              <span className="material-symbols-outlined cd-stat-icon">domain</span>
              <div className="cd-stat-value">{company.industry ?? '—'}</div>
              <div className="cd-stat-label">Ngành nghề</div>
            </div>
          </section>

          {/* Việc làm */}
          <section id="cd-jobs-section" className="cd-section">
            <div className="cd-section-header">
              <h2 className="cd-section-title">Vị trí đang tuyển</h2>
              <span className="cd-job-count">{publishedJobs.length} việc làm</span>
            </div>

            {publishedJobs.length === 0 ? (
              <Empty description="Hiện chưa có vị trí tuyển dụng" />
            ) : (
              <div className="cd-job-list">
                {publishedJobs.map(j => (
                  <div key={j.id} className="cd-job-card" onClick={() => navigate(`/jobs/${j.id}`)}>
                    <div className="cd-job-main">
                      <h3 className="cd-job-title">{j.name}</h3>
                      <div className="cd-job-meta">
                        {j.location && (
                          <span className="cd-job-meta-item">
                            <span className="material-symbols-outlined">location_on</span>
                            {j.location}
                          </span>
                        )}
                        <span className="cd-job-meta-item">
                          <span className="material-symbols-outlined">person</span>
                          {JOB_LEVEL_LABEL[j.level]}
                        </span>
                        <span className="cd-job-meta-item">
                          <span className="material-symbols-outlined">schedule</span>
                          {JOB_TYPE_LABEL[j.jobType]}
                        </span>
                      </div>
                      <div className="cd-job-skills">
                        {j.skills.slice(0, 5).map(s => (
                          <span key={s.id} className="cd-skill-tag">{s.name}</span>
                        ))}
                        {j.skills.length > 5 && (
                          <span className="cd-skill-tag cd-skill-more">+{j.skills.length - 5}</span>
                        )}
                      </div>
                    </div>
                    <div className="cd-job-right">
                      <span className="cd-salary">{formatSalary(j)}</span>
                      <button className="cd-btn-apply" onClick={e => { e.stopPropagation(); navigate(`/jobs/${j.id}`) }}>
                        Xem & Ứng tuyển
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ảnh văn phòng / hoạt động */}
          {(company.activityImages?.length ?? 0) > 0 && (
            <section className="cd-section">
              <h2 className="cd-section-title">Hình ảnh văn phòng</h2>
              <div className="cd-gallery">
                {/* Slideshow hiển thị 2 ảnh một lúc */}
                {(() => {
                  const imgs = company.activityImages ?? []
                  const totalSlides = Math.ceil(imgs.length / 2)
                  const slide = imgs.slice(slideIndex * 2, slideIndex * 2 + 2)
                  return (
                    <>
                      {/* Mỗi ảnh là 1 card riêng, không hiển thị card rỗng */}
                      <div className="cd-gallery-slides">
                        {slide.map((src, i) => (
                          <div
                            key={i}
                            className="cd-gallery-card"
                            onClick={() => openLightbox(src)}
                            title="Nhấn để xem ảnh lớn"
                          >
                            <img
                              src={src}
                              alt={`Ảnh hoạt động ${slideIndex * 2 + i + 1}`}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                            <div className="cd-gallery-card-overlay">
                              <span className="material-symbols-outlined">zoom_in</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {totalSlides > 1 && (
                        <div className="cd-gallery-controls">
                          <button
                            className="cd-gallery-btn"
                            onClick={() => setSlideIndex(p => (p - 1 + totalSlides) % totalSlides)}
                            aria-label="Slide trước"
                          >
                            <span className="material-symbols-outlined">chevron_left</span>
                          </button>
                          <div className="cd-gallery-dots">
                            {Array.from({ length: totalSlides }).map((_, d) => (
                              <button
                                key={d}
                                className={`cd-gallery-dot${d === slideIndex ? ' active' : ''}`}
                                onClick={() => setSlideIndex(d)}
                                aria-label={`Slide ${d + 1}`}
                              />
                            ))}
                          </div>
                          <button
                            className="cd-gallery-btn"
                            onClick={() => setSlideIndex(p => (p + 1) % totalSlides)}
                            aria-label="Slide sau"
                          >
                            <span className="material-symbols-outlined">chevron_right</span>
                          </button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </section>
          )}

          {/* YouTube video giới thiệu */}
          {company.youtubeUrl && (
            <section className="cd-section">
              <h2 className="cd-section-title">Video giới thiệu</h2>
              <div className="cd-youtube-wrapper">
                <iframe
                  src={company.youtubeUrl}
                  title={`Video giới thiệu ${company.name}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Văn hóa */}
          <section id="cd-culture" className="cd-section">
            <h2 className="cd-section-title">Văn hóa công ty</h2>
            <div className="cd-culture-grid">
              <div className="cd-culture-card">
                <span className="material-symbols-outlined cd-culture-icon">diversity_3</span>
                <h4>Môi trường đa dạng</h4>
                <p>Hội tụ nhân tài từ khắp nơi, trân trọng sự khác biệt và sáng tạo.</p>
              </div>
              <div className="cd-culture-card">
                <span className="material-symbols-outlined cd-culture-icon">trending_up</span>
                <h4>Phát triển liên tục</h4>
                <p>Đầu tư vào học hỏi, mentoring và lộ trình thăng tiến rõ ràng.</p>
              </div>
              <div className="cd-culture-card">
                <span className="material-symbols-outlined cd-culture-icon">balance</span>
                <h4>Cân bằng cuộc sống</h4>
                <p>Linh hoạt thời gian làm việc, hỗ trợ sức khỏe thể chất và tinh thần.</p>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT: Sidebar */}
        <aside className="cd-sidebar">

          {/* AI Card — chỉ hiện khi có dữ liệu thực tế (CV / skills / lương job) */}
          {aiVisible && (
            <div className="cd-ai-card">
              <div className="cd-ai-glow" />
              {/* Shimmer overlay khi đang tải */}
              {loadingAi && <div className="cd-ai-shimmer" />}
              <div className="cd-ai-content">
                <div className="cd-ai-header">
                  <span className="material-symbols-outlined cd-ai-icon">auto_awesome</span>
                  <span className="cd-ai-label">JobHub AI Premium</span>
                  {aiConfidence !== null && (
                    <span className="cd-ai-confidence">{aiConfidence}% tin cậy</span>
                  )}
                </div>
                <h3 className="cd-ai-title">Dự đoán Lương</h3>
                <p className="cd-ai-desc">
                  {currentUser
                    ? 'Mức lương ước tính dựa trên kỹ năng & kinh nghiệm của bạn tại công ty này.'
                    : 'Đăng nhập để xem dự đoán lương cá nhân hóa bằng AI.'}
                </p>
                <div className="cd-salary-preview">
                  <span className="cd-salary-label">Ước tính</span>
                  <span className={`cd-salary-range ${loadingAi ? 'cd-salary-loading' : ''}`}>
                    {loadingAi ? 'Đang phân tích...' : aiSalaryRange}
                  </span>
                </div>

                {/* Hint message — 2 variants: success (data source) vs warning */}
                {aiHint && !loadingAi && (() => {
                  const isSuccess = aiHint.includes('kỹ năng')
                  return (
                    <div className={`cd-ai-hint ${isSuccess ? 'cd-ai-hint--success' : ''}`}>
                      <span className="material-symbols-outlined">
                        {isSuccess ? 'check_circle' : 'info'}
                      </span>
                      {aiHint}
                    </div>
                  )
                })()}

                <button
                  className="cd-btn-ai"
                  onClick={() => currentUser ? navigate('/salary-predict') : navigate('/login')}
                >
                  {currentUser ? 'Chạy báo cáo cá nhân' : 'Đăng nhập để xem ngay'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Phúc lợi */}
          <section id="cd-benefits" className="cd-sidebar-card">
            <h3 className="cd-sidebar-title">Phúc lợi & Đãi ngộ</h3>
            <ul className="cd-benefits-list">
              {[
                { icon: 'health_and_safety', title: 'Bảo hiểm toàn diện',     desc: 'BHXH, BHYT, bảo hiểm sức khỏe nâng cao' },
                { icon: 'paid',              title: 'Lương thưởng cạnh tranh', desc: 'Thưởng KPI, lương tháng 13, review hàng năm' },
                { icon: 'home_work',         title: 'Làm việc linh hoạt',      desc: 'Remote/Hybrid tùy vị trí' },
                { icon: 'school',            title: 'Đào tạo & Phát triển',    desc: 'Ngân sách học tập, cấp chứng chỉ quốc tế' },
              ].map(b => (
                <li key={b.icon} className="cd-benefit-item">
                  <span className="material-symbols-outlined cd-benefit-icon">{b.icon}</span>
                  <div>
                    <h4 className="cd-benefit-title">{b.title}</h4>
                    <p className="cd-benefit-desc">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Thông tin liên hệ */}
          <div className="cd-sidebar-card">
            <h3 className="cd-sidebar-title">Thông tin liên hệ</h3>
            <ul className="cd-contact-list">
              {company.website && (
                <li className="cd-contact-item">
                  <span className="material-symbols-outlined">language</span>
                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              )}
              {company.contactEmail && (
                <li className="cd-contact-item">
                  <span className="material-symbols-outlined">mail</span>
                  <a href={`mailto:${company.contactEmail}`}>{company.contactEmail}</a>
                </li>
              )}
              {company.address && (
                <li className="cd-contact-item">
                  <span className="material-symbols-outlined">location_on</span>
                  <span>{company.address}</span>
                </li>
              )}
              {company.taxCode && (
                <li className="cd-contact-item">
                  <span className="material-symbols-outlined">receipt</span>
                  <span>MST: {company.taxCode}</span>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightboxSrc && (
        <div className="cd-lightbox-overlay" onClick={closeLightbox}>
          {/* Prev */}
          {lightboxImgs.length > 1 && (
            <button
              className="cd-lightbox-nav cd-lightbox-nav--prev"
              onClick={e => { e.stopPropagation(); prevLightbox() }}
              aria-label="Ảnh trước"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
          )}

          {/* Image */}
          <div className="cd-lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={lightboxSrc} alt="Preview" className="cd-lightbox-img" />
            <div className="cd-lightbox-counter">
              {lightboxIdx + 1} / {lightboxImgs.length}
            </div>
          </div>

          {/* Next */}
          {lightboxImgs.length > 1 && (
            <button
              className="cd-lightbox-nav cd-lightbox-nav--next"
              onClick={e => { e.stopPropagation(); nextLightbox() }}
              aria-label="Ảnh sau"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          )}

          {/* Close */}
          <button className="cd-lightbox-close" onClick={closeLightbox} aria-label="Đóng">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default CompanyDetailPage
