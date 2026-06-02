import React from 'react'

const JobHRInsights: React.FC = () => {
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
        <a className="insight-link" href="#">Chi tiết</a>
      </div>
      <div className="insight-card">
        <div className="insight-icon insight-icon--tertiary">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        <div>
          <p className="insight-label" style={{ color: '#380077' }}>SMART MATCH</p>
          <p className="insight-text">12 ứng viên tiềm năng chưa liên hệ.</p>
        </div>
        <a className="insight-link" href="#">Xem ngay</a>
      </div>
      <div className="insight-card insight-card--primary">
        <div className="insight-icon">
          <span className="material-symbols-outlined">trending_up</span>
        </div>
        <div>
          <p className="insight-label">HIỆU SUẤT</p>
          <p className="insight-text">Tỷ lệ lấp đầy đạt 85% (+12%)</p>
        </div>
      </div>
    </div>
  )
}

export default JobHRInsights
