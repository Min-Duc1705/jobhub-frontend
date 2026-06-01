/**
 * common.ts — Shared types khớp với backend CommonService
 *
 * Backend reference:
 *   CommonService.Common.ApiResponse<T>
 *   CommonService.Common.ResultPaginationDto<T>
 *
 * Import ở bất kỳ service / type file nào:
 *   import type { ApiResponse, PageResult, PageMeta } from '../types/common'
 */

// ── ApiResponse<T> ────────────────────────────────────────────────────────────
// Khớp với CommonService.Common.ApiResponse<T>
export interface ApiResponse<T = unknown> {
  statusCode: number
  error?:     string | null
  message?:   string | null
  data:        T
}

// ── Phân trang ────────────────────────────────────────────────────────────────
// Khớp với ResultPaginationDto<T>.MetaInfo
export interface PageMeta {
  page:     number
  pageSize: number
  pages:    number   // tổng số trang
  total:    number   // tổng số bản ghi
}

// Khớp với ResultPaginationDto<T>
export interface PageResult<T> {
  meta:   PageMeta
  result: T[]
}

// Wrapper tiện lợi: ApiResponse bọc PageResult
export type PageResponse<T> = ApiResponse<PageResult<T>>
