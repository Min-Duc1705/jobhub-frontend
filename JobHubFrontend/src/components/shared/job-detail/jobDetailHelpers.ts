import type { IJob } from '../../../types/job'
import type { CompanySize } from '../../../types/company'

// ── Labels ──────────────────────────────────────────────────────────────────
export const SIZE_LABEL: Record<CompanySize, string> = {
  STARTUP:    'Startup (< 50 NV)',
  SME:        'Vừa & nhỏ (50–500 NV)',
  ENTERPRISE: 'Tập đoàn (500+ NV)',
}

export const LEVEL_COLOR: Record<string, string> = {
  INTERN: 'default', FRESHER: 'cyan', JUNIOR: 'geekblue',
  MIDDLE: 'blue',   SENIOR: 'volcano', LEADER: 'red', MANAGER: 'magenta',
}

export const TYPE_COLOR: Record<string, string> = {
  FULL_TIME: 'blue', PART_TIME: 'orange', REMOTE: 'green',
  HYBRID: 'purple',  INTERNSHIP: 'gold',
}

const PRESET_COLORS = [
  'blue', 'purple', 'cyan', 'green', 'magenta',
  'volcano', 'orange', 'gold', 'lime', 'geekblue'
]

export const getSkillColor = (skillName: string): string => {
  return 'blue'
}


// ── Salary formatter ─────────────────────────────────────────────────────────
export const formatSalary = (job: IJob): string => {
  if (job.isSalaryNegotiable || (!job.salaryMin && !job.salaryMax)) return 'Thương lượng'
  const cur = job.salaryCurrency ?? 'VND'
  if (cur === 'USD') {
    const min = job.salaryMin ? `$${job.salaryMin.toLocaleString('en-US')}` : ''
    const max = job.salaryMax ? `$${job.salaryMax.toLocaleString('en-US')}` : ''
    return min && max ? `${min} – ${max}` : min || max
  }
  const fmt = (n?: number) => n ? `${(n / 1_000_000).toFixed(0)}M ₫` : ''
  const min = fmt(job.salaryMin)
  const max = fmt(job.salaryMax)
  return min && max ? `${min} – ${max}` : min || max || 'Thương lượng'
}

// ── Time ago ─────────────────────────────────────────────────────────────────
export const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'Vừa đăng'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} ngày trước`
  return `${Math.floor(d / 30)} tháng trước`
}

// ── HTML text extraction ─────────────────────────────────────────────────────
export const extractTextLines = (html?: string): string[] => {
  if (!html) return []
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const liItems: string[] = []
  tmp.querySelectorAll('li').forEach(li => {
    const t = li.textContent?.trim()
    if (t) liItems.push(t)
  })
  if (liItems.length > 0) return liItems
  const stripped = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  return stripped.split('\n').map(l => l.trim()).filter(Boolean)
}

export const hasListTags = (html?: string): boolean =>
  !!html && /<li[\s>]/i.test(html)
