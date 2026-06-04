// AuthProvider — khôi phục trạng thái đăng nhập khi F5 / mở lại tab
// Gọi GET /api/v1/auth/account một lần khi app khởi động nếu có access_token

import { useEffect, useState } from 'react'
import { useAppDispatch } from '../../redux/hooks'
import { fetchAccount, setAvatarUrl } from '../../redux/slices/authSlice'
import { getMyProfileApi } from '../../services/profile-service'
import { resolveChatUrl } from '../../utils/url'
import { Spin } from 'antd'

const SKIP_PATHS = ['/login', '/register', '/forgot-password']

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Không fetch ở các trang auth — tránh vòng lặp redirect
    if (SKIP_PATHS.includes(window.location.pathname)) {
      setInitialized(true)
      return
    }

    const token = localStorage.getItem('access_token')
    if (!token) {
      setInitialized(true)
      return
    }

    // Restore user state từ server, sau đó load avatar từ ProfileService
    dispatch(fetchAccount()).then((action) => {
      if (fetchAccount.fulfilled.match(action)) {
        getMyProfileApi()
          .then(res => {
            // resolveChatUrl đổi domain cloudflare cũ → domain mới từ VITE_BACKEND_URL
            const rawAvatar = res.data?.avatar ?? null
            dispatch(setAvatarUrl(rawAvatar ? resolveChatUrl(rawAvatar) : null))
          })
          .catch(() => {}) // bỏ qua nếu profile chưa tạo
          .finally(() => {
            setInitialized(true)
          })
      } else {
        setInitialized(true)
      }
    })
  }, [dispatch])

  if (!initialized) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        gap: 16
      }}>
        <Spin size="large" />
        <span style={{
          fontFamily: "'Inter', sans-serif",
          color: '#002660',
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: '0.5px'
        }}>
          Đang tải tài nguyên hệ thống...
        </span>
      </div>
    )
  }

  return <>{children}</>
}

export default AuthProvider
