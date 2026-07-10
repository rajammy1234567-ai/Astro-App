import { Image, StyleSheet } from 'react-native';

const logo = require('../../assets/images/icon.png');

export default function AppLogo({ size = 88, style }) {
  return (
    <Image
      source={logo}
      style={[
        styles.logo,
        { width: size, height: size, borderRadius: Math.round(size * 0.22) },
        style,
      ]}
      resizeMode="cover"
      accessibilityLabel="AstroTalk"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: '#1E1033',
  },
});
