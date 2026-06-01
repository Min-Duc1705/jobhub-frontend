// ── Customer types ────────────────────────────────────────────────────────────
// Khớp với backend: ProfileService → CustomersController → CustomerResponse
// CustomerType: CANDIDATE | EMPLOYER

export type CustomerType = 'CANDIDATE' | 'EMPLOYER'
export type Gender       = 'MALE' | 'FEMALE' | 'OTHER'
export type JobSearchStatus = 'OPEN' | 'NOT_OPEN' | 'OPEN_TO_OFFERS'

export interface ICustomer {
  id?: string
  appUserId: string
  type: CustomerType
  fullName?: string
  avatar?: string
  phone?: string
  // Candidate
  dateOfBirth?: string
  gender?: Gender
  address?: string
  summary?: string
  yearsOfExperience?: number
  expectedSalary?: number
  jobSearchStatus?: JobSearchStatus
  // Employer
  companyId?: string
  position?: string
  // Skills
  skills?: { skillId: string; skillName: string; yearsOfExperience?: number }[]
}
