import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin, Empty } from 'antd'
import { getCompanyByIdApi } from '../../../services/company-service'
import { getJobsApi } from '../../../services/job-service'
import type { ICompany } from '../../../types/company'
import type { IJob } from '../../../types/job'
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from '../../../types/job'
import './CompanyDetailPage.scss'

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
  if (job.isSalaryNegotiable) return 'Thỏa thuận'
  const cur = job.salaryCurrency === 'USD' ? '$' : 'đ'
  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` : n.toLocaleString()
  if (job.salaryMin && job.salaryMax) return `${cur}${fmt(job.salaryMin)} – ${cur}${fmt(job.salaryMax)}`
  if (job.salaryMin) return `Từ ${cur}${fmt(job.salaryMin)}`
  return 'Thỏa thuận'
}

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const initFetched = useRef(false)

  const [company, setCompany] = useState<ICompany | null>(null)
  const [jobs,    setJobs]    = useState<IJob[]>([])
  const [loading, setLoading] = useState(true)
  const [slideIndex, setSlideIndex] = useState(0)  // gallery slideshow index

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
              <h1 className="cd-company-name">{company.name}</h1>
              <div className="cd-meta-row">
                {company.industry && (
                  <span className="cd-meta-item">
                    <span className="material-symbols-outlined">domain</span>
                    {company.industry}
                  </span>
                )}
                {company.address && (
                  <span className="cd-meta-item">
                    <span className="material-symbols-outlined">location_on</span>
                    {company.address}
                  </span>
                )}
                {company.companySize && (
                  <span className="cd-meta-item">
                    <span className="material-symbols-outlined">groups</span>
                    {COMPANY_SIZE_LABEL[company.companySize]}
                  </span>
                )}
              </div>
              {company.isVerified && (
                <span className="cd-verified-badge">
                  <span className="material-symbols-outlined">verified</span>
                  Đã xác minh
                </span>
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

          {/* AI Card */}
          <div className="cd-ai-card">
            <div className="cd-ai-glow" />
            <div className="cd-ai-content">
              <div className="cd-ai-header">
                <span className="material-symbols-outlined cd-ai-icon">auto_awesome</span>
                <span className="cd-ai-label">JobHub AI Premium</span>
              </div>
              <h3 className="cd-ai-title">Dự đoán Lương</h3>
              <p className="cd-ai-desc">Xem mức lương tiềm năng tại công ty này dựa trên kỹ năng và kinh nghiệm của bạn.</p>
              <div className="cd-salary-preview">
                <span className="cd-salary-label">Ước tính</span>
                <span className="cd-salary-range">15M – 35M đ</span>
              </div>
              <button className="cd-btn-ai">
                Chạy báo cáo cá nhân
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

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
