import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'
import type { ISkill, SkillBody } from '../types/skill'

// ── Skill APIs → JobService /api/v1/skills ────────────────────────────────────

export const getSkillsDropdownApi = (): Promise<ApiResponse<ISkill[]>> =>
  axios.get('/api/v1/skills/dropdown')

/** Lấy danh sách kỹ năng (phân trang, admin) */
export const getSkillsApi = (query: string): Promise<ApiResponse<PageResult<ISkill>>> =>
  axios.get(`/api/v1/skills?${query}`)

/** Tạo kỹ năng (Admin) */
export const createSkillApi = (data: SkillBody): Promise<ApiResponse<ISkill>> =>
  axios.post('/api/v1/skills', data)

/** Cập nhật kỹ năng (Admin) */
export const updateSkillApi = (id: string, data: SkillBody): Promise<ApiResponse<ISkill>> =>
  axios.put(`/api/v1/skills/${id}`, data)

/** Xóa kỹ năng (Admin) */
export const deleteSkillApi = (id: string): Promise<ApiResponse<null>> =>
  axios.delete(`/api/v1/skills/${id}`)
