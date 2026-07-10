import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { blogApi } from '../services/blogApi';

export const fetchBlogs = createAsyncThunk('blog/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await blogApi.getAll(params);
  } catch (err) {
    return rejectWithValue(err);
  }
});

const blogSlice = createSlice({
  name: 'blog',
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message;
        state.list = [];
      });
  },
});

export default blogSlice.reducer;