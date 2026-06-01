import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'
import type { IRole, RoleBody, RoleDropdown } from '../types/role'

// ── Role APIs ────────────────────────────────────────────────────────────────

export const getRolesApi = (query: string): Promise<ApiResponse<PageResult<IRole>>> =>
  axios.get(`/api/v1/roles?${query}`)

export const getRoleDropdownApi = (): Promise<ApiResponse<RoleDropdown[]>> =>
  axios.get('/api/v1/roles/dropdown')

export const createRoleApi = (data: RoleBody): Promise<ApiResponse<IRole>> =>
  axios.post('/api/v1/roles', data)

export const updateRoleApi = (id: string, data: RoleBody): Promise<ApiResponse<IRole>> =>
  axios.put(`/api/v1/roles/${id}`, data)

export const deleteRoleApi = (id: string): Promise<ApiResponse<null>> =>
  axios.delete(`/api/v1/roles/${id}`)
