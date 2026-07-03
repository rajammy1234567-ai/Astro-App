import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { astrologerApi } from '../services/astrologerApi';

export const fetchAstrologers = createAsyncThunk('astrologer/fetchAll', async (params) => {
  return astrologerApi.getAll(params);
});

export const fetchAstrologerById = createAsyncThunk('astrologer/fetchById', async (id) => {
  return astrologerApi.getById(id);
});

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
        state.list = action.payload;
      })
      .addCase(fetchAstrologers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchAstrologerById.fulfilled, (state, action) => {
        state.selected = action.payload;
      });
  },
});

export const { clearSelected } = astrologerSlice.actions;
export default astrologerSlice.reducer;