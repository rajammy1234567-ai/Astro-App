import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storeApi } from '../services/storeApi';
import { loadCartFromStorage } from './cartPersist';

export const fetchProducts = createAsyncThunk('store/fetchProducts', async (params, { rejectWithValue }) => {
  try {
    return await storeApi.getAll(params);
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const hydrateCart = createAsyncThunk('store/hydrateCart', async () => {
  return loadCartFromStorage();
});

const getCartQty = (item) => item?.quantity || 1;

const storeSlice = createSlice({
  name: 'store',
  initialState: {
    products: [],
    cart: [],
    cartLoaded: false,
    loading: false,
    error: null,
  },
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      if (!item?._id || item.stock <= 0) return;

      const existing = state.cart.find((c) => c._id === item._id);
      const nextQty = existing ? getCartQty(existing) + 1 : 1;
      if (nextQty > item.stock) return;

      if (existing) {
        existing.quantity = nextQty;
        existing.stock = item.stock;
        existing.price = item.price;
      } else {
        state.cart.push({ ...item, quantity: 1 });
      }
    },
    updateCartQty: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cart.find((c) => c._id === id);
      if (!item) return;

      const maxStock = item.stock ?? 999;
      item.quantity = Math.max(1, Math.min(quantity, maxStock));
    },
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter((item) => item._id !== action.payload);
    },
    clearCart: (state) => {
      state.cart = [];
    },
    setCart: (state, action) => {
      state.cart = Array.isArray(action.payload) ? action.payload : [];
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
      })
      .addCase(hydrateCart.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.cartLoaded = true;
      })
      .addCase(hydrateCart.rejected, (state) => {
        state.cartLoaded = true;
      });
  },
});

export const { addToCart, updateCartQty, removeFromCart, clearCart, setCart } = storeSlice.actions;

export const selectCartCount = (state) =>
  state.store.cart.reduce((sum, item) => sum + getCartQty(item), 0);

export const canAddToCart = (cart, product) => {
  if (!product || product.stock <= 0) {
    return { ok: false, message: 'Product is out of stock.' };
  }
  const existing = cart.find((c) => c._id === product._id);
  const nextQty = existing ? getCartQty(existing) + 1 : 1;
  if (nextQty > product.stock) {
    return { ok: false, message: `Only ${product.stock} left in stock.` };
  }
  return { ok: true };
};

export default storeSlice.reducer;