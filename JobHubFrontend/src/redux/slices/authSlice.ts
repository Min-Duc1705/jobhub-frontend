import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { loginApi, registerApi, getAccountApi, logoutApi } from '../../services/auth-service';
import type { LoginRequest, RegisterRequest, User, LoginResponse, ApiResponse } from '../../types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  avatarUrl: string | null;  // avatar từ ProfileService (tách biệt với User)
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,
  avatarUrl: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (loginData: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await loginApi(loginData);
      if (response && response.data) {
        if (response.data.accessToken) {
          localStorage.setItem('access_token', response.data.accessToken);
        }
        return response;
      }
      return rejectWithValue('Đăng nhập thất bại.');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Đăng nhập thất bại.';
      return rejectWithValue(errMsg);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (registerData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await registerApi(registerData);
      return response;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Đăng ký thất bại.';
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchAccount = createAsyncThunk(
  'auth/fetchAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAccountApi();
      return response;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Không thể lấy thông tin tài khoản.';
      return rejectWithValue(errMsg);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      dispatch(clearAuth());
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.avatarUrl = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload);
    },
    setAvatarUrl: (state, action: PayloadAction<string | null>) => {
      state.avatarUrl = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<ApiResponse<LoginResponse>>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.data.accessToken || null;
        state.user = action.payload.data.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Account
      .addCase(fetchAccount.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAccount.fulfilled, (state, action: PayloadAction<ApiResponse<LoginResponse>>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.accessToken || state.accessToken;
      })
      .addCase(fetchAccount.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuth, setToken, setAvatarUrl } = authSlice.actions;
export default authSlice.reducer;
