import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOBILE_MAX_WIDTH, isWeb } from '../../utils/platform';
import { COLORS } from '../../constants/colors';

export default function WebShell({ children }) {
  if (!isWeb) {
    return children;
  }

  return (
    <SafeAreaView style={styles.webRoot} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.phoneFrame}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    width: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: MOBILE_MAX_WIDTH,
    backgroundColor: COLORS.cream,
    overflow: 'hidden',
    boxShadow: '0 0 24px rgba(0,0,0,0.12)',
  },
});