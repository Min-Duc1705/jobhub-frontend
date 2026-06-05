import axios from 'axios';
import type {
  AssistantChatRequest,
  AssistantChatResponse,
} from '../types/assistant';

export type {
  AssistantMessage,
  ActionItem,
  AssistantChatResponse,
  AssistantChatRequest,
  AssistantConfirmRequest,
} from '../types/assistant';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

const getHeaders = (sessionId?: string) => ({
  Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
  'Content-Type': 'application/json',
  ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
});

export const sendAssistantMessage = async (
  payload: AssistantChatRequest,
  sessionId: string
): Promise<AssistantChatResponse> => {
  const response = await axios.post(
    `${API_BASE}/api/v1/assistant/chat`,
    payload,
    { headers: getHeaders(sessionId), timeout: 60000 }
  );
  return response.data;
};

export const uploadFileToAssistant = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(
    `${API_BASE}/api/v1/assistant/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    }
  );
  return response.data;
};

export const confirmAssistantAction = async (
  actionType: string,
  payload: any,
  sessionId: string
): Promise<any> => {
  const response = await axios.post(
    `${API_BASE}/api/v1/assistant/confirm-action`,
    { action_type: actionType, payload, confirmed: true },
    { headers: getHeaders(sessionId), timeout: 30000 }
  );
  return response.data;
};

export const clearAssistantSession = async (sessionId: string): Promise<void> => {
  await axios.delete(`${API_BASE}/api/v1/assistant/session`, {
    headers: getHeaders(sessionId),
  });
};

export const importFileToAssistant = async (
  file: File,
  importType: 'users' | 'skills' | 'companies' | 'jobs'
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(
    `${API_BASE}/api/v1/assistant/import?import_type=${importType}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
    }
  );
  return response.data;
};
