import axios from './axios-customize'
import type { ApiResponse } from '../types/common'
import type { IJob } from '../types/job'

const unwrapFastApi = <T>(res: unknown): T => {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: T }).data
  }
  return res as T
}

export interface SalaryPredictRequest {
  job_title: string
  years_of_experience: number
  skill_set: string[]
  location: string
  level: string
}

export interface SalaryPredictResponse {
  min_salary: number
  max_salary: number
  confidence: number
  model_version: string
  from_cache: boolean
}

export interface TrendRequest {
  skill_name: string
  months: number
}

export interface TrendDataPoint {
  month: number
  year: number
  job_count: number
  avg_salary: number
}

export interface TrendResponse {
  skill_name: string
  history: TrendDataPoint[]
  forecast: TrendDataPoint[]
}

export interface CvScoringRequest {
  job_description: string
  cv_text: string
  application_id?: string
  job_id?: string
  customer_id?: string
}

export interface CvScoringResult {
  application_id?: string
  matching_score: number
  ai_feedback?: string | null
  extracted_skills: string[]
  strengths: string[]
  weaknesses: string[]
}

export interface BatchCvScoringRequest {
  job_description: string
  cv_list: Array<{
    application_id?: string
    cv_text: string
    job_id?: string
    customer_id?: string
  }>
}

export interface BatchCvScoringResponse {
  results: CvScoringResult[]
  top_count: number
}

export interface TrackInteractionRequest {
  customer_id: string
  job_id: string
  interaction_type: 'VIEW' | 'CLICK' | 'SAVE' | 'APPLY' | string
}

export const predictSalaryApi = async (
  data: SalaryPredictRequest,
): Promise<SalaryPredictResponse> => {
  const res = await axios.post('/api/v1/analytics/salary/predict', data)
  return unwrapFastApi<SalaryPredictResponse>(res)
}

export const getTrendApi = async (data: TrendRequest): Promise<TrendResponse> => {
  const res = await axios.post('/api/v1/analytics/trend', data)
  return unwrapFastApi<TrendResponse>(res)
}

export const scoreCvApi = (data: CvScoringRequest): Promise<ApiResponse<CvScoringResult>> => {
  return axios.post('/api/v1/cv/score', data)
}

export const scoreCvBatchApi = (
  data: BatchCvScoringRequest,
  topN = 10,
): Promise<ApiResponse<BatchCvScoringResponse>> => {
  return axios.post(`/api/v1/cv/score/batch?top_n=${topN}`, data)
}

export const getCvAnalysesApi = (jobId: string): Promise<ApiResponse<CvScoringResult[]>> => {
  return axios.get(`/api/v1/cv/analyses/${jobId}`)
}

export const getJobRecommendationsApi = (data: { cv_text: string; customer_id?: string }): Promise<ApiResponse<IJob[]>> => {
  return axios.post('/api/v1/cv/recommendations', data)
}

export const trackJobInteractionApi = async (
  data: TrackInteractionRequest,
): Promise<{ status: string }> => {
  const res = await axios.post('/api/v1/cv/track', data)
  return unwrapFastApi<{ status: string }>(res)
}
