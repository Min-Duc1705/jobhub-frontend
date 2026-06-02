import { useState } from 'react'
import { Button, Form, Input, Select } from 'antd'
import { message } from '../../../utils/antd'
import { submitContactFormApi } from '../../../services/contact-service'
import './ContactPage.scss'

const { TextArea } = Input

const INFO_CARDS = [
  { icon: 'location_on', title: 'Văn phòng Hà Nội', body: 'Tòa nhà TechCenter, 123 Phố Duy Tân, Cầu Giấy, Hà Nội' },
  { icon: 'location_city', title: 'Văn phòng TP. HCM', body: 'Lầu 15, Bitexco Financial Tower, Quận 1, TP. Hồ Chí Minh' },
  { icon: 'call', title: 'Điện thoại', body: 'Hotline: 1900 6789\nHỗ trợ: (024) 3765 4321' },
  { icon: 'mail', title: 'Email', body: 'support@jobhub.vn\npartnership@jobhub.vn' },
]

const SOCIAL_LINKS = [
  { icon: 'share', href: '#' },
  { icon: 'group', href: '#' },
  { icon: 'public', href: '#' },
  { icon: 'rss_feed', href: '#' },
]

const ContactPage = () => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const onFinish = async (values: any) => {
    setSubmitting(true)
    try {
      const res = await submitContactFormApi({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        topic: values.topic,
        message: values.message
      })
      if (res && res.data) {
        message.success('Gửi lời nhắn liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.')
        form.resetFields()
      } else {
        message.error('Không thể gửi lời nhắn. Vui lòng thử lại sau.')
      }
    } catch (err) {
      console.error('Contact submit error:', err)
      message.error('Đã xảy ra lỗi khi gửi lời nhắn. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="contact-page">

      {/* HERO */}
      <section className="contact-hero">
        <div className="contact-hero__bg">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWpaTFrYKcoOO2S7yrFakzXYPkGGixRrzcYCuJVPX_fVs22ay9cZ_q1-Gk5ecu2ZWeXm5w1I6WKA4QbGMqR1glYqkyYZjUgvSFF5w0YULOv8DHeLhdN1PJAdpYuD1VgkSilisXzDxXxFesBIVpwTHhbkCGHRwnpxY6Hy8s2HgAwn2xOYsRFxRfkSEgERm3pAVNr856BLvnH4HpCg6ucSPqNPSey9y8Aswh3-9YhiOAkbzJfyljdZNjWOoyaPGzbf-XC0hnuExN9-4"
            alt="Contact hero background"
          />
        </div>
        <div className="contact-hero__inner">
          <h1 className="contact-hero__title">Liên hệ với chúng tôi</h1>
          <p className="contact-hero__desc">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ hành trình sự nghiệp của bạn. Đừng ngần ngại kết nối với đội ngũ JobHub.
          </p>
        </div>
      </section>

      {/* BENTO GRID */}
      <div className="contact-grid">

        {/* Info Cards */}
        <div className="contact-info">
          {INFO_CARDS.map(card => (
            <div key={card.title} className="contact-info-card">
              <div className="contact-info-card__row">
                <div className="contact-info-card__icon">
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <div>
                  <h3 className="contact-info-card__title">{card.title}</h3>
                  <p className="contact-info-card__body" style={{ whiteSpace: 'pre-line' }}>{card.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="contact-form-card">
          <h2 className="contact-form-card__title">Gửi lời nhắn cho chúng tôi</h2>

          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input size="large" placeholder="Nguyễn Văn A" />
              </Form.Item>

              <Form.Item
                label="Email công việc"
                name="email"
                rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
              >
                <Input size="large" placeholder="email@company.com" />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <Form.Item label="Số điện thoại" name="phone">
                <Input size="large" placeholder="090 123 4567" />
              </Form.Item>

              <Form.Item label="Chủ đề" name="topic" initialValue="Hỗ trợ tìm việc">
                <Select size="large">
                  <Select.Option value="Hỗ trợ tìm việc">Hỗ trợ tìm việc</Select.Option>
                  <Select.Option value="Hợp tác doanh nghiệp">Hợp tác doanh nghiệp</Select.Option>
                  <Select.Option value="Góp ý dịch vụ">Góp ý dịch vụ</Select.Option>
                  <Select.Option value="Yêu cầu khác">Yêu cầu khác</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              label="Tin nhắn"
              name="message"
              rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
            >
              <TextArea rows={6} placeholder="Nhập nội dung tin nhắn của bạn..." />
            </Form.Item>

            <div className="contact-form-card__submit-row">
              <Button htmlType="submit" className="btn-submit" loading={submitting}>
                Gửi lời nhắn
              </Button>
            </div>
          </Form>
        </div>
      </div>

      {/* MAP */}
      <section className="contact-map">
        <div className="contact-map__wrap">
          <iframe
            title="JobHub Office - 175 Tây Sơn, Kim Liên, Hà Nội"
            src="https://maps.google.com/maps?q=175+T%C3%A2y+S%C6%A1n%2C+Kim+Li%C3%AAn%2C+%C4%90%E1%BB%91ng+%C4%90a%2C+H%C3%A0+N%E1%BB%99i&output=embed&z=16"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          />
          <div className="contact-map__overlay">
            <div className="contact-map__glass">
              <span className="material-symbols-outlined">location_on</span>
              <h4>175 Tây Sơn, Kim Liên</h4>
              <p>Đống Đa, Hà Nội</p>
              <a
                href="https://maps.google.com/maps?q=175+T%C3%A2y+S%C6%A1n%2C+Kim+Li%C3%AAn%2C+H%C3%A0+N%E1%BB%99i"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="contact-map__btn">Mở trong Google Maps</button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL */}
      <section className="contact-social">
        <div className="contact-social__inner">
          <h3 className="contact-social__title">Theo dõi chúng tôi</h3>
          <div className="contact-social__links">
            {SOCIAL_LINKS.map(s => (
              <a key={s.icon} href={s.href} className="contact-social__link">
                <span className="material-symbols-outlined">{s.icon}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

export default ContactPage
