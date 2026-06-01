// AuthProvider — khôi phục trạng thái đăng nhập khi F5 / mở lại tab
// Gọi GET /api/v1/auth/account một lần khi app khởi động nếu có access_token

import { useEffect } from 'react'
import { useAppDispatch } from '../../redux/hooks'
import { fetchAccount, setAvatarUrl } from '../../redux/slices/authSlice'
import { getMyProfileApi } from '../../services/profile-service'

const SKIP_PATHS = ['/login', '/register', '/forgot-password']

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Không fetch ở các trang auth — tránh vòng lặp redirect
    if (SKIP_PATHS.includes(window.location.pathname)) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    // Restore user state từ server, sau đó load avatar từ ProfileService
    dispatch(fetchAccount()).then((action) => {
      if (fetchAccount.fulfilled.match(action)) {
        getMyProfileApi()
          .then(res => dispatch(setAvatarUrl(res.data?.avatar ?? null)))
          .catch(() => {}) // bỏ qua nếu profile chưa tạo
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}

export default AuthProvider
