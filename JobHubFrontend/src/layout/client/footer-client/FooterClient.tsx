import { useState } from 'react'
import { Button } from 'antd'
import { Link } from 'react-router-dom'
import './FooterClient.scss'

const ABOUT_LINKS = [
  { label: 'Giới thiệu', to: '#' },
  { label: 'Liên hệ',    to: '#' },
  { label: 'Tuyển dụng', to: '#' },
  { label: 'Blog',       to: '#' },
]

const CANDIDATE_LINKS = [
  { label: 'Tìm việc làm',        to: '/jobs' },
  { label: 'Công cụ AI',          to: '/salary-predict' },
  { label: 'Cẩm nang nghề nghiệp',to: '#' },
]

const EMPLOYER_LINKS = [
  { label: 'Đăng tin tuyển dụng', to: '/admin/jobs/create' },
  { label: 'Giải pháp ATS',       to: '/admin' },
  { label: 'Báo cáo thị trường',  to: '#' },
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
                  <a href={to} className="site-footer__col-link">{label}</a>
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
            <a href="#" className="site-footer__bottom-link">Privacy Policy</a>
            <a href="#" className="site-footer__bottom-link">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default FooterClient
