import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'
import type { IApplication, UpdateApplicationStatusBody } from '../types/application'

// ── Application APIs (ResumeService → /api/v1/applications) ─────────────────

/** Lấy tất cả đơn ứng tuyển (admin) */
export const getApplicationsApi = (query: string): Promise<ApiResponse<PageResult<IApplication>>> =>
  axios.get(`/api/v1/applications?${query}`)

/** Lấy chi tiết 1 đơn */
export const getApplicationByIdApi = (id: string): Promise<ApiResponse<IApplication>> =>
  axios.get(`/api/v1/applications/${id}`)

/** Nộp đơn ứng tuyển mới */
export const createApplicationApi = (data: {
  jobId: string
  resumeId: string
  coverLetter?: string
}): Promise<ApiResponse<IApplication>> =>
  axios.post('/api/v1/applications', data)

/** Cập nhật trạng thái đơn (admin/HR) */
export const updateApplicationStatusApi = (
  id: string,
  data: UpdateApplicationStatusBody,
): Promise<ApiResponse<IApplication>> =>
  axios.patch(`/api/v1/applications/${id}/status`, data)

/** Hủy đơn ứng tuyển (candidate) */
export const withdrawApplicationApi = (id: string): Promise<ApiResponse<null>> =>
  axios.delete(`/api/v1/applications/${id}`)
