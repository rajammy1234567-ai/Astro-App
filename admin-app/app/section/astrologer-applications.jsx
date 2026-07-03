import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { StatusBadge } from '../../components/admin/SectionList';
import { normalizeAdminList, rowKey } from '../../utils/normalizeList';
import { colors } from '../../constants/theme';

const FILTERS = ['all', 'pending', 'interview_scheduled', 'selected', 'rejected'];
const STATUS_LABEL = {
  pending: 'Pending',
  interview_scheduled: 'Interview Scheduled',
  selected: 'Selected',
  rejected: 'Rejected',
};
const STATUS_VARIANT = {
  pending: 'warning', interview_scheduled: 'info', selected: 'success', rejected: 'error',
};

export default function AstrologerApplicationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [interviewForm, setInterviewForm] = useState({
    date: '', day: '', time: '', googleMeetLink: '', notes: '',
  });
  const [approveForm, setApproveForm] = useState({ pricePerMin: '20', password: '', adminNotes: '' });
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.get('/astrologer-applications');
      setItems(normalizeAdminList(data));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  const openModal = (type, row) => {
    setSelected(row);
    setError('');
    setModal(type);
    if (type === 'interview') {
      setInterviewForm({
        date: row.interview?.date || '',
        day: row.interview?.day || '',
        time: row.interview?.time || '',
        googleMeetLink: row.interview?.googleMeetLink || '',
        notes: row.interview?.notes || '',
      });
    }
    if (type === 'approve') setApproveForm({ pricePerMin: '20', password: '', adminNotes: '' });
    if (type === 'reject') setRejectReason('');
  };

  const closeModal = () => { setModal(null); setSelected(null); setError(''); };

  const handleSchedule = async () => {
    if (!interviewForm.date || !interviewForm.googleMeetLink) {
      setError('Date and Google Meet link required');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/astrologer-applications/${selected._id}/schedule-interview`, interviewForm);
      closeModal();
      load();
    } catch (err) {
      setError(err.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await api.put(`/astrologer-applications/${selected._id}/approve`, {
        ...approveForm,
        pricePerMin: Number(approveForm.pricePerMin) || 20,
      });
      closeModal();
      load();
      Alert.alert('Approved', 'Panel credentials sent to user. Now publish from Astrologers page.');
    } catch (err) {
      setError(err.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    setSaving(true);
    try {
      await api.put(`/astrologer-applications/${selected._id}/reject`, { reason: rejectReason });
      closeModal();
      load();
    } catch (err) {
      setError(err.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>📋 Applications</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filter === s && styles.filterActive]}
            onPress={() => setFilter(s)}
          >
            <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => rowKey(item, index)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No applications</Text>}
          renderItem={({ item }) => {
            if (!item) return null;
            return (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name || 'Applicant'}</Text>
              <Text style={styles.sub}>{item.phone} · {item.specialty} · {item.experience || 0} yrs</Text>
              <Text style={styles.sub}>{(item.languages || []).join(', ')}</Text>
              <StatusBadge text={STATUS_LABEL[item.status] || item.status} variant={STATUS_VARIANT[item.status]} />
              {item.status === 'selected' && item.panelCredentials && (
                <Text style={styles.cred}>Panel ID: {item.panelCredentials.loginId}</Text>
              )}
              {item.status !== 'selected' && item.status !== 'rejected' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.btnOutline} onPress={() => openModal('interview', item)}>
                    <Text style={styles.btnOutlineText}>Interview</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => openModal('approve', item)}>
                    <Text style={styles.btnPrimaryText}>Select</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnDanger} onPress={() => openModal('reject', item)}>
                    <Text style={styles.btnDangerText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            );
          }}
        />
      )}

      <Modal visible={modal === 'interview'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCard}>
            <Text style={styles.modalTitle}>Schedule Interview</Text>
            <Text style={styles.sub}>Applicant: {selected?.name}</Text>
            {['date', 'day', 'time', 'googleMeetLink', 'notes'].map((key) => (
              <TextInput
                key={key}
                style={styles.input}
                placeholder={key === 'googleMeetLink' ? 'Google Meet Link' : key}
                placeholderTextColor={colors.textMuted}
                value={interviewForm[key]}
                onChangeText={(v) => setInterviewForm({ ...interviewForm, [key]: v })}
              />
            ))}
            {!!error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSchedule} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Send to User'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={modal === 'approve'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCard}>
            <Text style={styles.modalTitle}>Approve & Create Panel</Text>
            <Text style={styles.sub}>Login ID: {selected?.phone}</Text>
            <TextInput style={styles.input} placeholder="Password (auto if empty)" placeholderTextColor={colors.textMuted} value={approveForm.password} onChangeText={(v) => setApproveForm({ ...approveForm, password: v })} secureTextEntry />
            <TextInput style={styles.input} placeholder="Price per min" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={approveForm.pricePerMin} onChangeText={(v) => setApproveForm({ ...approveForm, pricePerMin: v })} />
            <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Admin notes" placeholderTextColor={colors.textMuted} multiline value={approveForm.adminNotes} onChangeText={(v) => setApproveForm({ ...approveForm, adminNotes: v })} />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleApprove} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Creating...' : 'Approve'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={modal === 'reject'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Application</Text>
            <TextInput style={[styles.input, { minHeight: 80 }]} placeholder="Reason (optional)" placeholderTextColor={colors.textMuted} multiline value={rejectReason} onChangeText={setRejectReason} />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.danger }]} onPress={handleReject} disabled={saving}>
                <Text style={[styles.saveText, { color: '#fff' }]}>{saving ? 'Rejecting...' : 'Reject'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  back: { color: colors.primary, fontSize: 16 },
  heading: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text },
  filters: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, color: colors.textMuted },
  filterTextActive: { color: '#0f172a', fontWeight: '700' },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  cred: { fontSize: 12, color: colors.success, marginTop: 8, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btnOutline: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  btnOutlineText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  btnPrimary: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary },
  btnPrimaryText: { color: '#0f172a', fontSize: 12, fontWeight: '700' },
  btnDanger: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.danger },
  btnDangerText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, color: colors.text, marginBottom: 10 },
  error: { color: colors.danger, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { color: colors.textMuted },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  saveText: { color: '#0f172a', fontWeight: '700' },
});