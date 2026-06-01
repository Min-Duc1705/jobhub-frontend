import { useState, useEffect, useRef } from 'react'
import { Form, Input, Button } from 'antd'
import { message } from '../../../utils/antd'
import { Link, useNavigate } from 'react-router-dom'
import { resendOtpApi, verifyOtpApi, resetPasswordApi } from '../../../services/auth-service'
import './ForgetPasswordPage.scss'

// ─── Step 1: Request OTP ──────────────────────────────────────────
interface EmailForm { email: string }

// ─── Step 2: Verify OTP ───────────────────────────────────────────
interface OtpForm { otpCode: string }

// ─── Step 3: Reset Password ───────────────────────────────────────
interface ResetForm {
  newPassword: string
  confirmPassword: string
}

type Step = 'email' | 'otp' | 'reset' | 'done'

type PasswordReq = { key: string; label: string; test: (v: string) => boolean }

const PASSWORD_REQS: PasswordReq[] = [
  { key: 'length', label: 'Tối thiểu 8 ký tự', test: (v) => v.length >= 8 },
  { key: 'number', label: 'Chứa ít nhất một chữ số', test: (v) => /\d/.test(v) },
  { key: 'symbol', label: 'Chứa ít nhất một ký tự đặc biệt (@, #, !)', test: (v) => /[!@#$%^&*]/.test(v) },
]

// Module-level cooldown guard (chống StrictMode double call)
const resendCooldownFor = new Set<string>()

const ForgetPasswordPage = () => {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('') // lưu OTP qua step 2 → 3
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [pwValue, setPwValue] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // ── Countdown timer after OTP sent ──────────────────────────────
  const startCountdown = (seconds = 60) => {
    setCountdown(seconds)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // ── Step 1: Gửi OTP đến email ───────────────────────────────────
  const onSubmitEmail = async (values: EmailForm) => {
    setIsLoading(true)
    try {
      await resendOtpApi(values.email, 'RESET_PASSWORD')
      setEmail(values.email)
      setStep('otp')
      startCountdown(60)
      message.success(`Đã gửi mã OTP đến ${values.email}`)
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Resend OTP ───────────────────────────────────────────────────
  const onResend = async () => {
    if (countdown > 0 || resendCooldownFor.has(email)) return
    resendCooldownFor.add(email)
    try {
      await resendOtpApi(email, 'RESET_PASSWORD')
      startCountdown(60)
      message.success('Đã gửi lại OTP!')
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Gửi lại OTP thất bại.')
    } finally {
      setTimeout(() => resendCooldownFor.delete(email), 61_000)
    }
  }

  // ── Step 2: Xác thực OTP ────────────────────────────────────────
  const onVerifyOtp = async (values: OtpForm) => {
    setIsLoading(true)
    try {
      await verifyOtpApi(email, values.otpCode, 'RESET_PASSWORD')
      setOtpCode(values.otpCode) // lưu lại dùng cho bước reset
      setStep('reset')
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 3: Đặt lại mật khẩu ────────────────────────────────────
  const onResetPassword = async (values: ResetForm) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!')
      return
    }
    setIsLoading(true)
    try {
      await resetPasswordApi(email, otpCode, values.newPassword)
      setStep('done')
      message.success('Mật khẩu đã được cập nhật thành công!')
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fp-page">
      {/* Background blobs */}
      <div className="fp-blob fp-blob--top" />
      <div className="fp-blob fp-blob--bottom" />

      <div className="fp-card">

        {/* ── STEP 1: Nhập email ──────────────────────────────────── */}
        {step === 'email' && (
          <>
            <div className="fp-icon-wrap">
              <span className="material-symbols-outlined fp-icon">lock_reset</span>
            </div>
            <h1 className="fp-title">Quên mật khẩu</h1>
            <p className="fp-subtitle">
              Nhập email của bạn để nhận mã OTP đặt lại mật khẩu.
            </p>

            <Form layout="vertical" onFinish={onSubmitEmail} requiredMark={false} className="fp-form">
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input
                  prefix={<span className="material-symbols-outlined field-icon">mail</span>}
                  placeholder="name@company.com"
                  size="large"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  htmlType="submit"
                  block size="large"
                  className="fp-btn-primary"
                  loading={isLoading}
                  icon={<span className="material-symbols-outlined">send</span>}
                >
                  Gửi mã OTP
                </Button>
              </Form.Item>
            </Form>

            <div className="fp-back-link">
              <Link to="/login">
                <span className="material-symbols-outlined">arrow_back</span>
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        )}

        {/* ── STEP 2: Nhập OTP ────────────────────────────────────── */}
        {step === 'otp' && (
          <>
            <div className="fp-icon-wrap fp-icon-wrap--success">
              <span className="material-symbols-outlined fp-icon">mark_email_read</span>
              <div className="fp-icon-ping" />
            </div>
            <h1 className="fp-title">Kiểm tra hộp thư!</h1>
            <p className="fp-subtitle">
              Chúng tôi đã gửi mã OTP đến{' '}
              <strong style={{ color: '#002660' }}>{email}</strong>.
              <br />Vui lòng kiểm tra cả thư mục Spam.
            </p>

            <Form layout="vertical" onFinish={onVerifyOtp} requiredMark={false} className="fp-form">
              <Form.Item
                name="otpCode"
                label="Mã OTP"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã OTP' },
                  { len: 6, message: 'Mã OTP phải có 6 ký tự' },
                ]}
              >
                <Input
                  prefix={<span className="material-symbols-outlined field-icon">key</span>}
                  placeholder="Nhập 6 số OTP"
                  size="large"
                  maxLength={6}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  htmlType="submit"
                  block size="large"
                  className="fp-btn-primary"
                  loading={isLoading}
                  icon={<span className="material-symbols-outlined">verified</span>}
                >
                  Xác nhận OTP
                </Button>
              </Form.Item>
            </Form>

            {/* Resend OTP */}
            <div className="fp-resend-box">
              <p className="fp-resend-label">Không nhận được mã?</p>
              <Button
                type="link"
                disabled={countdown > 0}
                onClick={onResend}
                className="fp-resend-btn"
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại OTP ngay'}
              </Button>
            </div>

            <div className="fp-back-link">
              <button onClick={() => setStep('email')}>
                <span className="material-symbols-outlined">arrow_back</span>
                Đổi email khác
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: Đặt lại mật khẩu ───────────────────────────── */}
        {step === 'reset' && (
          <>
            <div className="fp-icon-wrap">
              <span className="material-symbols-outlined fp-icon">lock_reset</span>
            </div>
            <h1 className="fp-title">Đặt lại mật khẩu</h1>
            <p className="fp-subtitle">Tạo mật khẩu mới cho tài khoản của bạn.</p>

            <Form
              layout="vertical"
              onFinish={onResetPassword}
              requiredMark={false}
              className="fp-form"
              onValuesChange={(_, all) => setPwValue(all.newPassword ?? '')}
            >
              <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 8, message: 'Tối thiểu 8 ký tự' },
                ]}
              >
                <Input.Password
                  prefix={<span className="material-symbols-outlined field-icon">lock</span>}
                  placeholder="Nhập mật khẩu mới"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }]}
              >
                <Input.Password
                  prefix={<span className="material-symbols-outlined field-icon">verified_user</span>}
                  placeholder="Nhập lại mật khẩu"
                  size="large"
                />
              </Form.Item>

              {/* Password strength checklist */}
              <div className="fp-pw-reqs">
                <p className="fp-pw-reqs-title">Yêu cầu bảo mật:</p>
                <ul>
                  {PASSWORD_REQS.map((req) => {
                    const ok = req.test(pwValue)
                    return (
                      <li key={req.key} className={ok ? 'req--met' : ''}>
                        <span className="material-symbols-outlined">
                          {ok ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        {req.label}
                      </li>
                    )
                  })}
                </ul>
              </div>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  htmlType="submit"
                  block size="large"
                  className="fp-btn-primary"
                  loading={isLoading}
                  icon={<span className="material-symbols-outlined">arrow_forward</span>}
                >
                  Cập nhật mật khẩu
                </Button>
              </Form.Item>
            </Form>

            <div className="fp-back-link">
              <Link to="/login">
                <span className="material-symbols-outlined">arrow_back</span>
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        )}

        {/* ── STEP 4: Thành công ──────────────────────────────────── */}
        {step === 'done' && (
          <div className="fp-done">
            <div className="fp-icon-wrap fp-icon-wrap--done">
              <span className="material-symbols-outlined fp-icon">check_circle</span>
            </div>
            <h1 className="fp-title">Thành công!</h1>
            <p className="fp-subtitle">
              Mật khẩu của bạn đã được cập nhật.<br />
              Hãy đăng nhập với mật khẩu mới.
            </p>
            <Button
              block size="large"
              className="fp-btn-primary"
              onClick={() => navigate('/login')}
              icon={<span className="material-symbols-outlined">login</span>}
              iconPosition="end"
            >
              Đăng nhập ngay
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}

export default ForgetPasswordPage
