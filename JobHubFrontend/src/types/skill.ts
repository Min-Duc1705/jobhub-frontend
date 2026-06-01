// ── Skill types ───────────────────────────────────────────────────────────────
// Khớp với backend: ProfileService → SkillsController
// Skill là entity đơn giản: chỉ có Id và Name (Admin quản lý).

export interface ISkill {
  id?: string
  name: string
  createdDate?:      string   // backend: CreatedDate
  lastModifiedDate?: string   // backend: LastModifiedDate
}

/** Payload POST / PUT skill */
export interface SkillBody {
  name: string
}
