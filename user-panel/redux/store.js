import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import astrologerReducer from './astrologerSlice';
import walletReducer from './walletSlice';
import blogReducer from './blogSlice';
import storeReducer from './storeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    astrologer: astrologerReducer,
    wallet: walletReducer,
    blog: blogReducer,
    store: storeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});