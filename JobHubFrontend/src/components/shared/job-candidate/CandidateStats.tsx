import { Card, Row, Col } from 'antd'
import './JobCandidateComponents.scss'

interface Props {
  appliedCount: number
  underReviewCount: number
  interviewCount: number
  savedCount: number
}

const CandidateStats = ({ appliedCount, underReviewCount, interviewCount, savedCount }: Props) => {
  return (
    <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
      
      {/* Card 1: Applied */}
      <Col xs={24} sm={12} lg={6}>
        <Card 
          variant="outlined" 
          style={{ borderRadius: 12, borderColor: '#c3c6d3' }}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, background: '#efeded', borderRadius: 8, color: '#002660' }}>
              <span className="material-symbols-outlined text-xl">send</span>
            </span>
            <span style={{ color: '#747783', fontSize: 12, fontWeight: 600 }}>Tất cả</span>
          </div>
          <div>
            <h3 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#1b1c1c', margin: 0 }}>{appliedCount}</h3>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#747783', margin: '4px 0 0 0' }}>Đã ứng tuyển</p>
          </div>
        </Card>
      </Col>

      {/* Card 2: Under Review */}
      <Col xs={24} sm={12} lg={6}>
        <Card 
          variant="outlined" 
          style={{ borderRadius: 12, borderColor: '#c3c6d3' }}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, background: '#d4e3ff', borderRadius: 8, color: '#005daa' }}>
              <span className="material-symbols-outlined text-xl">visibility</span>
            </span>
            <span style={{ color: '#747783', fontSize: 12, fontWeight: 600 }}>Đang xử lý</span>
          </div>
          <div>
            <h3 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#1b1c1c', margin: 0 }}>{underReviewCount}</h3>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#747783', margin: '4px 0 0 0' }}>Đang xét duyệt</p>
          </div>
        </Card>
      </Col>

      {/* Card 3: Interview Invitations */}
      <Col xs={24} sm={12} lg={6}>
        <Card 
          variant="outlined" 
          style={{ borderRadius: 12, borderColor: '#c3c6d3', borderLeft: '4px solid #005daa' }}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, background: '#ecdcff', borderRadius: 8, color: '#5400ad' }}>
              <span className="material-symbols-outlined text-xl">event</span>
            </span>
            <span style={{ color: '#005daa', fontSize: 12, fontWeight: 700 }}>Cần phỏng vấn</span>
          </div>
          <div>
            <h3 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#1b1c1c', margin: 0 }}>{interviewCount}</h3>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#747783', margin: '4px 0 0 0' }}>Lời mời phỏng vấn</p>
          </div>
        </Card>
      </Col>

      {/* Card 4: Saved Jobs */}
      <Col xs={24} sm={12} lg={6}>
        <Card 
          variant="outlined" 
          style={{ borderRadius: 12, borderColor: '#c3c6d3' }}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, background: '#e3e2e2', borderRadius: 8, color: '#434651' }}>
              <span className="material-symbols-outlined text-xl">bookmark</span>
            </span>
            <span style={{ color: '#747783', fontSize: 12, fontWeight: 600 }}>Tổng số</span>
          </div>
          <div>
            <h3 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#1b1c1c', margin: 0 }}>{savedCount}</h3>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#747783', margin: '4px 0 0 0' }}>Đã lưu</p>
          </div>
        </Card>
      </Col>

    </Row>
  )
}

export default CandidateStats
