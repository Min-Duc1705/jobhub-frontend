import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from 'antd'
import type { IJob } from '../../../types/job'
import { LEVEL_COLOR, TYPE_COLOR, formatSalary } from './jobDetailHelpers'
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from '../../../types/job'
import './SimilarJobsWidget.scss'

interface SimilarJobsWidgetProps {
  similar: IJob[]
  companyName: string
}

const logoSrc = (companyName: string, logoUrl?: string) =>
  logoUrl?.trim()
    ? logoUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=003a8c&color=fff&size=128&bold=true`

export default function SimilarJobsWidget({ similar, companyName }: SimilarJobsWidgetProps) {
  const navigate = useNavigate()

  if (!similar || similar.length === 0) return null

  return (
    <div className="jd-similar-widget">
      <div className="jd-similar-title">Công việc tương tự</div>
      <div className="jd-similar-list">
        {similar.map(s => {
          const compName = s.companyName ?? companyName
          return (
            <div
              key={s.id}
              className="jd-similar-card-item"
              onClick={() => navigate(`/jobs/${s.id}`)}
            >
              <div className="jd-similar-card-logo-wrapper">
                <img
                  src={logoSrc(compName, s.companyLogo)}
                  alt={compName}
                  className="jd-similar-card-logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = logoSrc(compName)
                  }}
                />
              </div>
              <div className="jd-similar-card-info">
                <h4 className="jd-similar-card-jobname" title={s.name}>{s.name}</h4>
                <p className="jd-similar-card-company" title={compName}>{compName}</p>
                
                <div className="jd-similar-card-tags">
                  {s.jobType && (
                    <Tag color={TYPE_COLOR[s.jobType] ?? 'default'} style={{ fontSize: 10, margin: 0, fontWeight: 600, border: 'none' }}>
                      {JOB_TYPE_LABEL[s.jobType] ?? s.jobType}
                    </Tag>
                  )}
                  {s.level && (
                    <Tag color={LEVEL_COLOR[s.level] ?? 'default'} style={{ fontSize: 10, margin: 0, fontWeight: 600, border: 'none' }}>
                      {JOB_LEVEL_LABEL[s.level] ?? s.level}
                    </Tag>
                  )}
                  {s.location && (
                    <Tag
                      color="default"
                      style={{
                        fontSize: 10,
                        margin: 0,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                        border: 'none',
                        background: '#f5f5f5',
                        color: '#595959'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>location_on</span>
                      {s.location.split(',').pop()?.trim()}
                    </Tag>
                  )}
                </div>

                <div className="jd-similar-card-footer">
                  <span className="salary-text">{formatSalary(s)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
