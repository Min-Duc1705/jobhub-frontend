import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getVerifiedCompaniesApi } from '../../../services/company-service'
import type { ICompany } from '../../../types/company'
import './AboutPage.scss'

/* ── Data ─────────────────────────────────────────────────────── */
const STATS = [
  { icon: 'groups',        value: '500k+', label: 'Ứng viên tài năng',    desc: 'Phát triển qua mạng lưới cộng đồng dev',        hi: false },
  { icon: 'corporate_fare',value: '10k+',  label: 'Doanh nghiệp đối tác', desc: 'Từ Startup đến tập đoàn đa quốc gia',           hi: false },
  { icon: 'handshake',     value: '95%',   label: 'Tỷ lệ khớp lệnh',      desc: 'Nhờ thuật toán AI Matching thế hệ mới',         hi: false },
  { icon: 'smart_toy',     value: '24/7',  label: 'Hỗ trợ AI liên tục',   desc: 'Xử lý hồ sơ và tư vấn tự động',               hi: true  },
]

const STEPS = [
  { n:1, icon:'analytics',     title:'Job Analysis',   desc:'AI phân tích sâu yêu cầu công việc để xác định bộ kỹ năng cốt lõi.', connected:true  },
  { n:2, icon:'travel_explore',title:'AI Matching',    desc:'Tự động quét và xếp hạng hàng nghìn hồ sơ để tìm mảnh ghép phù hợp.', connected:true  },
  { n:3, icon:'task_alt',      title:'Assessment',     desc:'Đánh giá kỹ năng kỹ thuật và văn hóa qua các bài test AI cá nhân hóa.', connected:true  },
  { n:4, icon:'celebration',   title:'Final Placement',desc:'Kết nối trực tiếp và hỗ trợ onboard để đảm bảo sự gắn kết bền vững.', connected:false },
]

const PARTNERS = [
  { name:'FPT',       src:'https://lh3.googleusercontent.com/aida-public/AB6AXuC8pnh9CYvw7YFdnWUY_IB_5DheyEuFvkaoI28Yk6fqrsRVfbi9zJ-vzuH9oLeHThCBaALJSjFkYTWLGPDeKKq_2K79cjuYPyw6f_1g_bGbLz_MeG9G5McZx__d-0YqoW4hX5yRC6INilJhjTwwBFNn78c6eSNf0Le2GIQayvYrMfCzxXZ-usc-jZwkh_QBAuq8Spp0dDztkcbwUpF5ra-Vzvrer8VtYtz70s2_LhpWqBJYwo-fOQ-UgLz4ni7G1kRhozwEIwixWdY' },
  { name:'VNG',       src:'https://lh3.googleusercontent.com/aida-public/AB6AXuBJhYKfUkXiOcVVfumZ8pIOZNNJJ_-BdeT12TaVnHITfnGNIevy0uIwat7Zbu7nGlcP1Qi-QSeITiu8Q7xA_Ha-jhLWKhqMcHnd26BIBqsgzm4whNwawlBKX_AIz9YdIHNyt6PxTMiPPE7W2j_GMQ9FxVvq4aowOZyd8JAqJYnH5nsNdgn6EToHvok6ustRmhK6uo-9pWAQ67_I8Rd-wKzdmzWu-teCjuv1x9PeZBnUoN9RAQHivA_QO0LMf6SIKTPBDIrXrLnlCMk' },
  { name:'Viettel',   src:'https://lh3.googleusercontent.com/aida-public/AB6AXuDXbWvBLlkyq8FD8QuE3eaYmkC1t6WHnAhRzQhKhNylOo-Uoj9yFfNWXcOtihtiU0r1iEtuI0mRS6WuyOaCEW48FT7cpJD_-Wj-hSnzFlppEPqk2yqOOtIhxlVb7ShTh0aiOUAyh_ndnD_HoovcUPCck9qSYr9ZSWjZixOgbtHl9MXIzvsudXoEzEmXabUebAGScLu5LgmY8VoLtSIuS7OEv_hciiAWk07ZsREJqcrbXWZztVu24Rd9sjz92poXtRiQ6mQpzeKPdg0' },
  { name:'Shopee',    src:'https://lh3.googleusercontent.com/aida-public/AB6AXuAVN9ceNMjxlf8v2HKL5-b4MKXZvea8pEWsLHn53qAnCxaGfoZLrCw_RZlStKnIXaSFWDGIUCdT44cuA2OfynW3NDmUDz1j4hLOdPmvq4IQ3tU3EVYvAIva7b2jRjcpl8cTdjErC6OkcyoUb5BJ-ZXIF1UEm8TT0_s5Mw6OAcrzx6Hz_sTlobgEcLqunOk1ygOdoi73eYu4NL55nlhrfbSvQABVeHVSjo0oEi3A_e29ZpAf9VBowQhCHxn7wpKAoMYmWT-LWunhzBs' },
  { name:'Google',    src:'https://lh3.googleusercontent.com/aida-public/AB6AXuB6PM-ej65QBBBm1V8NTXaGhDISPGYRq3IsWKCipmyspJYgkdukcS-M1HYhXIx_vX-o2OFVHCGa7Gz4HmkljXLngihJET1G9zMhEk0-qBVyq74mufmkzObfW6hwD1UIfzKyWQgN3PscNNgwGVmDiQxohNtC-w2_W9tcngruG8zwlJ7ZZf5GQgDCt_dx7K9nAusfn2u3eUEr-zZecVy6jVIs20DkY8imlwMKhZn0F41U-Dm1IW4eBdtcHHRVX2JdQ4U0n9zaJwWkQUc' },
  { name:'Microsoft', src:'https://lh3.googleusercontent.com/aida-public/AB6AXuCClcFmDaysigIf7fOSjLaDaaYaALefGhqfczmIbFZTANKL6oupwHUmTCtcBT381V2pcsl1ymzC2uSHdyMvdo2ENsdvTllXugrUlPHirh8wP7lTkibGHCC5b1Lqj965PBUO4rGWyGqCsu-CW8l7IvTBdF8fFKNuC-5rzdKgmtsitN9konDbK26W1mf0SjGjsS4GIFs-LUNFNqgp9j52jXsWzMIduHDIQo7TjpkNfUq__t86U0OT4e548MPwzxkdT5hAmxNJmU8oEck' },
]

