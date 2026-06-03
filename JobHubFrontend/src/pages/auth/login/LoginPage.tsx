import { useEffect, useRef } from 'react'
import { Form, Input, Button, Checkbox, type FormProps } from 'antd'
import { GithubOutlined } from '@ant-design/icons'
import { message } from '../../../utils/antd'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../redux/hooks'
import { loginUser, setToken, fetchAccount, setAvatarUrl } from '../../../redux/slices/authSlice'
import { loginGoogleApi, loginGithubApi } from '../../../services/auth-service'
import { getMyProfileApi } from '../../../services/profile-service'
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

  const tokenClientRef = useRef<any>(null)

  useEffect(() => {
    // Khởi tạo Google SDK Token Client
    if ((window as any).google) {
      tokenClientRef.current = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: '663871681376-9mr0gtu5buntdpuoi89b5v25vjfed713.apps.googleusercontent.com',
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            await handleGoogleLoginSuccess(tokenResponse.access_token)
          }
        },
      })
    }

    // Lắng nghe mã callback 'code' từ URL của GitHub trả về
    const urlParams = new URLSearchParams(window.location.search)
    const githubCode = urlParams.get('code')
    if (githubCode) {
      // Xóa code trên URL để tránh lặp lại
      window.history.replaceState({}, document.title, window.location.pathname)
      handleGithubLoginSuccess(githubCode)
    }
  }, [])

  const fetchProfileAndRedirect = async (user: any) => {
    try {
      const res = await getMyProfileApi()
      if (res && res.data && res.data.avatar) {
        dispatch(setAvatarUrl(res.data.avatar))
      }
    } catch (e) {
      console.error('Không thể tải profile:', e)
    }

    const roleName = user.role?.name
    if (roleName === 'ADMIN') {
      navigate('/admin/dashboard')
    } else if (roleName === 'HR') {
      navigate('/hr/jobs')
    } else {
      navigate('/')
    }
  }

  const handleGithubLoginSuccess = async (code: string) => {
    const hide = message.loading('Đang xác thực tài khoản GitHub...', 0)
    try {
      const res = await loginGithubApi(code)
      if (res && res.data && res.data.accessToken) {
        dispatch(setToken(res.data.accessToken))
        const accountRes = await dispatch(fetchAccount())
        if (fetchAccount.fulfilled.match(accountRes)) {
          message.success('Đăng nhập bằng GitHub thành công!')
          const user = accountRes.payload.data.user
          await fetchProfileAndRedirect(user)
        }
      }
    } catch (err: any) {
      console.error(err)
      message.error(err.response?.data?.message || 'Đăng nhập bằng GitHub thất bại.')
    } finally {
      hide()
    }
  }

  const handleGithubClick = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23li8TnAl0MrMbgsiI'
    const redirectUri = `${window.location.origin}/login`
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`
  }

  const handleGoogleLoginSuccess = async (accessToken: string) => {
    const hide = message.loading('Đang xác thực tài khoản Google...', 0)
    try {
      const res = await loginGoogleApi(accessToken)
      if (res && res.data && res.data.accessToken) {
        dispatch(setToken(res.data.accessToken))
        const accountRes = await dispatch(fetchAccount())
        if (fetchAccount.fulfilled.match(accountRes)) {
          message.success('Đăng nhập bằng Google thành công!')
          const user = accountRes.payload.data.user
          await fetchProfileAndRedirect(user)
        }
      }
    } catch (err: any) {
      console.error(err)
      message.error(err.response?.data?.message || 'Đăng nhập bằng Google thất bại.')
    } finally {
      hide()
    }
  }

  const handleGoogleClick = () => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken()
    } else {
      message.error('Không tải được thư viện Google Sign-In. Vui lòng tải lại trang.')
    }
  }

  const onFinish: FormProps<LoginFormValues>['onFinish'] = async (values) => {
    try {
      const resultAction = await dispatch(loginUser({ email: values.email, password: values.password }))
      if (loginUser.fulfilled.match(resultAction)) {
        message.success('Đăng nhập thành công!')
        const user = resultAction.payload.data.user
        await fetchProfileAndRedirect(user)
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
              onClick={handleGoogleClick}
              icon={
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              }
            >
              Google
            </Button>
            <Button
              block
              className="btn-social"
              onClick={handleGithubClick}
              icon={<GithubOutlined style={{ color: '#181717', fontSize: '18px' }} />}
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