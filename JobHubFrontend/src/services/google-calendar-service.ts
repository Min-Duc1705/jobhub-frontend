import axios from './axios-customize';
import type { ApiResponse } from '../types/common';

export interface IGoogleCalendarStatus {
  isConnected: boolean;
  email: string;
}

export const getGoogleCalendarStatusApi = (): Promise<ApiResponse<IGoogleCalendarStatus>> =>
  axios.get('/api/v1/google-calendar/status');

export const getGoogleCalendarAuthUrlApi = (origin?: string): Promise<ApiResponse<{ url: string }>> =>
  axios.get(`/api/v1/google-calendar/auth-url${origin ? `?origin=${encodeURIComponent(origin)}` : ''}`);

export const disconnectGoogleCalendarApi = (): Promise<ApiResponse<{ message: string }>> =>
  axios.post('/api/v1/google-calendar/disconnect');

export const syncExistingGoogleCalendarApi = (): Promise<ApiResponse<{ message: string }>> =>
  axios.post('/api/v1/google-calendar/sync-existing');
