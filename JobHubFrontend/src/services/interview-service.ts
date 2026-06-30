import axios from './axios-customize'
import type { ApiResponse } from '../types/common'

export interface IInterview {
  id: string
  jobId: string
  candidateId: string
  recruiterId: string
  interviewDate: string // ISO string
  type: 'Technical' | 'Cultural' | 'Final'
  status: 'PendingConfirm' | 'Scheduled' | 'Rescheduled' | 'Cancelled' | 'Completed'
  meetingLink?: string
  location?: string
  notes?: string
  createdDate: string
  lastModifiedDate?: string
}

export interface ICreateInterviewRequest {
  jobId: string
  candidateId: string
  interviewDate: string
  type: string
  meetingLink?: string
  location?: string
  notes?: string
}

export interface IUpdateInterviewRequest {
  interviewDate?: string
  status?: string
  meetingLink?: string
  location?: string
  notes?: string
}

/** Lấy danh sách lịch phỏng vấn dùng chung */
export const getInterviewsApi = (): Promise<ApiResponse<IInterview[]>> =>
  axios.get('/api/v1/interviews')

/** Lấy chi tiết lịch phỏng vấn */
export const getInterviewByIdApi = (id: string): Promise<ApiResponse<IInterview>> =>
  axios.get(`/api/v1/interviews/${id}`)

/** Đặt lịch phỏng vấn thủ công mới */
export const createInterviewApi = (data: ICreateInterviewRequest): Promise<ApiResponse<IInterview>> =>
  axios.post('/api/v1/interviews', data)

/** Cập nhật hoặc dời lịch phỏng vấn */
export const updateInterviewApi = (id: string, data: IUpdateInterviewRequest): Promise<ApiResponse<IInterview>> =>
  axios.put(`/api/v1/interviews/${id}`, data)

/** Hủy lịch phỏng vấn */
export const cancelInterviewApi = (id: string): Promise<ApiResponse<null>> =>
  axios.delete(`/api/v1/interviews/${id}`)
