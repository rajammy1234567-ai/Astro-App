import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import api from '../services/api';

const fmt = (n) => `₹${n || 0}`;

export default function Users() {
  const { items, loading, refresh } = useCrud('/users');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email || '', phone: user.phone || '' });
    setOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await api.put(`/users/${editing._id}`, form);
    setOpen(false);
    refresh();
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user ${user.name}?`)) return;
    await api.delete(`/users/${user._id}`);
    refresh();
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
        <div className="action-btns">
          <button type="button" className="btn-sm btn-outline" onClick={() => openEdit(r)}>Edit</button>
          <button type="button" className="btn-sm btn-danger" onClick={() => handleDelete(r)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle={`${items.length} registered users`} />
      <DataTable columns={columns} data={items} loading={loading} />
      <Modal open={open} title="Edit User" onClose={() => setOpen(false)}>
        <form onSubmit={handleSave} className="form-grid">
          <div className="form-group"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-group full"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-actions full">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}