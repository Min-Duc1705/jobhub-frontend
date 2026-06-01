// ─── ResumeContent — dữ liệu CV ──────────────────────────────────────────────

export interface ResumePersonal {
  fullName: string
  title: string        // Chức danh: "Senior Fullstack Engineer"
  email: string
  phone?: string
  location?: string
  website?: string
  summary: string
  avatarUrl?: string
  openToWork: boolean
}

export interface ResumeExperience {
  id: string        // uuid v4 (client-generated)
  company: string
  position: string
  startDate: string        // "01/2021"
  endDate: string        // "Hiện tại" | "12/2023"
  description: string
  bullets: string[]
  tags: string[]
}

export interface ResumeEducation {
  id: string
  school: string
  degree: string          // "Kỹ thuật Phần mềm"
  startYear: string
  endYear: string
  gpa?: string
}

export interface ResumeSkillGroup {
  id: string
  category: string           // "Lập trình & Frameworks"
  items: string[]
}

export interface ResumeCertification {
  id: string
  name: string
  issuer: string
  year: string
  icon?: string             // material symbol name
}

export interface ResumeProject {
  id: string
  name: string
  description: string
  stars?: string        // "1.2k+"
  githubUrl?: string
  demoUrl?: string
  tags: string[]
}

export interface ResumeContent {
  personal: ResumePersonal
  experiences: ResumeExperience[]
  education: ResumeEducation[]
  skills: ResumeSkillGroup[]
  certifications: ResumeCertification[]
  projects: ResumeProject[]
}

// ─── Template metadata ────────────────────────────────────────────────────────
export interface ResumeTemplate {
  id: number
  name: string
  description: string
  thumbnail: string        // inline SVG data URL hoặc path
  colorAccent: string        // màu đại diện của template
}

// ─── API response type ────────────────────────────────────────────────────────
export interface IResume {
  id: string
  customerId: string
  title: string
  url?: string
  extractedText?: string
  isDefault: boolean
  isOnlineCv: boolean
  templateId?: number
  contentJson?: string    // JSON string → parse thành ResumeContent
  createdDate: string
  lastModifiedDate?: string
}

// ─── Default empty CV ─────────────────────────────────────────────────────────
export const DEFAULT_RESUME_CONTENT: ResumeContent = {
  personal: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    summary: '',
    avatarUrl: '',
    openToWork: true,
  },
  experiences: [],
  education: [],
  skills: [{ id: crypto.randomUUID(), category: 'Kỹ năng kỹ thuật', items: [] }],
  certifications: [],
  projects: [],
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 1,
    name: 'Modern',
    description: 'Phong cách hiện đại, sáng tạo. Phù hợp ngành IT, Design.',
    thumbnail: 'template_modern',
    colorAccent: '#002660',
  },
  {
    id: 2,
    name: 'Classic',
    description: 'Chuyên nghiệp, trang trọng. Phù hợp ngành Tài chính, Ngân hàng.',
    thumbnail: 'template_classic',
    colorAccent: '#1a1a2e',
  },
]
