import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

const fmt = (n) => `₹${n || 0}`;

export function getItemLabel(item) {
  try {
    if (item == null) return 'Unknown';
    const id = item._id ?? item.id;
    const idSuffix = id != null ? String(id).slice(-6) : '';
    return (
      item.name
      || item.title
      || item.code
      || item.question
      || item.orderType
      || idSuffix
      || 'Item'
    );
  } catch {
    return 'Unknown';
  }
}

export function getItemSub(sectionId, item) {
  try {
    if (item == null) return '';
    if (sectionId === 'users') {
      const verified = item.isVerified ? 'Verified' : 'Pending';
      return `${item.phone || '-'} · Wallet ${fmt(item.balance)} · ${verified}`;
    }
    if (sectionId === 'astrologers') {
      const live = item.isPublished && item.approvedViaApplication ? 'Live' : 'Hidden';
      const approved = item.approvedViaApplication ? '✓ Approved' : 'Not approved';
      const online = item.isOnline ? 'Online' : 'Offline';
      return `Panel ${item.phone || '-'} · ${item.specialty || '-'} · ₹${item.pricePerMin}/min · ${live} · ${online} · ${approved}`;
    }
    if (sectionId === 'products') {
      const flags = [
        item.isFeatured ? '🔥 Top' : null,
        item.isNewLaunch ? '✨ New' : null,
        item.isActive ? 'Live' : 'Hidden',
      ].filter(Boolean).join(' · ');
      return `${item.category || '-'} · ${fmt(item.price)} · Stock ${item.stock ?? 0}${flags ? ` · ${flags}` : ''}`;
    }
    if (sectionId === 'orders') {
      const detail = item.orderType === 'pooja' ? item.poojaName : `${item.products?.length || 0} items`;
      const userName = item.user && typeof item.user === 'object' ? (item.user.name || 'User') : 'User';
      return `${userName} · ${detail} · ${fmt(item.totalAmount)} · ${item.status || '-'}`;
    }
    if (sectionId === 'transactions') {
      const sign = item.type === 'credit' ? '+' : '-';
      const userName = item.user && typeof item.user === 'object' ? (item.user.name || '-') : '-';
      return `${userName} · ${sign}${fmt(item.amount)} · ${item.status || '-'}`;
    }
    if (sectionId === 'blogs') return `${item.author || '-'} · ${item.category || ''}`;
    if (sectionId === 'news') return item.source || '-';
    if (sectionId === 'poojas') return `${item.duration || '-'} · ${fmt(item.price)}`;
    if (sectionId === 'testimonials') return `${item.location || '-'} · ⭐ ${item.rating || 5}`;
    if (sectionId === 'support-faqs') return item.category || 'general';
    if (sectionId === 'free-services') return item.route || '-';
    if (sectionId === 'gift-cards') {
      const redeemedName = item.redeemedBy && typeof item.redeemedBy === 'object' ? item.redeemedBy.name : null;
      const status = item.isRedeemed
        ? `Redeemed${redeemedName ? ` by ${redeemedName}` : ''}`
        : 'Active';
      return `${fmt(item.amount)} · ${status}`;
    }
    if (item.phone) return item.phone;
    if (item.status) return item.status;
    return '';
  } catch {
    return '';
  }
}

export function StatusBadge({ text, variant = 'default' }) {
  const bg = { default: colors.border, success: '#166534', warning: '#b45309', error: '#991b1b', info: '#1d4ed8' };
  return (
    <View style={[styles.badge, { backgroundColor: bg[variant] || bg.default }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
});