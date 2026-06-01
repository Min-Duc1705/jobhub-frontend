import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'
import type { IUser, CreateUserBody, UpdateUserBody, ResetPasswordBody } from '../types/account'

// ── User (Account) APIs → AuthService /api/v1/users ─────────────────────────

/** Lấy danh sách users (admin) */
export const getUsersApi = (query: string): Promise<ApiResponse<PageResult<IUser>>> =>
  axios.get(`/api/v1/users?${query}`)

/** Tạo user mới */
export const createUserApi = (data: CreateUserBody): Promise<ApiResponse<IUser>> =>
  axios.post('/api/v1/users', data)

/** Cập nhật thông tin user */
export const updateUserApi = (id: string, data: UpdateUserBody): Promise<ApiResponse<IUser>> =>
  axios.put(`/api/v1/users/${id}`, data)

/** Xóa user */
export const deleteUserApi = (id: string): Promise<ApiResponse<null>> =>
  axios.delete(`/api/v1/users/${id}`)

/** Đặt lại mật khẩu */
export const resetUserPasswordApi = (id: string, data: ResetPasswordBody): Promise<ApiResponse<null>> =>
  axios.patch(`/api/v1/users/${id}/reset-password`, data)
