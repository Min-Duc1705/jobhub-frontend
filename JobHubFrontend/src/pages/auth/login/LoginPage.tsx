import { Form, Input, Button, Checkbox, type FormProps } from 'antd'
import { message } from '../../../utils/antd'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../redux/hooks'
import { loginUser } from '../../../redux/slices/authSlice'
import './LoginPage.scss'

interface LoginFormValues {
  email: string
  password: string
  rememberMe: boolean
}

const LoginPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isLoading } = useAppSelector((state) => state.auth)

  const onFinish: FormProps<LoginFormValues>['onFinish'] = async (values) => {
    try {
      const resultAction = await dispatch(loginUser({ email: values.email, password: values.password }))
      if (loginUser.fulfilled.match(resultAction)) {
        message.success('Đăng nhập thành công!')
        const user = resultAction.payload.data.user
        const roleName = user.role?.name

        if (roleName === 'ADMIN') {
          navigate('/admin/dashboard')
        } else if (roleName === 'HR') {
          navigate('/hr/jobs')
        } else {
          navigate('/')
        }
      } else {
        const errorMsg = resultAction.payload as string || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'

        // Backend trả về "message|email" khi tài khoản chưa xác thực
        if (errorMsg.includes('|')) {
          const [msg, pendingEmail] = errorMsg.split('|')
          message.warning(msg)
          // Redirect sang RegisterPage với email và bật sẵn bước OTP
          navigate('/register', { state: { pendingEmail, showOtp: true } })
          return
        }

        message.error(errorMsg)
      }
    } catch (error: any) {
      message.error('Có lỗi xảy ra trong quá trình đăng nhập.')
    }
  }

  return (
    <div className="login-page">

      {/* ── Brand Header ── */}
      <div className="login-header">
        <div className="brand">
          <span className="material-symbols-outlined brand-icon">work</span>
          <span className="brand-name">JobHub</span>
        </div>
        <h2 className="welcome-text">Chào mừng trở lại</h2>
      </div>

      {/* ── Card ── */}
      <div className="login-card-wrapper">
        <div className="login-card">
          <Form
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="login-form"
          >
            {/* Email */}
            <Form.Item
              name="email"
              label="Địa chỉ Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input
                prefix={<span className="material-symbols-outlined field-icon">mail</span>}
                placeholder="ten@congty.com"
                autoComplete="email"
                size="large"
              />
            </Form.Item>

            {/* Password */}
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password
                prefix={<span className="material-symbols-outlined field-icon">lock</span>}
                placeholder="••••••••"
                autoComplete="current-password"
                size="large"
              />
            </Form.Item>

            {/* Remember me + Forgot password */}
            <div className="form-row">
              <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                <Checkbox className="remember-me-checkbox">Ghi nhớ đăng nhập</Checkbox>
              </Form.Item>
              <Link to="/forgot-password" className="forgot-password">Quên mật khẩu?</Link>
            </div>

            {/* Submit */}
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                htmlType="submit"
                block
                size="large"
                className="btn-login"
                loading={isLoading}
                icon={<span className="material-symbols-outlined btn-icon">login</span>}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          {/* Divider */}
          <div className="divider">
            <span>Hoặc tiếp tục với</span>
          </div>

          {/* Social login */}
          <div className="social-buttons">
            <Button
              block
              className="btn-social"
              onClick={() => console.log('Google login')}
              icon={<span className="google-g">G</span>}
            >
              Google
            </Button>
            <Button
              block
              className="btn-social"
              onClick={() => console.log('GitHub login')}
              icon={<span className="material-symbols-outlined social-icon">code</span>}
            >
              GitHub
            </Button>
          </div>

          {/* Register */}
          <p className="register-link">
            Chưa có tài khoản?{' '}
            <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </div>

    </div>
  )
}

export default LoginPage