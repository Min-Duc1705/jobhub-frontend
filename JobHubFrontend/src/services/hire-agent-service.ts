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
}

export interface IHireAgentConversation {
  id: string
  campaignId: string
  conversationId: string
  candidateId: string
  cvText: string
  status: 'Screening' | 'Passed' | 'Failed' | 'Scheduled'
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

/** Schedule a candidate interview for a campaign */
export const scheduleInterviewApi = (campaignId: string, interviewDate: string): Promise<ApiResponse<IHireAgentConversation>> =>
  axios.post(`/api/v1/hire-agent/campaigns/${campaignId}/schedule`, { interviewDate })

/** Get current candidate's conversation details under a campaign */
export const getMyConversationApi = (campaignId: string): Promise<ApiResponse<IHireAgentConversation>> =>
  axios.get(`/api/v1/hire-agent/campaigns/${campaignId}/my-conversation`)
