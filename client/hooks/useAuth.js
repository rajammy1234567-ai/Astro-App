import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { sendOtp, verifyOtp, logout, clearError, restoreSession } from '../redux/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  return {
    ...auth,
    sendOtp: useCallback((payload) => dispatch(sendOtp(payload)), [dispatch]),
    verifyOtp: useCallback((payload) => dispatch(verifyOtp(payload)), [dispatch]),
    logout: useCallback(() => dispatch(logout()), [dispatch]),
    clearError: useCallback(() => dispatch(clearError()), [dispatch]),
    restoreSession: useCallback(() => dispatch(restoreSession()), [dispatch]),
  };
};