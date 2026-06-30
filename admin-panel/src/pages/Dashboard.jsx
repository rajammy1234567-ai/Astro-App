import { useEffect, useState } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const STATUS_VARIANT = {
  pending: 'warning',
  confirmed: 'success',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="table-loading">Loading dashboard...</div>;
  if (!data) return <div className="table-empty">Failed to load dashboard</div>;

  const { stats, recentOrders, recentUsers } = data;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#3b82f6' },
    { label: 'Astrologers', value: stats.totalAstrologers, sub: `${stats.onlineAstrologers} online`, icon: '🔮', color: '#8b5cf6' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: '#f59e0b' },
    { label: 'Revenue', value: fmt(stats.totalRevenue), icon: '💰', color: '#22c55e' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's what's happening today." />

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card" style={{ borderTopColor: c.color }}>
            <div className="stat-icon">{c.icon}</div>
            <div>
              <span className="stat-label">{c.label}</span>
              <strong className="stat-value">{c.value}</strong>
              {c.sub && <small>{c.sub}</small>}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <h3>Recent Orders</h3>
          <table className="data-table compact">
            <thead>
              <tr><th>Order</th><th>User</th><th>Amount</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {recentOrders?.map((o) => (
                <tr key={o._id}>
                  <td>{o.orderType === 'pooja' ? o.poojaName : 'Store Order'}</td>
                  <td>{o.user?.name || '-'}</td>
                  <td>{fmt(o.totalAmount)}</td>
                  <td><Badge variant={STATUS_VARIANT[o.status] || 'default'}>{o.status}</Badge></td>
                  <td>{fmtDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3>New Users</h3>
          <div className="user-list">
            {recentUsers?.map((u) => (
              <div key={u._id} className="user-row">
                <div className="user-avatar-sm">{u.name?.charAt(0) || 'U'}</div>
                <div>
                  <strong>{u.name}</strong>
                  <span>{u.phone || u.email}</span>
                </div>
                <small>{fmtDate(u.createdAt)}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}