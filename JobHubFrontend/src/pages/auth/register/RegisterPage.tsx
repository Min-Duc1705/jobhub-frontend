import { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, Select, type FormProps } from 'antd'
import { message } from '../../../utils/antd'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../redux/hooks'
import { registerUser } from '../../../redux/slices/authSlice'
import { verifyEmailApi, resendOtpApi } from '../../../services/auth-service'
import './RegisterPage.scss'

// ── Vietnam Province / Ward types ──────────────────────────────────
interface VietnamProvinceItem {
  id: string
  province: string
  wards: { name: string; mergedFrom: string[] }[]
}

type Role = 'candidate' | 'employer'
type PasswordStrength = '' | 'weak' | 'medium' | 'strong'

interface RegisterFormValues {
  fullName: string
  email: string
  password: string
  province?: string
  ward?: string
}

interface OtpFormValues {
  otpCode: string
}

const getStrength = (pwd: string): PasswordStrength => {
  if (!pwd) return ''
  const hasUpper = /[A-Z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  const hasSpecial = /[!@#$%^&*]/.test(pwd)
  const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length
  if (pwd.length >= 12 && score >= 2) return 'strong'
  if (pwd.length >= 8 && score >= 1) return 'medium'
  return 'weak'
}

const STRENGTH_LABEL: Record<string, string> = {
  weak: 'Yếu', medium: 'Trung bình', strong: 'Mạnh',
}

// Module-level flag: tồn tại ngoài component, không bị reset khi StrictMode remount
const sentOtpFor = new Set<string>()

const RegisterPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoading } = useAppSelector((state) => state.auth)

  // Nhận state từ LoginPage redirect (tài khoản chưa xác thực)
  const locationState = location.state as { pendingEmail?: string; showOtp?: boolean } | null

  const [role, setRole] = useState<Role>('candidate')
  const [strength, setStrength] = useState<PasswordStrength>('')
  const [showOtp, setShowOtp] = useState(locationState?.showOtp ?? false)
  const [registeredEmail, setRegisteredEmail] = useState(locationState?.pendingEmail ?? '')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // ── Province / Ward từ vietnamlabs.com API ─────────────────────
  const [allProvinceData, setAllProvinceData] = useState<VietnamProvinceItem[]>([])
  const [provinceOptions, setProvinceOptions] = useState<{ value: string; label: string }[]>([])
  const [wardOptions,     setWardOptions]     = useState<{ value: string; label: string }[]>([])
  const [loadingWards,    setLoadingWards]    = useState(false)
  const [form]                               = Form.useForm()

  // Ref để tránh double-fetch trong StrictMode
  const provinceFetched = useRef(false)

  useEffect(() => {
    if (provinceFetched.current) return
    provinceFetched.current = true
    const load = async () => {
      try {
        const res  = await fetch('https://vietnamlabs.com/api/vietnamprovince')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setAllProvinceData(json.data)
          setProvinceOptions(
            json.data.map((p: any) => ({ value: p.province, label: p.province }))
          )
        }
      } catch {
        console.warn('Vietnam Province API không khả dụng')
      }
    }
    load()
  }, [])

  const selectProvince = (provinceName: string | undefined) => {
    setWardOptions([])
    if (!provinceName) return
    setLoadingWards(true)
    const found = allProvinceData.find(p => p.province === provinceName)
    if (found) {
      setWardOptions(found.wards.map(w => ({ value: w.name, label: w.name })))
    }
    setLoadingWards(false)
  }

  // Tự động gửi lại OTP khi được redirect từ LoginPage (tài khoản Pending)
  // dùng Set ngoài component để chống gọi 2 lần do React StrictMode
  useEffect(() => {
    const email = locationState?.pendingEmail
    if (locationState?.showOtp && email && !sentOtpFor.has(email)) {
      sentOtpFor.add(email)
      resendOtpApi(email, 'REGISTER')
        .then(() => {
          message.info(`Đã gửi mã OTP mới đến ${email}. Vui lòng kiểm tra hộp thư.`)
        })
        .catch(() => {
          sentOtpFor.delete(email) // cho phép retry nếu lỗi
          message.warning('Không thể gửi OTP tự động. Vui lòng bấm "Gửi lại OTP".')
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onFinish: FormProps<RegisterFormValues>['onFinish'] = async (values) => {
    try {
      const payload = {
        email: values.email,
        username: values.fullName,
        password: values.password,
        role: role === 'candidate' ? 'CANDIDATE' : 'HR'
      }

      // Lưu address tạm vào sessionStorage để cập nhật sau khi login
      if (role === 'candidate' && (values.province || values.ward)) {
        const parts = [values.ward, values.province].filter(Boolean)
        sessionStorage.setItem('pendingAddress', parts.join(', '))
      }

      const resultAction = await dispatch(registerUser(payload))
      if (registerUser.fulfilled.match(resultAction)) {
        message.success('Đăng ký thành công! Vui lòng nhập mã OTP để kích hoạt tài khoản.')
        setRegisteredEmail(values.email)
        setShowOtp(true)
      } else {
        const errorMsg = resultAction.payload as string || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'
        message.error(errorMsg)
      }
    } catch (error) {
      message.error('Có lỗi xảy ra trong quá trình đăng ký.')
    }
  }

  const onVerifyOtp = async (values: OtpFormValues) => {
    setIsVerifying(true)
    try {
      const response = await verifyEmailApi({
        email: registeredEmail,
        otpCode: values.otpCode
      })
      if (response && response.statusCode === 200) {
        message.success(response.message || 'Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay.')
        navigate('/login')
      } else {
        message.error(response.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Xác thực OTP thất bại. Vui lòng thử lại.'
      message.error(errorMsg)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="register-page">

      {/* ══ Left Panel (hidden on mobile) ══════════════════════════ */}
      <div className="register-left">
        <div className="reg-left-bg" />
        <div className="reg-left-overlay" />
        <div className="reg-left-content">

          {/* Brand */}
          <a href="#" className="reg-brand">
            <span className="material-symbols-outlined">work</span>
            JobHub
          </a>

          {/* Value Card */}
          <div className="reg-value-card">
            <h1 className="reg-value-title">
              Tham gia mạng lưới chuyên gia IT hàng đầu.
            </h1>
            <p className="reg-value-desc">
              Kết nối với hàng ngàn công ty công nghệ, sử dụng các công cụ phân tích
              AI tiên tiến và khám phá cơ hội nghề nghiệp lý tưởng của bạn ngay hôm nay.
            </p>

            {/* Trust Indicators */}
            <div className="reg-trust">
              <div className="reg-avatars">
                <div className="reg-avatar">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="reg-avatar">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="reg-avatar reg-avatar--count">+5k</div>
              </div>
              <span className="reg-trust-text">Chuyên gia đã gia nhập</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Right Panel (Form) ═════════════════════════════════════ */}
      <div className="register-right">
        <div className="register-form-wrap">

          {/* Mobile logo */}
          <div className="reg-mobile-logo">
            <span className="material-symbols-outlined">work</span>
            JobHub
          </div>

          {showOtp ? (
            <>
              <div className="reg-form-header">
                <h2>Xác thực tài khoản</h2>
                <p>Chúng tôi đã gửi mã OTP xác nhận đến email: <strong style={{ color: '#1677ff' }}>{registeredEmail}</strong>.</p>
              </div>

              <Form
                layout="vertical"
                onFinish={onVerifyOtp}
                requiredMark={false}
                className="reg-form"
              >
                {/* OTP Code */}
                <Form.Item
                  name="otpCode"
                  label="Mã OTP"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mã OTP' },
                    { len: 6, message: 'Mã OTP phải có 6 ký tự' }
                  ]}
                >
                  <Input
                    placeholder="Nhập 6 số OTP"
                    size="large"
                    prefix={<span className="material-symbols-outlined field-icon">key</span>}
                  />
                </Form.Item>

                {/* Submit OTP */}
                <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
                  <Button
                    htmlType="submit"
                    block
                    size="large"
                    className="btn-register"
                    loading={isVerifying}
                    icon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>}
                  >
                    Xác nhận OTP
                  </Button>
                </Form.Item>

                <Button
                  type="link"
                  block
                  loading={isResending}
                  onClick={async () => {
                    if (!registeredEmail) return
                    setIsResending(true)
                    try {
                      await resendOtpApi(registeredEmail, 'REGISTER')
                      message.success(`Đã gửi lại OTP đến ${registeredEmail}.`)
                    } catch {
                      message.error('Gửi lại OTP thất bại. Vui lòng thử lại sau.')
                    } finally {
                      setIsResending(false)
                    }
                  }}
                  style={{ marginTop: 4, color: '#1677ff' }}
                >
                  Không nhận được mã? Gửi lại OTP
                </Button>

                <Button
                  type="link"
                  block
                  onClick={() => setShowOtp(false)}
                  style={{ marginTop: 4, color: '#666' }}
                >
                  Quay lại trang Đăng ký
                </Button>
              </Form>
            </>
          ) : (
            <>
              <div className="reg-form-header">
                <h2>Tạo tài khoản</h2>
                <p>Bắt đầu hành trình phát triển sự nghiệp của bạn.</p>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
                className="reg-form"
              >
                {/* ── Role Selection ── */}
                <div className="role-selection">
                  <span className="role-label">Bạn là:</span>
                  <div className="role-cards">

                    <label className={`role-card ${role === 'candidate' ? 'role-card--active' : ''}`}>
                      <input
                        type="radio" name="role" value="candidate"
                        className="sr-only"
                        checked={role === 'candidate'}
                        onChange={() => setRole('candidate')}
                      />
                      {role === 'candidate' && (
                        <span className="material-symbols-outlined role-check">check_circle</span>
                      )}
                      <span className="material-symbols-outlined role-icon">person_search</span>
                      <span className="role-name">Ứng viên</span>
                    </label>

                    <label className={`role-card ${role === 'employer' ? 'role-card--active' : ''}`}>
                      <input
                        type="radio" name="role" value="employer"
                        className="sr-only"
                        checked={role === 'employer'}
                        onChange={() => setRole('employer')}
                      />
                      {role === 'employer' && (
                        <span className="material-symbols-outlined role-check">check_circle</span>
                      )}
                      <span className="material-symbols-outlined role-icon">domain</span>
                      <span className="role-name">Nhà tuyển dụng</span>
                    </label>

                  </div>
                </div>

                {/* ── Full Name ── */}
                <Form.Item
                  name="fullName"
                  label="Họ và tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                  <Input placeholder="Ví dụ: Nguyễn Văn A" size="large" />
                </Form.Item>

                {/* ── Email ── */}
                <Form.Item
                  name="email"
                  label="Địa chỉ Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' },
                  ]}
                >
                  <Input placeholder="nam.nguyen@example.com" size="large" />
                </Form.Item>

                {/* ── Password ── */}
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                  ]}
                >
                  <Input.Password
                    placeholder="Tạo mật khẩu mạnh"
                    size="large"
                    onChange={(e) => setStrength(getStrength(e.target.value))}
                  />
                </Form.Item>

                {/* ── Strength Meter ── */}
                {strength && (
                  <div className="strength-meter">
                    <div className="strength-bars">
                      <div className="strength-bar active" data-level="weak" />
                      <div className={`strength-bar ${strength === 'medium' || strength === 'strong' ? 'active' : ''}`} data-level="medium" />
                      <div className={`strength-bar ${strength === 'strong' ? 'active' : ''}`} data-level="strong" />
                    </div>
                    <p className="strength-text">
                      Độ mạnh mật khẩu:{' '}
                      <span className={`strength-label strength-label--${strength}`}>
                        {STRENGTH_LABEL[strength]}
                      </span>
                    </p>
                  </div>
                )}

                {/* ── Province + Ward (chỉ candidate) ── */}
                {role === 'candidate' && (
                  <>
                    <Form.Item
                      name="province"
                      label="Tỉnh / Thành phố"
                      rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Chọn tỉnh / thành phố"
                        size="large"
                        allowClear
                        filterOption={(input, opt) =>
                          String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={provinceOptions}
                        onChange={(val) => {
                          form.setFieldValue('ward', undefined)
                          selectProvince(val)
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="ward"
                      label="Xã / Phường / Thị trấn"
                      rules={[{ required: true, message: 'Vui lòng chọn xã/phường' }]}
                    >
                      <Select
                        showSearch
                        placeholder={loadingWards ? 'Đang tải...' : 'Chọn xã / phường / thị trấn'}
                        size="large"
                        allowClear
                        loading={loadingWards}
                        disabled={wardOptions.length === 0 && !loadingWards}
                        filterOption={(input, opt) =>
                          String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={wardOptions}
                        notFoundContent={loadingWards ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu'}
                      />
                    </Form.Item>
                  </>
                )}

                {/* ── Submit ── */}
                <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
                  <Button
                    htmlType="submit"
                    block
                    size="large"
                    className="btn-register"
                    loading={isLoading}
                    icon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>}
                  >
                    Tạo tài khoản
                  </Button>
                </Form.Item>
              </Form>

              {/* ── Footer Links ── */}
              <p className="reg-login-link">
                Đã có tài khoản?{' '}
                <Link to="/login">Đăng nhập</Link>
              </p>

              <p className="reg-terms">
                Bằng việc đăng ký, bạn đồng ý với{' '}
                <a href="#">Điều khoản dịch vụ</a> và{' '}
                <a href="#">Chính sách bảo mật</a> của chúng tôi.
              </p>
            </>
          )}

        </div>
      </div>

    </div>
  )
}

export default RegisterPage