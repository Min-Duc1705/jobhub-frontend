import React from 'react'
import { Modal } from 'antd'
import { RESUME_TEMPLATES, type ResumeTemplate } from '../../../types/resume-builder'
import './TemplateSelectorModal.scss'


interface Props {
  open:        boolean
  currentId?:  number
  onSelect:    (template: ResumeTemplate) => void
  onCancel:    () => void
}

// Inline SVG thumbnail previews
const ModernThumbnail = () => (
  <svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="260" fill="#faf9f9"/>
    {/* Avatar circle */}
    <circle cx="36" cy="44" r="24" fill="#003a8c"/>
    <text x="36" y="50" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">M</text>
    {/* Name & title */}
    <rect x="70" y="24" width="100" height="10" rx="3" fill="#002660"/>
    <rect x="70" y="40" width="70" height="7" rx="3" fill="#005daa" opacity="0.7"/>
    <rect x="70" y="54" width="90" height="5" rx="2" fill="#c3c6d3"/>
    <rect x="70" y="63" width="75" height="5" rx="2" fill="#c3c6d3"/>
    {/* Divider */}
    <rect x="12" y="82" width="176" height="1" fill="#c3c6d3"/>
    {/* Section title */}
    <rect x="12" y="92" width="80" height="7" rx="2" fill="#002660"/>
    {/* Timeline */}
    <rect x="12" y="108" width="2" height="60" fill="#e3e2e2"/>
    <circle cx="13" cy="110" r="5" fill="#002660"/>
    <rect x="24" y="106" width="80" height="6" rx="2" fill="#1b1c1c"/>
    <rect x="24" y="116" width="55" height="5" rx="2" fill="#005daa" opacity="0.7"/>
    <rect x="24" y="126" width="140" height="4" rx="2" fill="#c3c6d3"/>
    <rect x="24" y="133" width="120" height="4" rx="2" fill="#c3c6d3"/>
    <rect x="24" y="140" width="100" height="4" rx="2" fill="#c3c6d3"/>
    <circle cx="13" cy="158" r="5" fill="#c3c6d3"/>
    <rect x="24" y="154" width="70" height="6" rx="2" fill="#1b1c1c"/>
    <rect x="24" y="164" width="50" height="5" rx="2" fill="#005daa" opacity="0.7"/>
    {/* Divider */}
    <rect x="12" y="182" width="176" height="1" fill="#c3c6d3"/>
    {/* Skills */}
    <rect x="12" y="192" width="60" height="7" rx="2" fill="#002660"/>
    <rect x="12" y="206" width="50" height="14" rx="4" fill="#e9e8e8"/>
    <rect x="68" y="206" width="44" height="14" rx="4" fill="#e9e8e8"/>
    <rect x="118" y="206" width="56" height="14" rx="4" fill="#e9e8e8"/>
    {/* Project block */}
    <rect x="12" y="228" width="176" height="24" rx="6" fill="#003a8c"/>
    <rect x="20" y="233" width="80" height="6" rx="2" fill="#fff" opacity="0.9"/>
    <rect x="20" y="243" width="120" height="4" rx="2" fill="#fff" opacity="0.5"/>
  </svg>
)

