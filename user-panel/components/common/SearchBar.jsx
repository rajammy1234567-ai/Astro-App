import { View, TextInput, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search astrologers…',
  style,
  onSubmitEditing,
  onFocus,
  autoFocus = false,
}) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search" size={18} color={COLORS.textLight} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        returnKeyType="search"
        clearButtonMode="while-editing"
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText?.('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    marginHorizontal: 14,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#1E1033',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
    fontWeight: '500',
  },
});
