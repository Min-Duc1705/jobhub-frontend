import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import './JobCandidateComponents.scss'

const AISalaryWidget = () => {
  const navigate = useNavigate()

  return (
    <div className="cjp-ai-salary-widget">
      <div className="cjp-ai-salary-widget-header">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
          auto_awesome
        </span>
        <h5>AI Salary Predictor</h5>
      </div>
      <p className="cjp-ai-salary-widget-desc">
        Dự đoán mức lương tương lai dựa trên hồ sơ, kỹ năng và số năm kinh nghiệm của bạn bằng mô hình AI tiên tiến của JobHub.
      </p>
      <Button 
        type="primary" 
        style={{
          background: 'linear-gradient(135deg, #005daa 0%, #380077 100%)',
          borderColor: 'transparent',
          borderRadius: 8,
          fontWeight: 700,
          width: '100%',
          height: 40,
        }}
        onClick={() => navigate('/salary-predict')}
        className="flex items-center justify-center border-none hover:opacity-95 transition-opacity"
      >
        Dùng thử ngay
      </Button>
    </div>
  )
}

export default AISalaryWidget