const ClassicThumbnail = () => (
  <svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
    {/* Sidebar */}
    <rect width="68" height="260" fill="#1a1a2e"/>
    {/* Main area */}
    <rect x="68" y="0" width="132" height="260" fill="#faf9f9"/>
    {/* Avatar */}
    <circle cx="34" cy="36" r="20" fill="#3a3a6e"/>
    <text x="34" y="42" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">A</text>
    {/* Sidebar labels */}
    <rect x="8" y="64" width="52" height="4" rx="2" fill="#8888aa"/>
    <rect x="8" y="74" width="48" height="3" rx="1" fill="#c8c8e4" opacity="0.7"/>
    <rect x="8" y="81" width="44" height="3" rx="1" fill="#c8c8e4" opacity="0.7"/>
    <rect x="8" y="88" width="52" height="3" rx="1" fill="#c8c8e4" opacity="0.7"/>
    <rect x="8" y="104" width="52" height="4" rx="2" fill="#8888aa"/>
    <rect x="8" y="114" width="24" height="10" rx="3" fill="rgba(255,255,255,0.1)"/>
    <rect x="36" y="114" width="26" height="10" rx="3" fill="rgba(255,255,255,0.1)"/>
    <rect x="8" y="128" width="32" height="10" rx="3" fill="rgba(255,255,255,0.1)"/>
    <rect x="44" y="128" width="18" height="10" rx="3" fill="rgba(255,255,255,0.1)"/>
    {/* Main header */}
    <rect x="78" y="18" width="110" height="12" rx="3" fill="#1a1a2e"/>
    <rect x="78" y="36" width="75" height="7" rx="2" fill="#555577"/>
    <rect x="78" y="48" width="114" height="3" rx="1" fill="#c3c6d3"/>
    <rect x="78" y="55" width="100" height="3" rx="1" fill="#c3c6d3"/>
    <rect x="68" y="68" width="132" height="2" fill="#1a1a2e"/>
    {/* Section */}
    <rect x="78" y="78" width="5" height="14" rx="2" fill="#1a1a2e"/>
    <rect x="88" y="81" width="50" height="8" rx="2" fill="#1a1a2e"/>
    <rect x="78" y="100" width="85" height="6" rx="2" fill="#1a1a2e"/>
    <rect x="78" y="110" width="55" height="5" rx="2" fill="#555577"/>
    <rect x="78" y="120" width="114" height="4" rx="2" fill="#c3c6d3"/>
    <rect x="78" y="128" width="100" height="4" rx="2" fill="#c3c6d3"/>
    <rect x="78" y="148" width="85" height="6" rx="2" fill="#1a1a2e"/>
    <rect x="78" y="158" width="55" height="5" rx="2" fill="#555577"/>
    <rect x="78" y="168" width="114" height="4" rx="2" fill="#c3c6d3"/>
    <rect x="78" y="198" width="5" height="14" rx="2" fill="#1a1a2e"/>
    <rect x="88" y="201" width="50" height="8" rx="2" fill="#1a1a2e"/>
    <rect x="78" y="218" width="114" height="32" rx="4" fill="#f0f0f8" stroke="#e8e8f4" strokeWidth="1"/>
    <rect x="86" y="226" width="70" height="6" rx="2" fill="#1a1a2e"/>
    <rect x="86" y="236" width="100" height="4" rx="2" fill="#c3c6d3"/>
  </svg>
)

const THUMBNAILS: Record<number, () => React.ReactElement> = {
  1: ModernThumbnail,
  2: ClassicThumbnail,
}

export default function TemplateSelectorModal({ open, currentId, onSelect, onCancel }: Props) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={
        <span style={{ fontSize: 18, fontWeight: 700, color: '#002660' }}>
          <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 8 }}>
            style
          </span>
          Chọn mẫu CV
        </span>
      }
      width={700}
      className="template-selector-modal"
    >
      <p style={{ color: '#434651', marginBottom: 24, fontSize: 14 }}>
        Chọn mẫu CV phù hợp. Dữ liệu bạn đã nhập sẽ được giữ nguyên khi đổi mẫu.
      </p>

      <div className="tsm-grid">
        {RESUME_TEMPLATES.map(tpl => {
          const Thumb = THUMBNAILS[tpl.id]
          const isActive = currentId === tpl.id

          return (
            <div
              key={tpl.id}
              className={`tsm-card ${isActive ? 'tsm-card--active' : ''}`}
              onClick={() => onSelect(tpl)}
            >
              <div className="tsm-card__thumb">
                {Thumb && <Thumb />}
                {isActive && (
                  <div className="tsm-card__active-badge">
                    <span className="material-symbols-outlined">check_circle</span>
                    Đang dùng
                  </div>
                )}
                <div className="tsm-card__hover-overlay">
                  <button className="tsm-card__use-btn">
                    {isActive ? 'Đang sử dụng' : 'Dùng mẫu này'}
                  </button>
                </div>
              </div>
              <div className="tsm-card__info">
                <div className="tsm-card__name-row">
                  <span
                    className="tsm-card__dot"
                    style={{ background: tpl.colorAccent }}
                  />
                  <h4 className="tsm-card__name">{tpl.name}</h4>
                </div>
                <p className="tsm-card__desc">{tpl.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
