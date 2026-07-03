import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { hydrateCart } from '../../redux/storeSlice';
import { COLORS } from '../../constants/colors';

export default function AuthBootstrap({ children }) {
  const dispatch = useDispatch();
  const { initialized, restoreSession } = useAuth();

  useEffect(() => {
    restoreSession();
    dispatch(hydrateCart());
  }, [restoreSession, dispatch]);

  if (!initialized) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
});