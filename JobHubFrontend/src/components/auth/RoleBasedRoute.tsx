// RoleBasedRoute — giới hạn route theo role của user
//
// Cách dùng:
//   <RoleBasedRoute allowedRoles={['ADMIN', 'HR']}>
//     <AdminDashboard />
//   </RoleBasedRoute>
//
// Nếu không truyền allowedRoles → cho phép mọi user đã đăng nhập.

import { useAppSelector } from '../../redux/hooks'
import ForbiddenPage from '../shared/common/403/403'

interface Props {
  children: React.ReactNode
  /** Danh sách role được phép. Bỏ trống = cho phép tất cả authenticated user */
  allowedRoles?: string[]
  /** Danh sách role bị loại trừ (bị chặn) */
  excludedRoles?: string[]
}

const RoleBasedRoute = ({ children, allowedRoles, excludedRoles }: Props) => {
  const { user } = useAppSelector((s) => s.auth)

  // Chưa load user (edge case) → không cho vào
  if (!user) return <ForbiddenPage />

  const userRole = user.role?.name ?? ''

  // 1. Kiểm tra danh sách loại trừ (excludedRoles)
  if (excludedRoles && excludedRoles.some((r) => r.toLowerCase() === userRole.toLowerCase())) {
    return <ForbiddenPage />
  }

  // 2. Kiểm tra danh sách được phép (allowedRoles)
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some((r) => r.toLowerCase() === userRole.toLowerCase())
    if (!isAllowed) return <ForbiddenPage />
  }

  return <>{children}</>
}

export default RoleBasedRoute