const TESTIMONIALS = [
  { name:'Trần Lê Huy',    role:'HR Director, FPT Software',       hi:false, text:'"JobHub đã thay đổi hoàn toàn cách chúng tôi tuyển dụng IT. Thuật toán AI lọc hồ sơ cực kỳ chính xác, giúp giảm 60% thời gian phỏng vấn không hiệu quả."' },
  { name:'Nguyễn Mai Anh', role:'CEO, TechHub Startup',            hi:false, text:'"Môi trường minh bạch và dữ liệu thực tế là điều tôi đánh giá cao nhất ở JobHub. Chúng tôi đã tìm được Senior Developer xuất sắc chỉ trong 2 tuần."' },
  { name:'Phạm Quốc Bảo',  role:'Talent Acquisition Lead, VNG',   hi:true,  text:'"Dịch vụ khách hàng và hỗ trợ AI 24/7 của JobHub giúp quy trình tuyển dụng không bao giờ bị gián đoạn, ngay cả trong mùa cao điểm."' },
]

const VALUES = [
  { icon:'lightbulb', title:'Sáng tạo (Innovation)',    hi:false, desc:'Không dừng lại ở giải pháp truyền thống. Chúng tôi áp dụng thuật toán AI tiên tiến để định hình lại tương lai tuyển dụng IT.' },
  { icon:'visibility', title:'Minh bạch (Transparency)',hi:true,  desc:'Dữ liệu thật, công việc thật. Mọi quy trình tại JobHub đều hướng tới sự rõ ràng tối đa cho cả ứng viên và nhà tuyển dụng.' },
  { icon:'hub',        title:'Kết nối (Connection)',     hi:false, desc:'Xây dựng hệ sinh thái nơi mọi tài năng có cơ hội tỏa sáng và doanh nghiệp tìm thấy những mảnh ghép nhân sự hoàn hảo.' },
]

