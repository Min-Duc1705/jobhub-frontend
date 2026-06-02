import axios from './axios-customize'
import type { ApiResponse } from '../types/common'

export interface IContactRequest {
  fullName: string
  email: string
  phone?: string
  topic: string
  message: string
}

/** Gửi lời nhắn liên hệ */
export const submitContactFormApi = (data: IContactRequest): Promise<ApiResponse<{ id: string }>> =>
  axios.post('/api/v1/contacts', data)
