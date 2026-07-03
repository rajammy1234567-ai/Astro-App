import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import api from '../services/api';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN') : '-';

export default function Users() {
  const { items, loading, error, refresh } = useCrud('/users');
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [blockReason, setBlockReason] = useState('Blocked by admin');
  const [saving, setSaving] = useState(false);

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    setOpen(true);
  };

  const openDetails = async (user) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetails(null);
    try {
      const data = await api.get(`/users/${user._id}/details`);
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
      await api.put(`/users/${editing._id}`, form);
      setOpen(false);
      await refresh();
      toast.success('User updated');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleBlock = async (user, block) => {
    const msg = block
      ? `Block ${user.name}? They cannot login.`
      : `Unblock ${user.name}?`;
    if (!confirm(msg)) return;
    try {
      await api.put(`/users/${user._id}/block`, {
        isBlocked: block,
        blockReason: block ? blockReason : '',
      });
      await refresh();
      if (detailOpen && details?.user?._id === user._id) openDetails(user);
      toast.success(block ? 'User blocked' : 'User unblocked');
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user ${user.name}?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      await refresh();
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <strong>{r.name}</strong> },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '-' },
    { key: 'email', label: 'Email', render: (r) => r.email || '-' },
    { key: 'balance', label: 'Wallet', render: (r) => fmt(r.balance) },
    { key: 'totalSpent', label: 'Total Spent', render: (r) => fmt(r.totalSpent) },
    { key: 'totalSessions', label: 'Sessions', render: (r) => r.totalSessions || 0 },
    {
      key: 'status', label: 'Status',
      render: (r) => (
        <Badge variant={r.isBlocked ? 'error' : r.isVerified ? 'success' : 'warning'}>
          {r.isBlocked ? 'Blocked' : r.isVerified ? 'Active' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'actions', label: 'Actions', width: '220px',
      render: (r) => (
        <div className="action-btns" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn-sm btn-outline" onClick={() => openDetails(r)}>Details</button>
          <button type="button" className="btn-sm btn-outline" onClick={() => openEdit(r)}>Edit</button>
          <button
            type="button"
            className={`btn-sm ${r.isBlocked ? 'btn-primary' : 'btn-danger'}`}
            onClick={() => handleBlock(r, !r.isBlocked)}
          >
            {r.isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle={`${items.length} registered users — wallet, spending, sessions`} />
      {error && <div className="page-error">⚠️ {error} — <button type="button" className="link-btn" onClick={refresh}>Retry</button></div>}

      <div className="form-group" style={{ maxWidth: 360, marginBottom: 16 }}>
        <label>Block reason (default)</label>
        <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Blocked by admin" />
      </div>

      <DataTable columns={columns} data={items} loading={loading} onRowClick={openDetails} />

      <Modal open={open} title="Edit User" onClose={() => setOpen(false)}>
        <form onSubmit={handleSave} className="form-grid">
          <div className="form-group"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-group full"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-actions full">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={detailOpen} title="User Details" onClose={() => setDetailOpen(false)} wide>
        {detailLoading ? (
          <div className="table-loading">Loading...</div>
        ) : details ? (
          <div className="detail-grid">
            <div className="detail-cards">
              <div className="detail-card"><span>Name</span><strong>{details.user.name}</strong></div>
              <div className="detail-card"><span>Email</span><strong>{details.user.email || '-'}</strong></div>
              <div className="detail-card"><span>Phone</span><strong>{details.user.phone || '-'}</strong></div>
              <div className="detail-card"><span>Wallet</span><strong>{fmt(details.wallet?.balance)}</strong></div>
              <div className="detail-card"><span>Total Spent</span><strong>{fmt(details.totalSpent)}</strong></div>
              <div className="detail-card"><span>Sessions</span><strong>{details.totalSessions}</strong></div>
              <div className="detail-card"><span>Status</span><strong>{details.user.isBlocked ? 'Blocked' : 'Active'}</strong></div>
              <div className="detail-card"><span>Joined</span><strong>{fmtDate(details.user.createdAt)}</strong></div>
            </div>

            <h4>Recent Transactions</h4>
            <table className="data-table compact">
              <thead><tr><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {(details.transactions || []).slice(0, 15).map((t) => (
                  <tr key={t._id}>
                    <td>{t.type}</td>
                    <td>{fmt(t.amount)}</td>
                    <td>{t.status}</td>
                    <td>{fmtDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Chat / Call Sessions</h4>
            <table className="data-table compact">
              <thead><tr><th>Astrologer</th><th>Type</th><th>Status</th><th>Charged</th><th>Date</th></tr></thead>
              <tbody>
                {(details.sessions || []).map((s) => (
                  <tr key={s._id}>
                    <td>{s.astrologer?.name || '-'}</td>
                    <td>{s.type}</td>
                    <td>{s.status}</td>
                    <td>{fmt(s.totalCharged)}</td>
                    <td>{fmtDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="form-actions">
              <button type="button" className={`btn-sm ${details.user.isBlocked ? 'btn-primary' : 'btn-danger'}`} onClick={() => handleBlock(details.user, !details.user.isBlocked)}>
                {details.user.isBlocked ? 'Unblock User' : 'Block User'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}