import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'
import type { ICustomer } from '../types/customer'

// ── Customer APIs (ProfileService → /api/v1/customers) ───────────────────────

export const getCustomersApi = (query: string): Promise<ApiResponse<PageResult<ICustomer>>> =>
  axios.get(`/api/v1/customers?${query}`)

export const getCustomerByIdApi = (id: string): Promise<ApiResponse<ICustomer>> =>
  axios.get(`/api/v1/customers/${id}`)

export const updateMyProfileApi = (data: Partial<ICustomer>): Promise<ApiResponse<ICustomer>> =>
  axios.put('/api/v1/customers/me', data)

export const updateCustomerByIdApi = (id: string, data: Partial<ICustomer>): Promise<ApiResponse<ICustomer>> =>
  axios.put(`/api/v1/customers/${id}`, data)

export const deleteCustomerByIdApi = (id: string): Promise<void> =>
  axios.delete(`/api/v1/customers/${id}`)
