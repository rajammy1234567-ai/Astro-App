import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Linking } from 'react-native';
import RemoteImage from '../common/RemoteImage';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { DRAWER_MENU } from '../../constants/mockData';
import { COLORS } from '../../constants/colors';
import { formatPhone } from '../../utils/formatters';

const isRouteActive = (pathname, route) => {
  if (!route) return false;
  const normalized = route.replace('/(tabs)/', '/');
  if (pathname === route || pathname === normalized) return true;
  if (route !== '/(tabs)/home' && pathname.startsWith(route.replace('/(tabs)', ''))) return true;
  return false;
};

export default function DrawerMenu({ visible, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const user = useSelector((s) => s.auth.user);

  const displayName = user?.name || 'Guest User';
  const displayPhone = user?.phone
    ? formatPhone(user.phone)
    : user?.email || 'Login to continue';
  const avatar = user?.avatar || null;

  const navigate = (route) => {
    onClose();
    if (route) router.push(route);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.drawer, { paddingTop: insets.top + 12 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <TouchableOpacity
            style={styles.profileHeader}
            onPress={() => navigate('/profile')}
            activeOpacity={0.8}
          >
            <RemoteImage uri={avatar} type="avatar" style={styles.avatar} fallbackIcon="person" iconSize={22} />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
                <Ionicons name="create-outline" size={16} color={COLORS.textLight} />
              </View>
              <Text style={styles.phone}>{displayPhone}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={26} color={COLORS.text} />
            </TouchableOpacity>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.menuScroll}>
            {DRAWER_MENU.map((item) => {
              const active = isRouteActive(pathname, item.route);
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  onPress={() => navigate(item.route)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={active ? COLORS.primaryDark : COLORS.textSecondary}
                  />
                  <Text style={[styles.menuText, active && styles.menuTextActive]}>{item.label}</Text>
                  {item.badge && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.alsoText}>Also available on</Text>
            <View style={styles.socialRow}>
              {[
                { icon: 'logo-youtube', url: 'https://youtube.com' },
                { icon: 'logo-facebook', url: 'https://facebook.com' },
                { icon: 'logo-instagram', url: 'https://instagram.com' },
                { icon: 'logo-linkedin', url: 'https://linkedin.com' },
              ].map(({ icon, url }) => (
                <TouchableOpacity key={icon} onPress={() => Linking.openURL(url)}>
                  <Ionicons name={icon} size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.version}>Version 1.1.504</Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, flexDirection: 'row' },
  drawer: { width: '84%', backgroundColor: COLORS.surface, height: '100%' },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  phone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  menuScroll: { flex: 1 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 16, gap: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  menuItemActive: { backgroundColor: COLORS.primaryLight },
  menuText: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' },
  menuTextActive: { color: COLORS.text, fontWeight: '700' },
  newBadge: {
    backgroundColor: COLORS.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  alsoText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
  socialRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  version: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
});