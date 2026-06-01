import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'
import type { ICompany, CompanyBody } from '../types/company'

// ── Company APIs (CompanyService → /api/v1/companies) ────────────────────────

export const getCompaniesApi = (query: string): Promise<ApiResponse<PageResult<ICompany>>> =>
  axios.get(`/api/v1/companies?${query}`)

export const getCompanyByIdApi = (id: string): Promise<ApiResponse<ICompany>> =>
  axios.get(`/api/v1/companies/${id}`)

export const createCompanyApi = (data: CompanyBody): Promise<ApiResponse<ICompany>> =>
  axios.post('/api/v1/companies', data)

export const updateCompanyApi = (id: string, data: CompanyBody): Promise<ApiResponse<ICompany>> =>
  axios.put(`/api/v1/companies/${id}`, data)

export const deleteCompanyApi = (id: string): Promise<ApiResponse<null>> =>
  axios.delete(`/api/v1/companies/${id}`)

/** PATCH /api/v1/companies/{id}/verify — xác minh công ty */
export const verifyCompanyApi = (id: string): Promise<ApiResponse<ICompany>> =>
  axios.patch(`/api/v1/companies/${id}/verify`)

export const uploadCompanyImageApi = (file: File): Promise<ApiResponse<{ url: string }>> => {
  const form = new FormData()
  form.append('file', file)
  return axios.post('/api/v1/companies/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ── Public APIs — Employer tự đăng ký (không cần quyền Admin) ────────────────

/** GET /api/v1/companies/public/register — Employer tự đăng ký công ty, IsVerified=false */
export const registerCompanyApi = (data: CompanyBody): Promise<ApiResponse<ICompany>> =>
  axios.post('/api/v1/companies/public/register', data)

/** GET /api/v1/companies/public — Chỉ trả về công ty ĐÃ XÁC MINH (dùng cho client, dropdown...) */
export const getVerifiedCompaniesApi = (query: string): Promise<ApiResponse<PageResult<ICompany>>> =>
  axios.get(`/api/v1/companies/public?${query}`)

/** POST /api/v1/companies/public/upload — Upload ảnh công ty cho Employer */
export const uploadCompanyPublicImageApi = (file: File): Promise<ApiResponse<{ url: string }>> => {
  const form = new FormData()
  form.append('file', file)
  return axios.post('/api/v1/companies/public/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
