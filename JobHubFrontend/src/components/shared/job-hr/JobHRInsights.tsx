import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { App } from 'antd'
import { getApplicationsApi } from '../../../services/application-service'

interface JobHRInsightsProps {
  smartMatchCount?: number | null
  skills?: string[]
}

const JobHRInsights: React.FC<JobHRInsightsProps> = ({ smartMatchCount }) => {
  const { message } = App.useApp()
  const displayCount = smartMatchCount !== undefined && smartMatchCount !== null ? smartMatchCount : 12
  const [conversionRate, setConversionRate] = useState<number | null>(null)

  const handleUnderDevelopment = (e: React.MouseEvent) => {
    e.preventDefault()
    message.info('Tính năng đang phát triển!')
  }

  useEffect(() => {
    Promise.all([
      getApplicationsApi('pageSize=1').catch(() => null),
      getApplicationsApi('status=APPROVED&pageSize=1').catch(() => null),
    ]).then(([appsRes, approvedAppsRes]) => {
      const totalApps = appsRes?.data?.meta?.total ?? 0
      const approvedApps = approvedAppsRes?.data?.meta?.total ?? 0
      const rate = totalApps > 0 
        ? Number(((approvedApps / totalApps) * 100).toFixed(1)) 
        : 3.2
      setConversionRate(rate)
    })
  }, [])

  return (
    <div className="hr-insight-grid">
      <div className="insight-card">
        <div className="insight-icon">
          <span className="material-symbols-outlined">psychology</span>
        </div>
        <div>
          <p className="insight-label">AI INSIGHT</p>
          <p className="insight-text">Lương DevOps tăng 12% theo thị trường.</p>
        </div>
        <a className="insight-link" href="#" onClick={handleUnderDevelopment}>Chi tiết</a>
      </div>
      <div className="insight-card">
        <div className="insight-icon insight-icon--tertiary">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        <div>
          <p className="insight-label" style={{ color: '#380077' }}>SMART MATCH</p>
          <p className="insight-text">{displayCount} ứng viên tiềm năng chưa liên hệ.</p>
        </div>
        <Link className="insight-link" to="/hr/hire-agent">Xem ngay</Link>
      </div>
      <div className="insight-card insight-card--primary">
        <div className="insight-icon">
          <span className="material-symbols-outlined">trending_up</span>
        </div>
        <div>
          <p className="insight-label">HIỆU SUẤT</p>
          <p className="insight-text">
            Tỷ lệ chuyển đổi đạt {conversionRate !== null ? `${conversionRate}%` : '85%'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default JobHRInsights
