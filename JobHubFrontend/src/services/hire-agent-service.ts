import axios from './axios-customize'
import type { ApiResponse } from '../types/common'

export interface IHireAgentCampaign {
  id: string
  jobId: string
  jobName: string
  jobDescription: string
  recruiterId: string
  targetCount: number
  status: 'Active' | 'Paused' | 'Completed'
  createdAt: string
  interviewDate?: string
  backupInterviewDate?: string
}

export interface IHireAgentConversation {
  id: string
  campaignId: string
  conversationId: string
  candidateId: string
  cvText: string
  status: 'Screening' | 'Passed' | 'PendingCandidateConfirm' | 'Failed' | 'Scheduled'
  matchingScore?: number
  lastQuestionAt: string
  createdAt: string
  candidateName?: string
  interviewDate?: string
}

export interface ICreateCampaignRequest {
  jobId: string
  jobName: string
  jobDescription: string
  targetCount: number
  jobLocation?: string   // Tỉnh/thành phố job (VD: "Hồ Chí Minh")
  jobType?: string       // REMOTE / HYBRID / FULL_TIME / PART_TIME / INTERNSHIP
  interviewDate?: string
  backupInterviewDate?: string
}

/** Create automatic recruitment campaign for a job */
export const createCampaignApi = (data: ICreateCampaignRequest): Promise<ApiResponse<IHireAgentCampaign>> =>
  axios.post('/api/v1/hire-agent/campaigns', data)

/** Get active campaigns for the recruiter */
export const getCampaignsApi = (): Promise<ApiResponse<IHireAgentCampaign[]>> =>
  axios.get('/api/v1/hire-agent/campaigns')

/** Get screening candidate chats under a campaign */
export const getCampaignConversationsApi = (campaignId: string): Promise<ApiResponse<IHireAgentConversation[]>> =>
  axios.get(`/api/v1/hire-agent/campaigns/${campaignId}/conversations`)

/** Get campaign details by ID */
export const getCampaignByIdApi = (campaignId: string): Promise<ApiResponse<IHireAgentCampaign>> =>
  axios.get(`/api/v1/hire-agent/campaigns/${campaignId}`)

/** HR đặt lịch đề xuất phỏng vấn cho một candidate cụ thể */
export const scheduleInterviewApi = (campaignId: string, candidateId: string, interviewDate: string): Promise<ApiResponse<IHireAgentConversation>> =>
  axios.post(`/api/v1/hire-agent/campaigns/${campaignId}/schedule`, { candidateId, interviewDate })

/** Candidate xác nhận đồng ý lịch HR đề xuất */
export const confirmInterviewApi = (campaignId: string): Promise<ApiResponse<IHireAgentConversation>> =>
  axios.post(`/api/v1/hire-agent/campaigns/${campaignId}/confirm`)

/** Candidate đề xuất đổi lịch phỏng vấn */
export const proposeRescheduleApi = (campaignId: string, message?: string): Promise<ApiResponse<IHireAgentConversation>> =>
  axios.post(`/api/v1/hire-agent/campaigns/${campaignId}/propose-reschedule`, { message })

/** Get current candidate's conversation details under a campaign */
export const getMyConversationApi = (campaignId: string): Promise<ApiResponse<IHireAgentConversation>> =>
  axios.get(`/api/v1/hire-agent/campaigns/${campaignId}/my-conversation`)
