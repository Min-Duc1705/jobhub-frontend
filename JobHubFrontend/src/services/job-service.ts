import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'
import type { IJob } from '../types/job'

// ── Job APIs → JobService /api/v1/jobs ────────────────────────────────────────

/** Lấy danh sách jobs (public / HR — có filter PUBLISHED khi không có customerId) */
export const getJobsApi = (query: string): Promise<ApiResponse<PageResult<IJob>>> =>
  axios.get(`/api/v1/jobs?${query}`)

/** Lấy toàn bộ jobs cho Admin — không bị ép filter status PUBLISHED */
export const getAdminJobsApi = (query: string): Promise<ApiResponse<PageResult<IJob>>> =>
  axios.get(`/api/v1/admin/jobs?${query}`)

/** Lấy chi tiết 1 job (tăng view count) */
export const getJobByIdApi = (id: string): Promise<ApiResponse<IJob>> =>
  axios.get(`/api/v1/jobs/${id}`)

/** Preview job (không tăng view count — HR xem trước khi publish) */
export const previewJobApi = (id: string): Promise<ApiResponse<IJob>> =>
  axios.get(`/api/v1/jobs/${id}/preview`)

/** Tạo job mới (HR) */
export const createJobApi = (data: any): Promise<ApiResponse<IJob>> =>
  axios.post('/api/v1/jobs', data)

/** Cập nhật job (HR) */
export const updateJobApi = (id: string, data: any): Promise<ApiResponse<IJob>> =>
  axios.put(`/api/v1/jobs/${id}`, data)

/** Xóa job */
export const deleteJobApi = (id: string): Promise<ApiResponse<null>> =>
  axios.delete(`/api/v1/jobs/${id}`)

/** Thay đổi status job (PUBLISHED / CLOSED / SUSPENDED / DRAFT) */
export const changeJobStatusApi = (id: string, status: string): Promise<ApiResponse<IJob>> =>
  axios.patch(`/api/v1/jobs/${id}/status?status=${status}`)

/** Lấy danh sách việc làm đã lưu */
export const getSavedJobsApi = (query?: string): Promise<ApiResponse<PageResult<any>>> =>
  axios.get(`/api/v1/saved-jobs${query ? `?${query}` : ''}`)

/** Lưu tin tuyển dụng */
export const saveJobApi = (jobId: string, note?: string): Promise<ApiResponse<any>> =>
  axios.post(`/api/v1/saved-jobs/${jobId}${note ? `?note=${encodeURIComponent(note)}` : ''}`)

/** Bỏ lưu tin tuyển dụng */
export const unsaveJobApi = (jobId: string): Promise<ApiResponse<null>> =>
  axios.delete(`/api/v1/saved-jobs/${jobId}`)

/** Lấy thống kê ngành nghề tin tuyển dụng */
export const getJobCategoryStatsApi = (): Promise<ApiResponse<{ name: string, count: number, percentage: number }[]>> =>
  axios.get('/api/v1/jobs/stats/categories')

/** Import jobs từ Excel/CSV (Admin) */
export const importJobsApi = (file: File): Promise<ApiResponse<any>> => {
  const form = new FormData()
  form.append('file', file)
  return axios.post('/api/v1/admin/jobs/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
