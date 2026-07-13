import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { astrologerApi } from '../services/astrologerApi';

export const fetchAstrologers = createAsyncThunk(
  'astrologer/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      return await astrologerApi.getAll(params);
    } catch (err) {
      return rejectWithValue({
        message: err?.message || 'Could not load astrologers',
        networkError: !!err?.networkError,
      });
    }
  }
);

export const fetchAstrologerById = createAsyncThunk(
  'astrologer/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await astrologerApi.getById(id);
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Could not load profile' });
    }
  }
);

const astrologerSlice = createSlice({
  name: 'astrologer',
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAstrologers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAstrologers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchAstrologers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Load failed';
        state.list = [];
      })
      .addCase(fetchAstrologerById.fulfilled, (state, action) => {
        state.selected = action.payload;
      });
  },
});

export const { clearSelected } = astrologerSlice.actions;
export default astrologerSlice.reducer;