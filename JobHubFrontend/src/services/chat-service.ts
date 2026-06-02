import axios from './axios-customize'
import type { ApiResponse } from '../types/common'

export interface IConversationDto {
  id: string
  participantA: string
  participantB: string
  lastMessageContent: string | null
  lastMessageAt: string | null
  createdAt: string
  unreadCount: number
  // Client-side computed properties
  displayName?: string
  displayAvatar?: string
}

export interface IMessageDto {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: string
  isRead: boolean
  createdAt: string
}

/** Lấy danh sách cuộc hội thoại của user hiện tại */
export const getConversationsApi = (): Promise<ApiResponse<IConversationDto[]>> =>
  axios.get('/api/v1/chat/conversations')

/** Lấy lịch sử chat của cuộc hội thoại (hỗ trợ phân trang) */
export const getChatHistoryApi = (
  conversationId: string,
  limit: number = 50,
  before?: string
): Promise<ApiResponse<IMessageDto[]>> => {
  const query = `limit=${limit}` + (before ? `&before=${encodeURIComponent(before)}` : '')
  return axios.get(`/api/v1/chat/conversations/${conversationId}/messages?${query}`)
}

/** Lấy hoặc tạo cuộc hội thoại mới giữa 2 người dùng */
export const getOrCreateConversationApi = (
  otherParticipantId: string
): Promise<ApiResponse<IConversationDto>> =>
  axios.post('/api/v1/chat/conversations/get-or-create', { otherParticipantId })

/** Gửi tin nhắn qua HTTP POST (cho fallback hoặc gửi file) */
export const sendChatMessageApi = (
  receiverId: string,
  content: string,
  type: string = 'text'
): Promise<ApiResponse<IMessageDto>> =>
  axios.post('/api/v1/chat/messages', { receiverId, content, type })
