// ── Application types ─────────────────────────────────────────────────────────
// Khớp với backend: ResumeService → ApplicationsController

import type { IResume } from './resume-builder'

export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED'

export interface IResumeBasic {
  id: string
  title: string
  isOnlineCv: boolean
  templateId?: number
  url?: string
  extractedText?: string
  contentJson?: string
}

export interface IApplication {
  id: string
  customerId: string
  jobId: string
  resumeId: string
  coverLetter?: string
  status: ApplicationStatus
  reviewNote?: string
  createdDate: string
  lastModifiedDate?: string
  resume?: IResume
}

export interface UpdateApplicationStatusBody {
  status: ApplicationStatus
  reviewNote?: string
}

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING:   'Chờ xử lý',
  REVIEWING: 'Đang xem xét',
  APPROVED:  'Đã duyệt',
  REJECTED:  'Đã từ chối',
}

export const APPLICATION_STATUS_COLOR: Record<ApplicationStatus, string> = {
  PENDING:   'gold',
  REVIEWING: 'blue',
  APPROVED:  'green',
  REJECTED:  'red',
}
