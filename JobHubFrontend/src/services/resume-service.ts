import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'
import type { IResume } from '../types/resume-builder'

// ── Resume APIs (ResumeService → /api/v1/resumes) ────────────────────────────

/** Lấy danh sách CV của tôi */
export const getMyResumesApi = (customerId: string): Promise<ApiResponse<PageResult<IResume>>> =>
  axios.get(`/api/v1/resumes?customerId=${customerId}&pageSize=50`)

/** Lấy chi tiết 1 CV */
export const getResumeByIdApi = (id: string): Promise<ApiResponse<IResume>> =>
  axios.get(`/api/v1/resumes/${id}`)

/** Upload file CV (PDF/DOC) */
export const uploadResumeFileApi = (formData: FormData): Promise<ApiResponse<{ url: string; originalFileName: string; extractedText?: string }>> =>
  axios.post('/api/v1/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

/** Tạo CV từ file (sau khi upload) */
export const createResumeApi = (data: {
  title: string
  url: string
  extractedText?: string
  isDefault?: boolean
}): Promise<ApiResponse<IResume>> =>
  axios.post('/api/v1/resumes', data)

/** Tạo Online CV qua Builder */
export const createOnlineCvApi = (data: {
  title: string
  templateId: number
  contentJson: string
  isDefault?: boolean
}): Promise<ApiResponse<IResume>> =>
  axios.post('/api/v1/resumes/online', data)

/** Auto-save nội dung Online CV */
export const updateCvContentApi = (id: string, data: {
  title?: string
  templateId?: number
  contentJson?: string
  isDefault?: boolean
}): Promise<ApiResponse<IResume>> =>
  axios.put(`/api/v1/resumes/${id}/content`, data)

/** Xóa CV */
export const deleteResumeApi = (id: string): Promise<ApiResponse<null>> =>
  axios.delete(`/api/v1/resumes/${id}`)

/** Đặt CV mặc định */
export const setDefaultResumeApi = (id: string): Promise<ApiResponse<null>> =>
  axios.patch(`/api/v1/resumes/${id}/set-default`)

/** Đổi tên CV */
export const renameCvApi = (id: string, title: string): Promise<ApiResponse<IResume>> =>
  axios.put(`/api/v1/resumes/${id}`, { title })

/** Download file CV */
export const getResumeDownloadUrl = (id: string) =>
  `/api/v1/resumes/${id}/download`
