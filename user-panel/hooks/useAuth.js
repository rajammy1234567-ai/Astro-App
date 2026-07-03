import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  register,
  login,
  sendOtp,
  verifyOtp,
  logout,
  clearError,
  restoreSession,
  selectIsAuthenticated,
} from '../redux/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return {
    ...auth,
    isAuthenticated,
    register: useCallback((payload) => dispatch(register(payload)), [dispatch]),
    login: useCallback((payload) => dispatch(login(payload)), [dispatch]),
    sendOtp: useCallback((payload) => dispatch(sendOtp(payload)), [dispatch]),
    verifyOtp: useCallback((payload) => dispatch(verifyOtp(payload)), [dispatch]),
    logout: useCallback(() => dispatch(logout()), [dispatch]),
    clearError: useCallback(() => dispatch(clearError()), [dispatch]),
    restoreSession: useCallback(() => dispatch(restoreSession()), [dispatch]),
  };
};