// ── Permission types ──────────────────────────────────────────────────────────
// Khớp với backend: AuthService → PermissionsController / IPermissionService
// JSON field mapping:
//   CreatedDate      → createdDate
//   LastModifiedDate → lastModifiedDate

export interface IPermission {
  id?: string
  name: string
  apiPath: string
  method: string
  module: string
  createdDate?: string       // backend: CreatedDate
  lastModifiedDate?: string  // backend: LastModifiedDate
}

/** Payload dùng khi POST / PUT permission */
export interface PermissionBody {
  name: string
  apiPath: string
  method: string
  module: string
}

/** Danh sách permissions nhóm theo module — dùng trong role modal picker */
export interface PermissionGroup {
  module: string
  permissions: IPermission[]
}
