import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import api from '../services/api';

const fmt = (n) => `₹${n || 0}`;

export default function Users() {
  const { items, loading, error, refresh } = useCrud('/users');
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    setOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/users/${editing._id}`, form);
      setOpen(false);
      await refresh();
      toast.success('User updated successfully');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
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
    { key: 'isVerified', label: 'Status', render: (r) => <Badge variant={r.isVerified ? 'success' : 'warning'}>{r.isVerified ? 'Verified' : 'Pending'}</Badge> },
    {
      key: 'actions', label: 'Actions', width: '140px',
      render: (r) => (
        <div className="action-btns" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn-sm btn-outline" onClick={() => openEdit(r)}>Edit</button>
          <button type="button" className="btn-sm btn-danger" onClick={() => handleDelete(r)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle={`${items.length} registered users`} />
      {error && <div className="page-error">⚠️ {error} — <button type="button" className="link-btn" onClick={refresh}>Retry</button></div>}
      <DataTable columns={columns} data={items} loading={loading} />
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
    </div>
  );
}