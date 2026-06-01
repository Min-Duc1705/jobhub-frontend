import React from 'react';
import type { ICompany } from '../../../types/company';

const COMPANY_SIZE_LABEL: Record<string, string> = {
  STARTUP:    'Startup',
  SME:        'Vừa và nhỏ',
  ENTERPRISE: 'Tập đoàn lớn',
};

const stripHtml = (raw: string): string => {
  if (!raw) return '';
  return raw
    .replace(/&lt;/gi,   '<')
    .replace(/&gt;/gi,   '>')
    .replace(/&amp;/gi,  '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi,  "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g,     ' ')
    .trim();
};

const logoSrc = (c: ICompany) =>
  c.logo?.trim()
    ? c.logo
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=003a8c&color=fff&size=128&bold=true`;

interface CompanyCardProps {
  company: ICompany;
  onNavigate: (id: string) => void;
}

export default function CompanyCard({ company, onNavigate }: CompanyCardProps) {
  return (
    <div className="company-list-card company-card-hover">
      <div className="card-layout">
        <div className="logo-col">
          <img
            src={logoSrc(company)}
            alt={company.name}
            className="company-list-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).src = logoSrc({ ...company, logo: '' });
            }}
          />
        </div>
        <div className="details-col">
          <div className="header-row">
            <div>
              <h3 className="company-name">{company.name}</h3>
              <div className="meta-info-row">
                {company.industry && (
                  <span className="meta-item">
                    <span className="material-symbols-outlined item-icon">business</span>
                    {company.industry}
                  </span>
                )}
                {company.companySize && (
                  <span className="meta-item">
                    <span className="material-symbols-outlined item-icon">group</span>
                    {COMPANY_SIZE_LABEL[company.companySize] ?? company.companySize}
                  </span>
                )}
                {company.address && (
                  <span className="meta-item">
                    <span className="material-symbols-outlined item-icon">location_on</span>
                    {company.address}
                  </span>
                )}
              </div>
            </div>
            {company.isVerified && (
              <div className="rating-col">
                <span className="material-symbols-outlined" style={{ color: '#52c41a', fontSize: 20 }}>verified</span>
                <span className="reviews-count" style={{ color: '#52c41a', fontWeight: 600, fontSize: 12 }}>Đã xác minh</span>
              </div>
            )}
          </div>

          {company.description && (
            <p className="company-description">{stripHtml(company.description)}</p>
          )}

          <div className="tags-wrapper">
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="tech-tag">
                🌐 {company.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {company.contactEmail && <span className="tech-tag">✉ {company.contactEmail}</span>}
          </div>

          <div className="footer-row">
            <span className="jobs-available-text">{company.industry ?? 'Công ty công nghệ'}</span>
            <button className="btn-detail-link" onClick={() => company.id && onNavigate(company.id)}>
              Chi tiết công ty
              <span className="material-symbols-outlined arrow-icon">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
