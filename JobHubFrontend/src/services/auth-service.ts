import axios from './axios-customize';
import type {   
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  VerifyEmailRequest, 
  ApiResponse 
} from '../types/auth';

export const loginApi = (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  return axios.post('/api/v1/auth/login', data);
};

export const registerApi = (data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
  return axios.post('/api/v1/auth/register', data);
};

export const verifyEmailApi = (data: VerifyEmailRequest): Promise<ApiResponse<any>> => {
  return axios.post('/api/v1/auth/verify-email', data);
};

export const getAccountApi = (): Promise<ApiResponse<LoginResponse>> => {
  return axios.get('/api/v1/auth/account');
};

export const logoutApi = (): Promise<ApiResponse<any>> => {
  return axios.post('/api/v1/auth/logout');
};

export const resendOtpApi = (email: string, otpType: 'REGISTER' | 'RESET_PASSWORD' = 'REGISTER'): Promise<ApiResponse<any>> => {
  return axios.post(`/api/v1/auth/resend-otp?otpType=${otpType}`, { email });
};

// Dùng chung cho REGISTER lẫn RESET_PASSWORD
export const verifyOtpApi = (
  email: string,
  otpCode: string,
  otpType: 'REGISTER' | 'RESET_PASSWORD' = 'REGISTER'
): Promise<ApiResponse<any>> => {
  return axios.post(`/api/v1/auth/verify-email?otpType=${otpType}`, { email, otpCode })
}

export const resetPasswordApi = (email: string, otpCode: string, newPassword: string): Promise<ApiResponse<any>> => {
  return axios.post('/api/v1/auth/reset-password', { email, otpCode, newPassword });
};

export const updateUsernameApi = (username: string): Promise<ApiResponse<any>> => {
  return axios.put('/api/v1/auth/username', { username });
};
