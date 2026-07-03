import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import ImageField from '../components/ImageField';
import api from '../services/api';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN') : '-';

function initForm(item) {
  return {
    name: item?.name || '',
    specialty: item?.specialty || '',
    pricePerMin: item?.pricePerMin ?? 20,
    experience: item?.experience ?? 1,
    rating: item?.rating ?? 4.5,
    image: item?.image || '',
    badge: item?.badge || '',
    bio: item?.bio || '',
    isPublished: !!item?.isPublished,
    isOnline: !!item?.isOnline,
    isVerified: !!item?.isVerified,
    chatEnabled: item?.chatEnabled !== false,
    callEnabled: item?.callEnabled !== false,
  };
}

export default function Astrologers() {
  const { items, loading, error, update, refresh } = useCrud('/astrologers');
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState(initForm());
  const [blockReason, setBlockReason] = useState('Blocked by admin');
  const [saving, setSaving] = useState(false);

  const openEdit = (item) => {
    setEditing(item);
    setForm(initForm(item));
    setOpen(true);
  };

  const openDetails = async (item) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetails(null);
    try {
      const data = await api.get(`/astrologers/${item._id}/details`);
      setDetails(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load details');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await update(editing._id, {
        ...form,
        pricePerMin: Number(form.pricePerMin) || 0,
        experience: Number(form.experience) || 0,
        rating: Number(form.rating) || 0,
      });
      setOpen(false);
      toast.success('Astrologer updated');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleBlock = async (item, block) => {
    const msg = block
      ? `Block ${item.name}? Live end ho jayegi, login band.`
      : `Unblock ${item.name}?`;
    if (!confirm(msg)) return;
    try {
      await api.put(`/astrologers/${item._id}/block`, {
        isBlocked: block,
        blockReason: block ? blockReason : '',
      });
      await refresh();
      if (detailOpen && details?.astrologer?._id === item._id) openDetails(item);
      toast.success(block ? 'Astrologer blocked' : 'Astrologer unblocked');
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  const columns = [
    {
      key: 'name', label: 'Name',
      render: (r) => (
        <div className="cell-with-img">
          {r.image && <img src={r.image} alt="" className="table-img" />}
          <div>
            <strong>{r.name}</strong>
            {r.isLiveNow && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>🔴 LIVE NOW</div>}
            {r.isBlocked && <div style={{ fontSize: 11, color: '#b91c1c' }}>Blocked</div>}
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Panel ID', render: (r) => r.phone || '-' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'pricePerMin', label: 'Rate', render: (r) => fmt(r.pricePerMin) + '/min' },
    { key: 'totalEarnings', label: 'Earnings', render: (r) => fmt(r.totalEarnings) },
    { key: 'paidSessions', label: 'Paid Sessions', render: (r) => r.paidSessions || 0 },
    {
      key: 'live', label: 'Live',
      render: (r) => r.isLiveNow
        ? <Badge variant="error">LIVE · {r.liveViewers} viewers</Badge>
        : <Badge variant="default">Offline</Badge>,
    },
    {
      key: 'status', label: 'Status',
      render: (r) => (
        <Badge variant={r.isBlocked ? 'error' : r.isOnline ? 'success' : 'default'}>
          {r.isBlocked ? 'Blocked' : r.isOnline ? 'Online' : 'Offline'}
        </Badge>
      ),
    },
    {
      key: 'actions', label: 'Actions', width: '240px',
      render: (r) => (
        <div className="action-btns" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn-sm btn-outline" onClick={() => openDetails(r)}>Details</button>
          <button type="button" className="btn-sm btn-outline" onClick={() => openEdit(r)}>Edit</button>
          <button type="button" className={`btn-sm ${r.isBlocked ? 'btn-primary' : 'btn-danger'}`} onClick={() => handleBlock(r, !r.isBlocked)}>
            {r.isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Astrologers" subtitle="Earnings, live status, block/unblock, full details" />
      {error && <div className="page-error">⚠️ {error} — <button type="button" className="link-btn" onClick={refresh}>Retry</button></div>}

      <div className="form-group" style={{ maxWidth: 360, marginBottom: 16 }}>
        <label>Block reason (default)</label>
        <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
      </div>

      <DataTable columns={columns} data={items} loading={loading} onRowClick={openDetails} />

      <Modal open={open} title="Edit Astrologer" onClose={() => setOpen(false)} wide>
        <form onSubmit={handleSave} className="form-grid">
          <div className="form-group"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Specialty</label><input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
          <div className="form-group"><label>Price/min</label><input type="number" value={form.pricePerMin} onChange={(e) => setForm({ ...form, pricePerMin: e.target.value })} /></div>
          <div className="form-group"><label>Experience</label><input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></div>
          <div className="form-group"><label>Rating</label><input type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
          <div className="form-group full"><label>Badge</label><input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} /></div>
          <div className="form-group full"><label>Bio</label><textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <div className="form-group full"><ImageField label="Image" value={form.image} onChange={(v) => setForm({ ...form, image: v })} /></div>
          <label className="checkbox-row"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Show on User App</label>
          <label className="checkbox-row"><input type="checkbox" checked={form.isOnline} onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} /> Online</label>
          <label className="checkbox-row"><input type="checkbox" checked={form.chatEnabled} onChange={(e) => setForm({ ...form, chatEnabled: e.target.checked })} /> Chat enabled</label>
          <label className="checkbox-row"><input type="checkbox" checked={form.callEnabled} onChange={(e) => setForm({ ...form, callEnabled: e.target.checked })} /> Call enabled</label>
          <div className="form-actions full">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={detailOpen} title="Astrologer Details" onClose={() => setDetailOpen(false)} wide>
        {detailLoading ? (
          <div className="table-loading">Loading...</div>
        ) : details ? (
          <div className="detail-grid">
            <div className="detail-cards">
              <div className="detail-card"><span>Name</span><strong>{details.astrologer.name}</strong></div>
              <div className="detail-card"><span>Phone</span><strong>{details.astrologer.phone || '-'}</strong></div>
              <div className="detail-card"><span>Specialty</span><strong>{details.astrologer.specialty || '-'}</strong></div>
              <div className="detail-card"><span>Rate</span><strong>{fmt(details.astrologer.pricePerMin)}/min</strong></div>
              <div className="detail-card"><span>Total Earnings</span><strong>{fmt(details.totalEarnings)}</strong></div>
              <div className="detail-card"><span>Paid Sessions</span><strong>{details.paidSessions}</strong></div>
              <div className="detail-card"><span>Live Now</span><strong>{details.isLiveNow ? '🔴 YES' : 'No'}</strong></div>
              <div className="detail-card"><span>Status</span><strong>{details.astrologer.isBlocked ? 'Blocked' : details.astrologer.isOnline ? 'Online' : 'Offline'}</strong></div>
            </div>

            {details.liveSession && (
              <>
                <h4>Current Live Session</h4>
                <p><strong>{details.liveSession.title}</strong> — {details.liveSession.viewerCount} viewers — started {fmtDate(details.liveSession.startedAt)}</p>
              </>
            )}

            <h4>Recent Sessions</h4>
            <table className="data-table compact">
              <thead><tr><th>User</th><th>Type</th><th>Status</th><th>Earned</th><th>Date</th></tr></thead>
              <tbody>
                {(details.sessions || []).map((s) => (
                  <tr key={s._id}>
                    <td>{s.user?.name || '-'}</td>
                    <td>{s.type}</td>
                    <td>{s.status}</td>
                    <td>{fmt(s.totalCharged)}</td>
                    <td>{fmtDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Live History</h4>
            <table className="data-table compact">
              <thead><tr><th>Title</th><th>Status</th><th>Viewers</th><th>Started</th></tr></thead>
              <tbody>
                {(details.liveHistory || []).map((l) => (
                  <tr key={l._id}>
                    <td>{l.title}</td>
                    <td>{l.status}</td>
                    <td>{l.viewerCount}</td>
                    <td>{fmtDate(l.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="form-actions">
              <button type="button" className={`btn-sm ${details.astrologer.isBlocked ? 'btn-primary' : 'btn-danger'}`} onClick={() => handleBlock(details.astrologer, !details.astrologer.isBlocked)}>
                {details.astrologer.isBlocked ? 'Unblock Astrologer' : 'Block Astrologer'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}