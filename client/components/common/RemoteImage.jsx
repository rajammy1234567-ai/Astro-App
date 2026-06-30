import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getDefaultImage } from '../../constants/assets';

export default function RemoteImage({
  uri,
  style,
  type = 'general',
  fallbackIcon = 'image-outline',
  contentFit = 'cover',
  iconSize = 28,
}) {
  const [failed, setFailed] = useState(false);
  const resolvedUri = uri && !failed ? uri : getDefaultImage(type);

  if (!resolvedUri) {
    return (
      <View style={[styles.fallback, style]}>
        <Ionicons name={fallbackIcon} size={iconSize} color={COLORS.textLight} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={style}
      contentFit={contentFit}
      onError={() => setFailed(true)}
      transition={200}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});