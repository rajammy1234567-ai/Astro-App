import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/theme';

/** Live feature removed — redirect to dashboard */
export default function LiveRemovedScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/dashboard');
  }, [router]);

  return (
    <View style={styles.box}>
      <Text style={styles.txt}>Live feature available nahi hai.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream || '#FFFCF8' },
  txt: { color: '#666', fontWeight: '600' },
});
