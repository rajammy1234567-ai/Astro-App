import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { walletApi } from '../services/walletApi';

export const fetchWallet = createAsyncThunk('wallet/fetch', async () => {
  return walletApi.getBalance();
});

export const fetchTransactions = createAsyncThunk('wallet/transactions', async (params) => {
  return walletApi.getTransactions(params);
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: 0,
    transactions: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
      });
  },
});

export default walletSlice.reducer;