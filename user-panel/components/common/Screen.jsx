import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

/**
 * Cross-platform screen wrapper with safe area.
 * edges: top/header screens use ['left','right','bottom']; tabs use ['left','right']; auth uses all.
 */
export default function Screen({
  children,
  edges = ['left', 'right'],
  style,
  backgroundColor = COLORS.cream,
  keyboard = false,
  scroll = false,
  scrollProps,
  contentContainerStyle,
  keyboardOffset = 0,
}) {
  const safe = (
    <SafeAreaView
      style={[styles.screen, { backgroundColor }, style]}
      edges={edges}
    >
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );

  if (!keyboard) return safe;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardOffset}
    >
      {safe}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});