import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import RemoteImage from '../../components/common/RemoteImage';
import { useState } from 'react';
import RemedyHeader from '../../components/remedies/RemedyHeader';
import StoreSection from '../../components/home/StoreSection';
import DrawerMenu from '../../components/drawer/DrawerMenu';
import { TOP_SELLING, NEWLY_LAUNCHED } from '../../constants/mockData';
import { IMAGES as IMG } from '../../constants/assets';
import { COLORS } from '../../constants/colors';

function FeaturedCard({ title, image, badge, style }) {
  return (
    <ImageBackground source={{ uri: image }} style={[styles.featuredCard, style]} imageStyle={styles.featuredImg}>
      {badge && (
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>{badge}</Text>
        </View>
      )}
      <View style={styles.featuredOverlay}>
        <Text style={styles.featuredTitle}>{title}</Text>
      </View>
    </ImageBackground>
  );
}

function CircleProduct({ item }) {
  return (
    <TouchableOpacity style={styles.circleItem}>
      <RemoteImage uri={item.image} type="product" style={styles.circleImg} fallbackIcon="sparkles-outline" />
      <Text style={styles.circleLabel} numberOfLines={2}>{item.label}</Text>
    </TouchableOpacity>
  );
}

export default function RemediesScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.container}>
      <RemedyHeader onMenuPress={() => setDrawerOpen(true)} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.featuredRow}>
          <FeaturedCard title="Birth Time Rectification" image={IMG.remedyRectification} style={styles.cardLeft} />
          <FeaturedCard title="Past Life Regression" image={IMG.remedyRegression} style={styles.cardRight} />
        </View>
        <FeaturedCard
          title="Name Correction"
          image={IMG.remedyName}
          badge="STARTS AT INR 499"
          style={styles.cardFull}
        />

        <View style={styles.statsBox}>
          {[
            { num: '4,37,966', label: 'ORDERS' },
            { num: '4.72 ★', label: 'RATING' },
            { num: '7,663', label: 'EXPERTS' },
            { num: '7,603', label: 'IN SESSION' },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <ImageBackground source={{ uri: IMG.remedyRudraksha }} style={styles.rudrakshaBanner} imageStyle={{ borderRadius: 12 }}>
          <View style={styles.rudrakshaOverlay}>
            <Text style={styles.rudrakshaTitle}>Find your Perfect Rudraksha in a 1-on-1 session</Text>
            <Text style={styles.rudrakshaSub}>with our certified Rudraksha Expert at just ₹199/-</Text>
            <TouchableOpacity style={styles.rudrakshaBtn}>
              <Text style={styles.rudrakshaBtnText}>Book your Rudraksha Consultation now</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <StoreSection />

        <View style={styles.trendRow}>
          <ImageBackground source={{ uri: IMG.remedyPooja }} style={styles.trendCard}>
            <View style={styles.trendRibbon}><Text style={styles.ribbonText}>TRENDING</Text></View>
            <Text style={styles.trendTitle}>Pooja</Text>
          </ImageBackground>
          <ImageBackground source={{ uri: IMG.remedyCombo }} style={styles.trendCard}>
            <View style={styles.offerRibbon}><Text style={styles.ribbonText}>GET 2 @ INR 1100</Text></View>
            <Text style={styles.trendTitle}>Problem Solving Remedy Combos</Text>
          </ImageBackground>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Top Selling</Text>
            <Text style={styles.viewAll}>View All</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.circleScroll}>
            {TOP_SELLING.map((item) => <CircleProduct key={item.id} item={item} />)}
          </ScrollView>
        </View>

        <View style={[styles.section, { backgroundColor: COLORS.yellowLight, paddingBottom: 24 }]}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Newly Launched</Text>
            <Text style={styles.viewAll}>View All</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.circleScroll}>
            {NEWLY_LAUNCHED.map((item) => <CircleProduct key={item.id} item={item} />)}
          </ScrollView>
        </View>
      </ScrollView>

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  featuredRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 10, marginTop: 12 },
  cardLeft: { flex: 1, height: 160 },
  cardRight: { flex: 1, height: 160 },
  cardFull: { height: 160, marginHorizontal: 14, marginTop: 10 },
  featuredCard: { borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end' },
  featuredImg: { borderRadius: 10 },
  featuredOverlay: { backgroundColor: 'rgba(0,0,0,0.45)', padding: 12 },
  featuredTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  priceBadge: {
    position: 'absolute', top: 10, left: 10, zIndex: 2,
    backgroundColor: COLORS.error, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  priceBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  statsBox: {
    flexDirection: 'row', marginHorizontal: 14, marginTop: 14,
    backgroundColor: COLORS.yellowLight, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 9, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
  rudrakshaBanner: { marginHorizontal: 14, marginTop: 14, borderRadius: 12, overflow: 'hidden', minHeight: 140 },
  rudrakshaOverlay: { backgroundColor: 'rgba(255,250,240,0.92)', padding: 16 },
  rudrakshaTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, lineHeight: 22 },
  rudrakshaSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  rudrakshaBtn: {
    backgroundColor: '#5D4037', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginTop: 10, alignSelf: 'flex-start',
  },
  rudrakshaBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  trendRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, marginTop: 14 },
  trendCard: { flex: 1, height: 140, borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end', padding: 10 },
  trendRibbon: { position: 'absolute', top: 8, left: 8, backgroundColor: '#E91E63', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3 },
  offerRibbon: { position: 'absolute', top: 8, left: 8, right: 8, backgroundColor: COLORS.error, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 3 },
  ribbonText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  trendTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', textShadowColor: '#000', textShadowRadius: 4 },
  section: { marginTop: 14, paddingTop: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  viewAll: { fontSize: 13, color: COLORS.link, fontWeight: '600' },
  circleScroll: { paddingHorizontal: 14, gap: 14 },
  circleItem: { alignItems: 'center', width: 90 },
  circleImg: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.border },
  circleLabel: { fontSize: 10, fontWeight: '600', color: COLORS.text, textAlign: 'center', marginTop: 6, lineHeight: 13 },
});