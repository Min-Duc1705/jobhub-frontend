// Re-export shared types — existing code that imports from auth.ts continues to work
export type { ApiResponse, PageResult, PageMeta, PageResponse } from './common'

// ── Auth domain types ─────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  username: string
  status: string
  role?: {
    id: string
    name: string
    permissions: Array<{
      id: string
      name: string
      apiPath: string
      method: string
      module: string
    }>
  } | null
}

export interface LoginRequest {
  email: string
  password?: string
}

export interface LoginResponse {
  accessToken: string | null
  user: User
}

export interface RegisterRequest {
  email: string
  username: string
  password?: string
  role?: string
}

export interface RegisterResponse {
  id: string
  email: string
  username: string
  createdDate: string
}

export interface VerifyEmailRequest {
  email: string
  otpCode: string
}
