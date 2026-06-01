// ── User / Account types ──────────────────────────────────────────────────────
// Khớp với backend: AuthService → UsersController / UserResponse

export type UserStatus = 'Active' | 'Pending' | 'Suspended' | 'Deactivated'

export interface IUserRole {
  id: string
  name: string
}

export interface IUser {
  id: string
  username: string
  email: string
  status: UserStatus
  role?: IUserRole | null
  createdDate: string
  lastModifiedDate?: string
}

export interface CreateUserBody {
  username: string
  email: string
  password: string
  roleId?: string
}

export interface UpdateUserBody {
  username: string
  email: string
  status: UserStatus
  roleId?: string
}

export interface ResetPasswordBody {
  newPassword: string
}

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  Active:      'Hoạt động',
  Pending:     'Chờ xác thực',
  Suspended:   'Tạm khóa',
  Deactivated: 'Đã vô hiệu',
}

export const USER_STATUS_COLOR: Record<UserStatus, string> = {
  Active:      'green',
  Pending:     'gold',
  Suspended:   'orange',
  Deactivated: 'red',
}
