import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storeApi } from '../services/storeApi';

export const fetchProducts = createAsyncThunk('store/fetchProducts', async (params, { rejectWithValue }) => {
  try {
    return await storeApi.getAll(params);
  } catch (err) {
    return rejectWithValue(err);
  }
});

const storeSlice = createSlice({
  name: 'store',
  initialState: {
    products: [],
    cart: [],
    loading: false,
    error: null,
  },
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existing = state.cart.find((c) => c._id === item._id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        state.cart.push({ ...item, quantity: 1 });
      }
    },
    updateCartQty: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cart.find((c) => c._id === id);
      if (item) {
        item.quantity = Math.max(1, quantity);
      }
    },
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter((item) => item._id !== action.payload);
    },
    clearCart: (state) => {
      state.cart = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message;
        state.products = [];
      });
  },
});

export const { addToCart, updateCartQty, removeFromCart, clearCart } = storeSlice.actions;
export default storeSlice.reducer;