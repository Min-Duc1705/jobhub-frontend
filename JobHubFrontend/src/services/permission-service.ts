import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'
import type { IPermission, PermissionBody } from '../types/permission'

// ── Permission APIs ──────────────────────────────────────────────────────────

export const getPermissionsApi = (query: string): Promise<ApiResponse<PageResult<IPermission>>> =>
  axios.get(`/api/v1/permissions?${query}`)

export const getPermissionDropdownApi = (): Promise<ApiResponse<IPermission[]>> =>
  axios.get('/api/v1/permissions/dropdown')

export const createPermissionApi = (data: PermissionBody): Promise<ApiResponse<IPermission>> =>
  axios.post('/api/v1/permissions', data)

export const updatePermissionApi = (id: string, data: PermissionBody): Promise<ApiResponse<IPermission>> =>
  axios.put(`/api/v1/permissions/${id}`, data)

export const deletePermissionApi = (id: string): Promise<ApiResponse<null>> =>
  axios.delete(`/api/v1/permissions/${id}`)
