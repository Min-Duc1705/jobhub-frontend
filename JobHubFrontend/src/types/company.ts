// ── Company types ─────────────────────────────────────────────────────────────
// Khớp với backend: CompanyService → CompaniesController
// JSON field mapping:
//   IsVerified       → isVerified
//   CompanySize      → companySize
//   CreatedDate      → createdDate
//   LastModifiedDate → lastModifiedDate

export type CompanySize = 'STARTUP' | 'SME' | 'ENTERPRISE'

export interface ICompany {
  id?: string
  name: string
  description?: string
  address?: string
  logo?: string
  coverImage?: string
  activityImages?: string[]   // Ảnh văn phòng/hoạt động (tối đa 4)
  youtubeUrl?: string         // Nhúng video YouTube giới thiệu công ty
  industry?: string
  companySize?: CompanySize
  website?: string
  contactEmail?: string
  taxCode?: string
  isVerified: boolean
  createdDate?: string       // backend: CreatedDate
  lastModifiedDate?: string  // backend: LastModifiedDate
}

/** Payload POST / PUT company */
export interface CompanyBody {
  name: string
  description?: string
  address?: string
  logo?: string
  coverImage?: string
  activityImages?: string[]   // Ảnh văn phòng/hoạt động (tối đa 4)
  youtubeUrl?: string         // Nhúng video YouTube giới thiệu công ty
  industry?: string
  companySize?: CompanySize
  website?: string
  contactEmail?: string
  taxCode?: string
}

