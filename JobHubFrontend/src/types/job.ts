// ── Job types ─────────────────────────────────────────────────────────────────
// Khớp với backend: JobService → JobsController / JobResponse

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'SUSPENDED'
export type JobLevel  = 'INTERN' | 'FRESHER' | 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'LEADER' | 'MANAGER'
export type JobType   = 'FULL_TIME' | 'PART_TIME' | 'REMOTE' | 'HYBRID' | 'INTERNSHIP'

export interface IJobSkill {
  id: string
  name: string
}

export interface IJob {
  id: string
  companyId: string
  customerId: string
  name: string
  companyName?: string
  companyLogo?: string
  location?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency: string
  isSalaryNegotiable: boolean
  quantity: number
  level: JobLevel
  jobType: JobType
  category?: string
  experienceRequired?: string
  description?: string
  requirements?: string
  benefits?: string
  startDate?: string
  endDate?: string
  viewCount: number
  status: JobStatus
  skills: IJobSkill[]
  createdDate: string
  lastModifiedDate?: string
}

export interface UpdateJobStatusBody {
  status: JobStatus
}

// ── Label / Color maps ────────────────────────────────────────────────────────

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT:     'Bản nháp',
  PUBLISHED: 'Đang tuyển',
  CLOSED:    'Đã đóng',
  SUSPENDED: 'Bị khoá',
}
export const JOB_STATUS_COLOR: Record<JobStatus, string> = {
  DRAFT:     'default',
  PUBLISHED: 'green',
  CLOSED:    'orange',
  SUSPENDED: 'red',
}

export const JOB_LEVEL_LABEL: Record<JobLevel, string> = {
  INTERN:  'Intern',
  FRESHER: 'Fresher',
  JUNIOR:  'Junior',
  MIDDLE:  'Middle',
  SENIOR:  'Senior',
  LEADER:  'Leader',
  MANAGER: 'Manager',
}

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  FULL_TIME:  'Toàn thời gian',
  PART_TIME:  'Bán thời gian',
  REMOTE:     'Remote',
  HYBRID:     'Hybrid',
  INTERNSHIP: 'Thực tập',
}
