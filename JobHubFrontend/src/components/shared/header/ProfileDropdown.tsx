import { useNavigate } from 'react-router-dom'
import './ProfileDropdown.scss'

interface Props {
  user: any
  isHR?: boolean
  isCandidate?: boolean
  jobsOpen: boolean
  setJobsOpen: React.Dispatch<React.SetStateAction<boolean>>
  onLogout: () => void
  onClose: () => void
}

const ProfileDropdown = ({
  user,
  isHR: propIsHR,
  isCandidate: propIsCandidate,
  jobsOpen,
  setJobsOpen,
  onLogout,
  onClose
}: Props) => {
  const navigate = useNavigate()
  const isAdmin = user?.role?.name?.toUpperCase() === 'ADMIN'
  const isHR = propIsHR !== undefined ? propIsHR : user?.role?.name?.toUpperCase() === 'HR'
  const isCandidate = propIsCandidate !== undefined ? propIsCandidate : (user?.role?.name?.toUpperCase() === 'CANDIDATE' || (!isHR && !isAdmin && !!user))

  return (
    <div className="ant-dropdown-menu" style={{ margin: 0 }}>
      {/* User info header */}
      <div className="ant-dropdown-menu-item ant-dropdown-menu-item-disabled" style={{ cursor: 'default' }}>
        <div className="nav-dropdown-info">
          <span className="nav-dropdown-name">{user?.username || 'Administrator'}</span>
          <span className="nav-dropdown-email">{user?.email}</span>
        </div>
      </div>
      
      <div className="nav-dropdown-divider" />

      {/* ADMIN specific items */}
      {isAdmin && (
        <>
          <div
            className="ant-dropdown-menu-item"
            onClick={() => {
              navigate('/admin/dashboard')
              onClose()
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span className="material-symbols-outlined nav-menu-icon">dashboard</span>
            <span>Trang quản trị</span>
          </div>
          
          <div className="nav-dropdown-divider" />
        </>
      )}
      
      {/* HR: visible to HR OR Admin */}
      {(isHR || isAdmin) && (
        <>
          <div
            className="ant-dropdown-menu-item"
            onClick={() => {
              navigate('/hr/jobs')
              onClose()
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span className="material-symbols-outlined nav-menu-icon">work</span>
            <span>Quản lý Jobs (HR)</span>
          </div>
          <div
            className="ant-dropdown-menu-item"
            onClick={() => {
              navigate('/hr/hire-agent')
              onClose()
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span className="material-symbols-outlined nav-menu-icon">smart_toy</span>
            <span>AI Recruiter (Agent)</span>
          </div>
          <div
            className="ant-dropdown-menu-item"
            onClick={() => {
              navigate('/hr/interview-scheduler')
              onClose()
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span className="material-symbols-outlined nav-menu-icon">calendar_month</span>
            <span>Quản lý lịch phỏng vấn</span>
          </div>
          <div className="nav-dropdown-divider" />
        </>
      )}

      {/* Candidate: Toggle + sub-items (visible to Candidate OR Admin) */}
      {(isCandidate || isAdmin) && (
        <>
          <div
            className="ant-dropdown-menu-item"
            onClick={(e) => {
              e.stopPropagation() // Prevent closing dropdown
              setJobsOpen(v => !v)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined nav-menu-icon">work_history</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
              <span>Quản lý Jobs (Ứng viên)</span>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 18,
                  transition: 'transform .2s',
                  transform: jobsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                expand_more
              </span>
            </div>
          </div>

          {/* Sub-items */}
          {jobsOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 0' }}>
              <div
                className="ant-dropdown-menu-item"
                onClick={() => {
                  navigate('/candidate/applied-jobs')
                  onClose()
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 36 }}
              >
                <span className="material-symbols-outlined nav-menu-icon" style={{ fontSize: 16 }}>send</span>
                <span style={{ fontSize: 13 }}>Jobs đã ứng tuyển</span>
              </div>
              <div
                className="ant-dropdown-menu-item"
                onClick={() => {
                  navigate('/candidate/saved-jobs')
                  onClose()
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 36 }}
              >
                <span className="material-symbols-outlined nav-menu-icon" style={{ fontSize: 16 }}>bookmark</span>
                <span style={{ fontSize: 13 }}>Jobs đã lưu</span>
              </div>
            </div>
          )}
          
          <div className="nav-dropdown-divider" />
        </>
      )}

      {/* Common Candidate/HR/Admin items */}
      <div
        className="ant-dropdown-menu-item"
        onClick={() => {
          navigate('/candidate/profile')
          onClose()
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <span className="material-symbols-outlined nav-menu-icon">person</span>
        <span>Trang cá nhân</span>
      </div>

      {(isCandidate || isAdmin) && (
        <div
          className="ant-dropdown-menu-item"
          onClick={() => {
            navigate('/candidate/resume')
            onClose()
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span className="material-symbols-outlined nav-menu-icon">description</span>
          <span>Quản lý CV</span>
        </div>
      )}

      <div
        className="ant-dropdown-menu-item"
        onClick={() => {
          navigate('/candidate')
          onClose()
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <span className="material-symbols-outlined nav-menu-icon">settings</span>
        <span>Cài đặt tài khoản</span>
      </div>

      <div className="nav-dropdown-divider" />

      <div
        className="ant-dropdown-menu-item"
        onClick={() => {
          onLogout()
          onClose()
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <span className="material-symbols-outlined nav-menu-icon nav-menu-icon--danger">logout</span>
        <span className="nav-menu-danger">Đăng xuất</span>
      </div>
    </div>
  )
}

export default ProfileDropdown
