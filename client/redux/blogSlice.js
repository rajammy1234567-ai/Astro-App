import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { blogApi } from '../services/blogApi';

export const fetchBlogs = createAsyncThunk('blog/fetchAll', async (params) => {
  return blogApi.getAll(params);
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
        state.list = action.payload;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default blogSlice.reducer;