import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import api from '../services/api';

const fmt = (n) => `₹${n || 0}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_VARIANT = { pending: 'warning', confirmed: 'success', shipped: 'info', delivered: 'success', cancelled: 'error' };

export default function Orders() {
  const { items, loading, refresh } = useCrud('/orders');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState('pending');

  const openEdit = (order) => {
    setEditing(order);
    setStatus(order.status);
    setOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await api.put(`/orders/${editing._id}`, { status });
    setOpen(false);
    refresh();
  };

  const columns = [
    { key: 'type', label: 'Type', render: (r) => r.orderType === 'pooja' ? '🪔 Pooja' : '🛍️ Store' },
    { key: 'user', label: 'Customer', render: (r) => r.user?.name || '-' },
    { key: 'detail', label: 'Details', render: (r) => r.poojaName || `${r.products?.length || 0} items` },
    { key: 'totalAmount', label: 'Amount', render: (r) => fmt(r.totalAmount) },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge> },
    { key: 'createdAt', label: 'Date', render: (r) => fmtDate(r.createdAt) },
    { key: 'actions', label: '', width: '80px', render: (r) => (
      <button type="button" className="btn-sm btn-outline" onClick={() => openEdit(r)}>Update</button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${items.length} total orders`} />
      <DataTable columns={columns} data={items} loading={loading} />
      <Modal open={open} title="Update Order Status" onClose={() => setOpen(false)}>
        <form onSubmit={handleSave} className="form-grid">
          <div className="form-group full">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="form-actions full">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}