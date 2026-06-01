import React from 'react';
import { Spin, Empty } from 'antd';
import type { ICompany } from '../../../types/company';

const logoSrc = (c: ICompany) =>
  c.logo?.trim()
    ? c.logo
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=003a8c&color=fff&size=128&bold=true`;

const COMPANY_SIZE_LABEL: Record<string, string> = {
  STARTUP:    'Startup',
  SME:        'Vừa và nhỏ',
  ENTERPRISE: 'Tập đoàn lớn',
};

const companyTags = (c: ICompany): string[] => {
  const t: string[] = [];
  if (c.industry)    t.push(c.industry);
  if (c.companySize) t.push(COMPANY_SIZE_LABEL[c.companySize] ?? c.companySize);
  return t;
};

interface CompanyFeaturedProps {
  featuredList: ICompany[];
  slideIdx: number;
  setSlideIdx: (idx: number) => void;
  goSlide: (dir: 'prev' | 'next') => void;
  loading: boolean;
  onNavigate: (id: string) => void;
}

export default function CompanyFeatured({
  featuredList,
  slideIdx,
  setSlideIdx,
  goSlide,
  loading,
  onNavigate
}: CompanyFeaturedProps) {
  return (
    <section className="featured-section">
      <div className="featured-header">
        <h2 className="featured-title">Công ty Nổi bật</h2>
        <div className="carousel-nav-buttons">
          <button className="btn-nav" onClick={() => goSlide('prev')}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="btn-nav" onClick={() => goSlide('next')}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="slideshow-viewport">
        {loading && featuredList.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
        ) : featuredList.length === 0 ? (
          <Empty description="Chưa có dữ liệu" />
        ) : (
          <>
            <div
              className="slideshow-track"
              style={{ transform: `translateX(calc(-${slideIdx} * (280px + 24px)))` }}
            >
              {featuredList.map(c => (
                <div key={c.id} className="featured-card company-card-hover">
                  <div className="fc-logo-area">
                    <div className="fc-logo-bg" />
                    <img
                      src={logoSrc(c)}
                      alt={c.name}
                      className="fc-logo"
                      onError={e => { (e.target as HTMLImageElement).src = logoSrc({ ...c, logo: '' }) }}
                    />
                  </div>
                  <h3 className="fc-name">{c.name}</h3>
                  <div className="fc-tags">
                    {companyTags(c).map(t => <span key={t} className="fc-tag">{t}</span>)}
                    {companyTags(c).length === 0 && <span className="fc-tag">Công ty IT</span>}
                  </div>
                  <div className="fc-footer">
                    {c.isVerified ? (
                      <span className="fc-verified"><span className="fc-dot" />Đã xác minh</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#999' }}>Chờ xét duyệt</span>
                    )}
                    <button className="fc-jobs-btn" onClick={() => c.id && onNavigate(c.id)}>
                      Xem việc làm
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward_ios</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="slideshow-dots">
              {featuredList.map((_, i) => (
                <button
                  key={i}
                  className={`slideshow-dot${i === slideIdx ? ' active' : ''}`}
                  onClick={() => { setSlideIdx(i) }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
