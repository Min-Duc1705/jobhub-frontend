// ─── Enums ────────────────────────────────────────────────────────
export type Gender          = 'MALE' | 'FEMALE' | 'OTHER'
export type JobSearchStatus = 'ACTIVELY_LOOKING' | 'OPEN_TO_OFFERS' | 'NOT_LOOKING'
export type CustomerType    = 'CANDIDATE' | 'EMPLOYER'

// ─── DTOs ─────────────────────────────────────────────────────────
export interface CustomerSkillDto {
  skillId:           string
  skillName:         string
  yearsOfExperience: number | null
}

export interface CustomerProfile {
  id:                string
  appUserId:         string
  type:              CustomerType
  fullName:          string | null
  avatar:            string | null
  phone:             string | null
  dateOfBirth:       string | null   // ISO date string yyyy-MM-dd
  gender:            Gender | null
  address:           string | null
  summary:           string | null
  yearsOfExperience: number | null
  expectedSalary:    number | null
  jobSearchStatus:   JobSearchStatus | null
  companyId:         string | null
  position:          string | null   // Employer only
  skills:            CustomerSkillDto[]
}

export interface UpdateProfileRequest {
  fullName?:          string | null
  avatar?:            string | null
  phone?:             string | null
  dateOfBirth?:       string | null
  gender?:            Gender | null
  address?:           string | null
  summary?:           string | null
  yearsOfExperience?: number | null
  expectedSalary?:    number | null
  jobSearchStatus?:   JobSearchStatus | null
  position?:          string | null
  companyId?:         string | null
}

export interface SkillOption {
  id:   string
  name: string
}

export interface AvatarUploadResponse {
  url:        string
  objectName: string
}