const TEAM = [
  { name:'Nguyễn Minh Quân', role:'CEO & Co-Founder',       src:'https://lh3.googleusercontent.com/aida-public/AB6AXuBam0-TwSwPaG8DN2kDcmbGMyThR9-_J1XFVMGMsW0Mv0mz_GTg7PgsJwMOxppzM10kzAn_4PtsLlzJ1nMcbclh9MSqi3Td9MKhxsygmhAMJkKUtQTc7TMgye-mmcPF5pGHzJCQiu1pa5r9lidXokDCygcH0TfwUWvIA8ngTmxGLoH9_x8mx7I432LF6Tex6rcA6KfzaU5DN8qHKbTNFAHUxAOaj5mGqhggcnMGsaga2yptXMoyA22ajECXyh4gj7MkLBogz3mH2OM' },
  { name:'Lê Thu Thảo',       role:'CTO / AI Research Lead', src:'https://lh3.googleusercontent.com/aida-public/AB6AXuCta9DtUG8Ye3SDY0Y66b7jm-NjdO9LizWGim2ZDxSDEG5qgK7S-Ep6Ek5uLmFbsKJp0zoYZEGpo1L9cATo5itZo2n5kJzpHl_anT2bS59XaENxbZSZLcYa17hVmswtZxx9WfylLzg8FERVBpNRDZ_rarXYhzXoOr6A66mVvYABwdvPZZp7xAnHYwICNc60TncM24wf3JKII3O9H0RaUgRJMl2kASGxU40oh0R7oX2FocNsSi_VSnnfugXfhnTIZ9Ya8IalI4QstkQ' },
  { name:'Trần Hoàng Nam',    role:'Head of Product',         src:'https://lh3.googleusercontent.com/aida-public/AB6AXuBbMH8pYARplN7Ova-IU9FqFA3iAelDZ2nufrv-YVb3D_uStwgDIvSihMnalPY219fW6grM-I8gRTw2nk9lq1o-zJYmmOzM4xiMkJ6zwU96wdK1iEuT0uJYGG8XTBUmmhWwpeyt2kBCvZ8R6qi710wZ-T2VcXPFrc2KedkD-fX5NQr2WjO4NFkOk9A5kzkjPIeS7wsDWTGuiBPdNWis40l8015FxH7pyI_oGyai9eyWNLbq3KWP0s_wMXz4xOzCqCcFPRwjq_L314A' },
  { name:'Phạm Minh Anh',     role:'Head of Operations',      src:'https://lh3.googleusercontent.com/aida-public/AB6AXuDoiZ0a-feClzZ-dKMVKGkTtb4xKSD6S8LDZMRplMYHPm_6cb3R3NdifJ_p4xalZmmMgcvC-SHH6pe-_T-90X9XW0ygjVMCtB_tQYe0vUcbNrAFQWaNadKcqJJHp4jPcxAsNjumM75ElEqHXjDCd2FD79VX4ozQsgHNVDdFVUQB_Zi2njP5nMyhz-dsIYrWMDRVg3Foxv56FuOJaGoo57ZM4LqDouBwOOilaANsgWAfIKtWUW2A1lKXwo4xBiVgheA4HEiol_kmXxA' },
]

