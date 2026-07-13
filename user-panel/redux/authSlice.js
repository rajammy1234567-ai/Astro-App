import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../services/authApi';
import { storage } from '../utils/storage';

const persistAuth = async (response) => {
  if (!response?.token) {
    throw { message: 'Server did not return a token. Please try again.' };
  }
  try {
    await storage.set('token', response.token);
    if (response.user) {
      await storage.set('user', response.user);
    }
  } catch (e) {
    // Still allow login if storage fails (private mode / quota)
    console.warn('persistAuth storage warning', e?.message);
  }
  return response;
};

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.register(payload);
    return await persistAuth(data);
  } catch (err) {
    return rejectWithValue({
      message: err?.message || 'Could not create account',
      networkError: !!err?.networkError,
      status: err?.status,
    });
  }
});

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.login(payload);
    return await persistAuth(data);
  } catch (err) {
    return rejectWithValue({
      message: err?.message || 'Login failed',
      networkError: !!err?.networkError,
      status: err?.status,
    });
  }
});

export const sendOtp = createAsyncThunk('auth/sendOtp', async (payload, { rejectWithValue }) => {
  try {
    return await authApi.sendOtp(payload);
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async (payload, { rejectWithValue }) => {
  try {
    return await persistAuth(await authApi.verifyOtp(payload));
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
  try {
    const token = await storage.get('token');
    if (!token) {
      return { user: null, token: null };
    }

    try {
      const user = await authApi.getMe();
      await storage.set('user', user);
      return { user, token };
    } catch {
      await storage.remove('token');
      await storage.remove('user');
      return { user: null, token: null };
    }
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } catch {
    // logout locally even if API fails
  }
  await storage.remove('token');
  await storage.remove('user');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    sessionLoading: false,
    otpSending: false,
    verifying: false,
    authLoading: false,
    error: null,
    otpSent: false,
    initialized: false,
    isNewUser: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      // Persist so profile edits (name/avatar/DOB) survive app restart
      if (action.payload) {
        storage.set('user', action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.sessionLoading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.sessionLoading = false;
        state.initialized = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.sessionLoading = false;
        state.initialized = true;
        state.user = null;
        state.token = null;
      })
      .addCase(register.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.authLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isNewUser = !!action.payload.isNewUser;
      })
      .addCase(register.rejected, (state, action) => {
        state.authLoading = false;
        state.error = action.payload?.message || 'Registration failed';
      })
      .addCase(login.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.authLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isNewUser = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.authLoading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      .addCase(sendOtp.pending, (state) => {
        state.otpSending = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.otpSending = false;
        state.otpSent = true;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.otpSending = false;
        state.error = action.payload?.message || 'OTP send failed';
      })
      .addCase(verifyOtp.pending, (state) => {
        state.verifying = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.verifying = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isNewUser = !!action.payload.isNewUser;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.verifying = false;
        state.error = action.payload?.message || 'OTP verification failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.otpSent = false;
        state.isNewUser = false;
      });
  },
});

export const selectIsAuthenticated = (state) => !!(state.auth.user && state.auth.token);

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;