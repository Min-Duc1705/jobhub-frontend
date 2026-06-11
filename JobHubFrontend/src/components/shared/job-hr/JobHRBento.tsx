import React from 'react'
import { useNavigate } from 'react-router-dom'

interface JobHRBentoProps {
  smartMatchCount?: number | null
}

const JobHRBento: React.FC<JobHRBentoProps> = ({ smartMatchCount }) => {
  const navigate = useNavigate()
  const displayCount = smartMatchCount !== undefined && smartMatchCount !== null ? smartMatchCount : 12

  return (
    <div className="hr-bento">
      <div className="bento-main">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h4 className="bento-main-title">🤖 AI Smart Match</h4>
          <p className="bento-main-desc">
            Công nghệ AI phát hiện {displayCount} ứng viên tiềm năng cao cho các vị trí đang tuyển của bạn chưa được liên hệ.
          </p>
        </div>
        <div className="bento-actions" style={{ position: 'relative', zIndex: 1 }}>
          <button 
            className="btn-bento-primary"
            onClick={() => navigate('/hr/hire-agent')}
          >
            Gửi lời mời hàng loạt
          </button>
          <button 
            className="btn-bento-secondary"
            onClick={() => navigate('/hr/hire-agent')}
          >
            Xem danh sách
          </button>
        </div>
        <div className="bento-bg-icon">
          <span className="material-symbols-outlined">psychology</span>
        </div>
      </div>
      <div className="bento-side">
        <div className="bento-side-header">
          <span className="material-symbols-outlined">analytics</span>
          <p>Phân tích tuyển dụng</p>
        </div>
        <p className="bento-side-desc">
          Thời gian trung bình để tuyển được một vị trí là <strong>14 ngày</strong>,
          nhanh hơn 3 ngày so với quý trước.
        </p>
        <button 
          className="btn-bento-link"
          onClick={() => navigate('/admin/dashboard')}
        >
          Xem báo cáo đầy đủ
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

export default JobHRBento
