import { useState } from 'react'
import { Button } from 'antd'
import { Link } from 'react-router-dom'
import './FooterClient.scss'

// ── Các link có thật trong hệ thống ─────────────────────────────────────────
const ABOUT_LINKS = [
  { label: 'Giới thiệu',   to: '/about' },
  { label: 'Liên hệ',      to: '/contact' },
  { label: 'Đăng ký công ty', to: '/company/register' },
  { label: 'Danh sách công ty', to: '/companies' },
]

const CANDIDATE_LINKS = [
  { label: 'Tìm việc làm',       to: '/jobs' },
  { label: 'Công ty',            to: '/companies' },
  { label: 'Dự đoán lương AI',   to: '/salary-predict' },
  { label: 'Quản lý CV',         to: '/candidate/resume' },
  { label: 'Việc đã ứng tuyển',  to: '/candidate/applied-jobs' },
]

const EMPLOYER_LINKS = [
  { label: 'Đăng tin tuyển dụng', to: '/hr/jobs' },
  { label: 'Quản lý ứng viên',    to: '/hr/jobs' },
  { label: 'Smart Hire Agent',    to: '/hr/hire-agent' },
  { label: 'Trang quản trị',      to: '/admin/dashboard' },
]

const SUPPORT_LINKS = [
  { label: 'Đăng nhập',      to: '/login' },
  { label: 'Đăng ký',       to: '/register' },
  { label: 'Quên mật khẩu', to: '/forgot-password' },
  { label: 'Chat hỗ trợ',   to: '/chat' },
]

const FooterClient = () => {
  const [email, setEmail] = useState('')

  const handleSubscribe = () => {
    // TODO: call subscribe API
    console.log('Subscribe:', email)
    setEmail('')
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__main">

        {/* ── Main Grid ── */}
        <div className="site-footer__grid">

          {/* Brand Column */}
          <div className="site-footer__brand">
            <Link to="/" className="site-footer__brand-name">JobHub</Link>
            <p className="site-footer__brand-desc">
              Nền tảng tuyển dụng IT thông minh hàng đầu Việt Nam, được hỗ trợ bởi công nghệ AI.
            </p>
            <div className="site-footer__socials">
              {/* TODO: Cung cấp link Facebook/LinkedIn/GitHub thật để thay thế '#' */}
              <a href="#" className="site-footer__social-btn" aria-label="Facebook">
                <span className="material-symbols-outlined">facebook</span>
              </a>
              <a href="#" className="site-footer__social-btn" aria-label="LinkedIn">
                <span className="material-symbols-outlined">link</span>
              </a>
              <a href="#" className="site-footer__social-btn" aria-label="GitHub">
                <span className="material-symbols-outlined">code</span>
              </a>
            </div>
          </div>

          {/* Về JobHub */}
          <div className="site-footer__col">
            <h4 className="site-footer__col-title">Về JobHub</h4>
            <ul className="site-footer__col-list">
              {ABOUT_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="site-footer__col-link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ứng viên */}
          <div className="site-footer__col">
            <h4 className="site-footer__col-title">Ứng viên</h4>
            <ul className="site-footer__col-list">
              {CANDIDATE_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="site-footer__col-link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Nhà tuyển dụng */}
          <div className="site-footer__col">
            <h4 className="site-footer__col-title">Nhà tuyển dụng</h4>
            <ul className="site-footer__col-list">
              {EMPLOYER_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="site-footer__col-link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div className="site-footer__col">
            <h4 className="site-footer__col-title">Hỗ trợ</h4>
            <ul className="site-footer__col-list">
              {SUPPORT_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="site-footer__col-link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Subscribe Block ── */}
        <div className="site-footer__subscribe-wrap">
          <div className="site-footer__subscribe-box">
            <div className="site-footer__subscribe-text">
              <h4>Đăng ký nhận thông báo việc làm</h4>
              <p>Đừng bỏ lỡ một cơ hội nghề nghiệp nào.</p>
            </div>
            <div className="site-footer__subscribe-form">
              <input
                type="email"
                className="site-footer__subscribe-input"
                placeholder="Email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
              />
              <Button className="btn-subscribe" onClick={handleSubscribe}>
                Đăng Ký
              </Button>
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="site-footer__bottom">
          <p className="site-footer__copyright">
            © {new Date().getFullYear()} JobHub. All rights reserved.
          </p>
          <div className="site-footer__bottom-links">
            <Link to="/about" className="site-footer__bottom-link">Về chúng tôi</Link>
            <Link to="/contact" className="site-footer__bottom-link">Liên hệ</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default FooterClient
