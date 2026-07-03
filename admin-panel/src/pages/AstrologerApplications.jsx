import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import api from '../services/api';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_VARIANT = {
  pending: 'warning',
  interview_scheduled: 'info',
  selected: 'success',
  rejected: 'error',
};

const STATUS_LABEL = {
  pending: 'Pending',
  interview_scheduled: 'Interview Scheduled',
  selected: 'Selected',
  rejected: 'Rejected',
};

export default function AstrologerApplications() {
  const { items, loading, error: loadError, refresh } = useCrud('/astrologer-applications');
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [interviewForm, setInterviewForm] = useState({
    date: '', day: '', time: '', googleMeetLink: '', notes: '',
  });
  const [approveForm, setApproveForm] = useState({ pricePerMin: 20, password: '', adminNotes: '' });
  const [rejectReason, setRejectReason] = useState('');

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  const openModal = (type, row) => {
    setSelected(row);
    setFormError('');
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
    if (type === 'approve') setApproveForm({ pricePerMin: 20, password: '', adminNotes: '' });
    if (type === 'reject') setRejectReason('');
  };

  const closeModal = () => { setModal(null); setSelected(null); setFormError(''); };

  const handleSchedule = async (e) => {
    e.preventDefault();
    const link = interviewForm.googleMeetLink?.trim();
    if (!link?.startsWith('http://') && !link?.startsWith('https://')) {
      setFormError('Google Meet link https:// se start hona chahiye');
      toast.error('Valid Google Meet URL required (https://meet.google.com/...)');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.put(`/astrologer-applications/${selected._id}/schedule-interview`, interviewForm);
      closeModal();
      refresh();
      toast.success('Interview scheduled & user notified');
    } catch (err) {
      setFormError(err.message || 'Failed to schedule interview');
      toast.error(err.message || 'Failed to schedule interview');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api.put(`/astrologer-applications/${selected._id}/approve`, approveForm);
      closeModal();
      refresh();
      toast.success('Application approved — panel credentials sent');
    } catch (err) {
      setFormError(err.message || 'Failed to approve');
      toast.error(err.message || 'Failed to approve');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api.put(`/astrologer-applications/${selected._id}/reject`, { reason: rejectReason });
      closeModal();
      refresh();
      toast.success('Application rejected');
    } catch (err) {
      setFormError(err.message || 'Failed to reject');
      toast.error(err.message || 'Failed to reject');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Applicant', render: (r) => (
      <div>
        <strong>{r.name}</strong>
        <div style={{ fontSize: 12, color: '#64748b' }}>{r.phone}</div>
      </div>
    )},
    { key: 'specialty', label: 'Specialty' },
    { key: 'experience', label: 'Exp.', render: (r) => `${r.experience || 0} yrs` },
    { key: 'languages', label: 'Languages', render: (r) => (r.languages || []).join(', ') || '-' },
    { key: 'status', label: 'Status', render: (r) => (
      <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
    )},
    { key: 'createdAt', label: 'Applied', render: (r) => fmtDate(r.createdAt) },
    { key: 'actions', label: 'Actions', width: '220px', render: (r) => (
      <div className="action-btns" style={{ flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
        {r.status !== 'selected' && r.status !== 'rejected' && (
          <>
            <button type="button" className="btn-sm btn-outline" onClick={() => openModal('interview', r)}>Interview</button>
            <button type="button" className="btn-sm btn-primary" onClick={() => openModal('approve', r)}>Select</button>
            <button type="button" className="btn-sm btn-danger" onClick={() => openModal('reject', r)}>Reject</button>
          </>
        )}
        {r.status === 'selected' && r.panelCredentials && (
          <span style={{ fontSize: 12, color: '#166534' }}>ID: {r.panelCredentials.loginId}</span>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Astrologer Applications" subtitle={`${items.length} applications — review, interview & approve`} />
      {loadError && <div className="page-error">⚠️ {loadError} — <button type="button" className="link-btn" onClick={refresh}>Retry</button></div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'pending', 'interview_scheduled', 'selected', 'rejected'].map((s) => (
          <button key={s} type="button" className={filter === s ? 'btn-primary btn-sm' : 'btn-outline btn-sm'} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} />

      <Modal open={modal === 'interview'} title="Schedule Google Meet Interview" onClose={closeModal} wide>
        {selected && (
          <form onSubmit={handleSchedule} className="form-grid">
            <p style={{ gridColumn: '1 / -1', color: '#64748b', margin: 0 }}>Applicant: <strong>{selected.name}</strong> ({selected.phone})</p>
            <div className="form-group"><label>Interview Date *</label><input type="date" required value={interviewForm.date} onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })} /></div>
            <div className="form-group"><label>Day *</label><input required placeholder="Monday" value={interviewForm.day} onChange={(e) => setInterviewForm({ ...interviewForm, day: e.target.value })} /></div>
            <div className="form-group"><label>Time *</label><input required placeholder="10:00 AM" value={interviewForm.time} onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })} /></div>
            <div className="form-group full">
              <label>Google Meet Link *</label>
              <input
                required
                type="url"
                placeholder="https://meet.google.com/abc-defg-hij"
                value={interviewForm.googleMeetLink}
                onChange={(e) => setInterviewForm({ ...interviewForm, googleMeetLink: e.target.value })}
              />
              <small style={{ color: '#64748b' }}>Full https:// link paste karo — random text se app crash hogi</small>
            </div>
            <div className="form-group full"><label>Notes</label><textarea rows={2} value={interviewForm.notes} onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })} /></div>
            {formError && <p className="form-error full">{formError}</p>}
            <div className="form-actions full">
              <button type="button" className="btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Send to User'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={modal === 'approve'} title="Select & Create Panel Access" onClose={closeModal} wide>
        {selected && (
          <form onSubmit={handleApprove} className="form-grid">
            <div className="form-group"><label>Login ID</label><input disabled value={selected.phone} /></div>
            <div className="form-group"><label>Password</label><input placeholder="Auto if empty" value={approveForm.password} onChange={(e) => setApproveForm({ ...approveForm, password: e.target.value })} /></div>
            <div className="form-group"><label>Price/min (₹)</label><input type="number" required value={approveForm.pricePerMin} onChange={(e) => setApproveForm({ ...approveForm, pricePerMin: e.target.value })} /></div>
            <div className="form-group full"><label>Admin Notes</label><textarea rows={2} value={approveForm.adminNotes} onChange={(e) => setApproveForm({ ...approveForm, adminNotes: e.target.value })} /></div>
            {formError && <p className="form-error full">{formError}</p>}
            <div className="form-actions full">
              <button type="button" className="btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Approve'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={modal === 'reject'} title="Reject Application" onClose={closeModal}>
        {selected && (
          <form onSubmit={handleReject} className="form-grid">
            <div className="form-group full"><label>Reason</label><textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /></div>
            {formError && <p className="form-error full">{formError}</p>}
            <div className="form-actions full">
              <button type="button" className="btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ background: '#991b1b' }} disabled={saving}>{saving ? 'Rejecting...' : 'Reject'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}