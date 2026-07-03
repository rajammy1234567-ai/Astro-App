import { View, StyleSheet, Platform } from 'react-native';
import { MOBILE_MAX_WIDTH } from '../../utils/platform';
import { COLORS } from '../../constants/colors';

export default function WebShell({ children }) {
  if (Platform.OS !== 'web') {
    return children;
  }

  return (
    <View style={styles.webRoot}>
      <View style={styles.phoneFrame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: MOBILE_MAX_WIDTH,
    backgroundColor: COLORS.cream,
    overflow: 'hidden',
    // @ts-ignore web shadow
    boxShadow: '0 0 24px rgba(0,0,0,0.12)',
  },
});