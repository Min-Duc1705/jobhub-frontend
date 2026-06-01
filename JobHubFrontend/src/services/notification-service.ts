import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'

export interface IAuditLogDto {
  id: string
  userId: string | null
  email: string | null
  username: string | null
  action: string
  entityName: string
  entityId: string
  changesJson: string | null
  ipAddress: string | null
  userAgent: string | null
  timestamp: string
}

/** Lấy danh sách audit logs (phân trang & tìm kiếm) */
export const getAuditLogsApi = (query: string): Promise<ApiResponse<PageResult<IAuditLogDto>>> =>
  axios.get(`/api/v1/audit-logs?${query}`)

export interface INotificationDto {
  id: string
  title: string
  message: string
  isRead: boolean
  createdDate: string // ISO string
  type: 'view' | 'invite' | 'recommend' | 'default'
}

/** Lấy danh sách thông báo */
export const getNotificationsApi = (): Promise<ApiResponse<INotificationDto[]>> =>
  axios.get('/api/v1/notifications')

/** Đánh dấu đã đọc 1 thông báo */
export const markNotificationReadApi = (id: string): Promise<ApiResponse<{ id: string, isRead: boolean }>> =>
  axios.patch(`/api/v1/notifications/${id}/read`)

/** Đánh dấu đã đọc tất cả thông báo */
export const markAllNotificationsReadApi = (): Promise<ApiResponse<{ success: boolean }>> =>
  axios.patch('/api/v1/notifications/read-all')

export interface IBroadcastNotificationRequest {
  title: string
  message: string
  type: 'view' | 'invite' | 'recommend' | 'default'
  targetGroup: 'ALL' | 'HR' | 'CANDIDATE'
}

/** Gửi thông báo broadcast đến tất cả người dùng hoặc nhóm (HR, Candidate) */
export const broadcastNotificationApi = (data: IBroadcastNotificationRequest): Promise<ApiResponse<{ success: boolean }>> =>
  axios.post('/api/v1/users/notifications/broadcast', data)
