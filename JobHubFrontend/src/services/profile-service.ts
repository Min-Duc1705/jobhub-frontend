import axios from './axios-customize'
import type { ApiResponse, PageResult } from '../types/common'
import type {
  CustomerProfile,
  UpdateProfileRequest,
  SkillOption,
  AvatarUploadResponse,
} from '../types/profile'
import type { ISkill, SkillBody } from '../types/skill'

// ─── Profile ──────────────────────────────────────────────────────

/** GET /api/v1/customers/me */
export const getMyProfileApi = (): Promise<ApiResponse<CustomerProfile>> =>
  axios.get('/api/v1/customers/me')

/** PUT /api/v1/customers/me */
export const updateMyProfileApi = (
  data: UpdateProfileRequest
): Promise<ApiResponse<CustomerProfile>> =>
  axios.put('/api/v1/customers/me', data)

/** POST /api/v1/customers/upload-avatar  (multipart/form-data) */
export const uploadAvatarApi = (
  file: File
): Promise<ApiResponse<AvatarUploadResponse>> => {
  const form = new FormData()
  form.append('file', file)
  return axios.post('/api/v1/customers/upload-avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ─── Skills ───────────────────────────────────────────────────────

/** GET /api/v1/skills/dropdown — Tất cả kỹ năng có trong hệ thống */
export const getSkillsDropdownApi = (): Promise<ApiResponse<SkillOption[]>> =>
  axios.get('/api/v1/skills/dropdown')

/** POST /api/v1/skills/me — Thêm kỹ năng vào hồ sơ của mình */
export const addSkillToProfileApi = (
  skillId: string,
  yearsOfExperience?: number
): Promise<ApiResponse<CustomerProfile>> =>
  axios.post('/api/v1/skills/me', { skillId, yearsOfExperience })

/** DELETE /api/v1/skills/me/{skillId} — Xóa kỹ năng khỏi hồ sơ */
export const removeSkillFromProfileApi = (
  skillId: string
): Promise<ApiResponse<CustomerProfile>> =>
  axios.delete(`/api/v1/skills/me/${skillId}`)

// ─── Admin Skill CRUD ─────────────────────────────────────────────

/** GET /api/v1/skills?searchTerm=&pageNumber=1&pageSize=10 — Admin quản trị */
export const getSkillsApi = (query: string): Promise<ApiResponse<PageResult<ISkill>>> =>
  axios.get(`/api/v1/skills?${query}`)

/** POST /api/v1/skills — Admin tạo kỹ năng mới */
export const createSkillApi = (data: SkillBody): Promise<ApiResponse<ISkill>> =>
  axios.post('/api/v1/skills', data)

/** PUT /api/v1/skills/{id} — Admin cập nhật kỹ năng */
export const updateSkillApi = (id: string, data: SkillBody): Promise<ApiResponse<ISkill>> =>
  axios.put(`/api/v1/skills/${id}`, data)

/** DELETE /api/v1/skills/{id} — Admin xóa kỹ năng */
export const deleteSkillApi = (id: string): Promise<ApiResponse<null>> =>
  axios.delete(`/api/v1/skills/${id}`)

/** POST /api/v1/skills/import — Admin import kỹ năng từ Excel/CSV */
export const importSkillsApi = (file: File): Promise<ApiResponse<any>> => {
  const form = new FormData()
  form.append('file', file)
  return axios.post('/api/v1/skills/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