/* ── Component ────────────────────────────────────────────────── */
const AboutPage = () => {
  const [companies, setCompanies] = useState<ICompany[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getVerifiedCompaniesApi('pageNumber=1&pageSize=15')
      .then(res => {
        if (res.data?.result && res.data.result.length > 0) {
          setCompanies(res.data.result)
        } else {
          setCompanies(PARTNERS.map(p => ({ name: p.name, logo: p.src, isVerified: true })))
        }
      })
      .catch(() => {
        setCompanies(PARTNERS.map(p => ({ name: p.name, logo: p.src, isVerified: true })))
      })
      .finally(() => setLoading(false))
  }, [])

  // Ensure we have at least 8 items to scroll smoothly by duplicating the list if needed
  const getDisplayCompanies = () => {
    if (companies.length === 0) return []
    let list = [...companies]
    while (list.length < 8) {
      list = [...list, ...companies]
    }
    return list
  }

  return (
    <div className="about-page">

    {/* HERO */}
    <section className="about-hero">
      <div className="about-hero__bg" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBZFgG9UeRdfsVLaF9ES7viCMPzrx_XECIIkSRKnxA5kenevZupG7oapGNvGbKs4DWJKxHBwL960eWKZBwqCYnXR_jP9dWiiAyvJeHYQUV29_6SPa2gukrqTYm6CnR9zrq4p_E6_OyVQdUKkEmu8qUO_HOVMagZig7cPXQ4PF6Vw1c5iJWRbJFIc9O97xwkxIBYNjZAs7ibZ7OBTl_zBUqeGbdSiYW-Lmdblq2yLIhMzO-5VOkqovNX5SlAl9WHyxvMdAAr7O8PylE')" }} />
      <div className="about-hero__inner">
        <div>
          <div className="about-hero__badge">
            <span className="dot" /><span>Tiên phong AI Recruitment</span>
          </div>
          <h1 className="about-hero__title">
            Kết nối Tài năng IT với{' '}
            <span className="about-hero__gradient">Tương lai Công nghệ</span>
          </h1>
          <p className="about-hero__desc">
            JobHub kiến tạo hệ sinh thái tuyển dụng thông minh, nơi Trí tuệ Nhân tạo là cầu nối bền vững cho sự phát triển của cả doanh nghiệp và ứng viên.
          </p>
          <div className="about-hero__actions">
            <Link to="/jobs"><button className="about-hero__btn-primary">Tìm việc ngay</button></Link>
            <button className="about-hero__btn-outline">Hợp tác cùng JobHub</button>
          </div>
        </div>
        <div className="about-hero__img-wrap">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDK9JIVkJ40KlXqByP23vLnG8C5Y_rBT_3MGXacvpps9ph43Ca17gS_kZPOQnAcxSPa0-5GPzgQrYMTW-q9u_E2CqBe-3q2ZgHuTDNEzBZHYgyTf4lod83T2uWFv-ehFUTFRlK5EMTCWpCJZzyQE6QCvvAXFuIe4kIpobO3yVLpvjDh6mFiImqUaVZPyA-BWgZADP30R0x-aV65QgewgoPnLnZB4RBy-E2OeLzipjQSLtQzzToPab0YgVPEqTm84SxnNain4h68NI" alt="Futuristic digital network" />
        </div>
      </div>
    </section>

    {/* STORY */}
    <section className="about-story">
      <div className="about-story__inner">
        <div className="about-story__img-wrap">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3nDLWt5Lcrxat0E_KatAFr9nXfH0slr3Aj88RUr3npU5BpWz6HXZpF2RzMGjkyraqeWvXt_FAZPMa9hLyZIl0ywc383sJCqi9X2pr8ytg8aQ9vY7lKBeKTSGS-wzL4PQGgUTmUqwTrTB_OP7i5e1GPqC7plqyzskvX1vP-MUrg_-ihYbbX6JkEndcxwJ8iCiX7XscHFcTJuEfbB5IHK-d4zMKxxLSrAUqxQrGWMLTDgx6RwGOmBbxDVqmtV5DANV-zImoQAy3Xkc" alt="Team collaboration" />
        </div>
        <div>
          <span className="about-story__tag">Về chúng tôi</span>
          <h2 className="about-story__title">Câu chuyện của chúng tôi</h2>
          <p className="about-story__text">JobHub ra đời từ khát khao giải quyết bài toán nan giải của ngành nhân sự IT: Làm thế nào để lọc ra những tài năng thực thụ giữa hàng nghìn hồ sơ, và giúp ứng viên tìm thấy môi trường phát triển lý tưởng.</p>
          <p className="about-story__text">Chúng tôi bắt đầu với một nhóm kỹ sư đam mê AI, tin rằng công nghệ có thể mang lại sự minh bạch tuyệt đối. Bằng cách phân tích sâu kỹ năng và tiềm năng, JobHub không chỉ là cầu nối mà còn là người định hướng sự nghiệp vững chắc.</p>
          <div className="about-story__mission">
            <div className="about-story__mission-icon-wrap">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <div>
              <h3>Sứ mệnh của JobHub</h3>
              <p>Số hóa thị trường tuyển dụng IT, giúp mỗi developer tìm thấy 'mã nguồn' hạnh phúc và giá trị thực thụ của bản thân.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* STATS */}
    <section className="about-stats">
      <div className="about-stats__header">
        <h2>Thành tựu chuyên nghiệp</h2>
        <p>Những con số minh chứng cho hành trình nỗ lực không ngừng của đội ngũ JobHub trong việc tối ưu hóa quy trình tuyển dụng thông qua phân tích dữ liệu và AI.</p>
      </div>
      <div className="about-stats__grid">
        {STATS.map(s => (
          <div key={s.label} className={`about-stats__card${s.hi ? ' about-stats__card--highlight' : ''}`}>
            <div className="about-stats__card-icon"><span className="material-symbols-outlined">{s.icon}</span></div>
            <p className="about-stats__card-value">{s.value}</p>
            <p className="about-stats__card-label">{s.label}</p>
            <p className="about-stats__card-desc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* PROCESS */}
    <section className="about-process">
      <div className="about-process__header">
        <span className="section-tag">Quy trình thông minh</span>
        <h2>Tuyển dụng bằng sức mạnh AI</h2>
        <p>Chúng tôi tối ưu hóa mọi điểm chạm trong hành trình tuyển dụng để mang lại hiệu quả cao nhất.</p>
      </div>
      <div className="about-process__grid">
        {STEPS.map(s => (
          <div key={s.n} className="about-process__step">
            <div className={`about-process__icon${s.connected ? ' about-process__icon--connected' : ''}`}>
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <h4 className="about-process__title">{s.n}. {s.title}</h4>
            <p className="about-process__desc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* PARTNERS */}
    <section className="about-partners">
      <p className="about-partners__label">Được tin dùng bởi các tập đoàn công nghệ hàng đầu</p>
      <div className="about-partners__marquee-container">
        {loading ? (
          <div className="about-partners__loading">Đang tải...</div>
        ) : (
          <div className="about-partners__marquee-track">
            {/* First set of logos */}
            {getDisplayCompanies().map((c, idx) => (
              <Link key={`logo-1-${c.id || c.name}-${idx}`} to={c.id ? `/companies/${c.id}` : '#'} className="about-partners__card">
                {c.logo ? (
                  <img src={c.logo} alt={c.name} />
                ) : (
                  <span className="about-partners__logo-text">{c.name}</span>
                )}
              </Link>
            ))}
            {/* Second duplicated set of logos for infinite scroll effect */}
            {getDisplayCompanies().map((c, idx) => (
              <Link key={`logo-2-${c.id || c.name}-${idx}`} to={c.id ? `/companies/${c.id}` : '#'} className="about-partners__card" aria-hidden="true">
                {c.logo ? (
                  <img src={c.logo} alt={c.name} />
                ) : (
                  <span className="about-partners__logo-text">{c.name}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>

    {/* TESTIMONIALS */}
    <section className="about-testimonials">
      <div className="about-testimonials__header">
        <span className="section-tag">Đối tác nói gì</span>
        <h2>Cảm nhận từ khách hàng</h2>
      </div>
      <div className="about-testimonials__grid">
        {TESTIMONIALS.map(t => (
          <div key={t.name} className={`about-testimonials__card${t.hi ? ' about-testimonials__card--highlight' : ''}`}>
            <span className="about-testimonials__quote">"</span>
            <div className="about-testimonials__stars">
              {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined">star</span>)}
            </div>
            <p className="about-testimonials__text">{t.text}</p>
            <div className="about-testimonials__author">
              <div className="about-testimonials__avatar" />
              <div>
                <p className="about-testimonials__name">{t.name}</p>
                <p className="about-testimonials__role">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* VALUES */}
    <section className="about-values">
      <div className="about-values__header">
        <span className="section-tag">Giá trị nền tảng</span>
        <h2>Giá trị cốt lõi của chúng tôi</h2>
        <p>Những nguyên tắc kim chỉ nam giúp JobHub xây dựng niềm tin và thành công bền vững trong cộng đồng công nghệ Việt Nam.</p>
      </div>
      <div className="about-values__grid">
        {VALUES.map(v => (
          <div key={v.title} className={`about-values__card${v.hi ? ' about-values__card--highlight' : ''}`}>
            <div className="about-values__card-icon"><span className="material-symbols-outlined">{v.icon}</span></div>
            <h3>{v.title}</h3>
            <p>{v.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* TEAM */}
    <section className="about-team">
      <div className="about-team__header-row">
        <div>
          <span className="section-tag">Con người tại JobHub</span>
          <h2>Đội ngũ chuyên gia</h2>
          <p>Sự giao thoa giữa kinh nghiệm nhân sự lâu năm và tư duy kỹ thuật dữ liệu đột phá.</p>
        </div>
        <button className="about-team__join-btn">
          Gia nhập đội ngũ <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
      <div className="about-team__grid">
        {TEAM.map(m => (
          <div key={m.name} className="about-team__member">
            <div className="about-team__photo-wrap">
              <img src={m.src} alt={m.name} />
            </div>
            <h4 className="about-team__name">{m.name}</h4>
            <p className="about-team__role">{m.role}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="about-cta">
      <div className="about-cta__inner">
        <h2 className="about-cta__title">Sẵn sàng nâng tầm sự nghiệp?</h2>
        <p className="about-cta__desc">Khám phá hàng nghìn cơ hội việc làm IT hấp dẫn với lộ trình thăng tiến rõ ràng và hỗ trợ cá nhân hóa từ AI của chúng tôi.</p>
        <div className="about-cta__actions">
          <Link to="/jobs">
            <button className="about-cta__btn-primary">
              <span className="material-symbols-outlined">person_search</span>Tìm việc IT ngay
            </button>
          </Link>
          <button className="about-cta__btn-outline">
            <span className="material-symbols-outlined">corporate_fare</span>Đăng tin tuyển dụng
          </button>
        </div>
      </div>
    </section>

  </div>
  )
}

export default AboutPage
