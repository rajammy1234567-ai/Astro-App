import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';

/** Live feature removed — redirect home */
export default function LiveListRemoved() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/home');
  }, [router]);
  return (
    <View style={styles.box}>
      <Text style={styles.txt}>Live streaming is not available yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream },
  txt: { color: COLORS.textSecondary, fontWeight: '600' },
});
