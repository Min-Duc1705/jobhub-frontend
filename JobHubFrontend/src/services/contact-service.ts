import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'

export interface IContactRequest {
  fullName: string
  email: string
  phone?: string
  topic: string
  message: string
}

export interface IContact {
  id: string
  fullName: string
  email: string
  phone?: string
  topic: string
  message: string
  createdAt: string
}

/** POST /api/v1/contacts — Gửi thông tin liên hệ của khách hàng */
export const submitContactApi = (data: IContactRequest): Promise<ApiResponse<{ success: boolean }>> =>
  axios.post('/api/v1/contacts', data)

export const submitContactFormApi = submitContactApi

/** GET /api/v1/contacts — Admin: Lấy danh sách liên hệ có phân trang */
export const getContactsApi = (query: string): Promise<ApiResponse<PageResult<IContact>>> =>
  axios.get(`/api/v1/contacts?${query}`)
