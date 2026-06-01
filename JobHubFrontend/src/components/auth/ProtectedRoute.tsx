// ProtectedRoute — bảo vệ các route cần đăng nhập
// Trong khi đang fetch account (F5), hiển thị spinner toàn màn hình
// Khi xong: đã đăng nhập → cho vào, chưa đăng nhập → redirect /login

import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAppSelector } from '../../redux/hooks'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth)

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" tip="Đang xác thực..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
