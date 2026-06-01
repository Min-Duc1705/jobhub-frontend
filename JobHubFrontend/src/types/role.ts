// ── Role types ────────────────────────────────────────────────────────────────
// Khớp với backend: AuthService → RolesController / IRoleService
// JSON field mapping:
//   IsActive         → isActive
//   CreatedDate      → createdDate
//   LastModifiedDate → lastModifiedDate

import type { IPermission } from './permission'

export interface IRole {
  id?: string
  name: string
  description?: string
  isActive: boolean          // backend: IsActive
  permissions?: IPermission[]
  createdDate?: string       // backend: CreatedDate
  lastModifiedDate?: string  // backend: LastModifiedDate
}

/** Payload dùng khi POST / PUT role — khớp với CreateRoleRequest / UpdateRoleRequest */
export interface RoleBody {
  name: string
  description?: string
  isActive: boolean          // backend: IsActive (chỉ dùng cho Update)
  permissionIds: string[]    // backend: PermissionIds — danh sách Guid
}

/** Dùng cho select/dropdown chỉ cần id + name */
export interface RoleDropdown {
  id: string
  name: string
}
