import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/dashboard')
      .then(setData)
      .catch((err) => {
        setData(null);
        setError(err.message || 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="table-loading">Loading dashboard...</div>;
  if (!data) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Welcome back!" />
        <div className="page-error">⚠️ {error || 'Failed to load'} — <button type="button" className="link-btn" onClick={load}>Retry</button></div>
      </div>
    );
  }

  const { stats, recentOrders, recentUsers } = data;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#3b82f6', path: '/users' },
    { label: 'Astrologers', value: stats.totalAstrologers, sub: `${stats.onlineAstrologers} online`, icon: '🔮', color: '#8b5cf6', path: '/astrologers' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: '#f59e0b', path: '/orders' },
    { label: 'Revenue', value: fmt(stats.totalRevenue), icon: '💰', color: '#22c55e', path: '/transactions' },
  ];

  const quickLinks = [
    { label: 'Products', path: '/products' },
    { label: 'Applications', path: '/astrologer-applications' },
    { label: 'Blogs', path: '/blogs' },
    { label: 'Gift Cards', path: '/gift-cards' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's what's happening today." />

      <div className="quick-links">
        {quickLinks.map((q) => (
          <button key={q.path} type="button" className="btn-outline btn-sm" onClick={() => navigate(q.path)}>
            {q.label}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <button key={c.label} type="button" className="stat-card stat-card-btn" style={{ borderTopColor: c.color }} onClick={() => navigate(c.path)}>
            <div className="stat-icon">{c.icon}</div>
            <div>
              <span className="stat-label">{c.label}</span>
              <strong className="stat-value">{c.value}</strong>
              {c.sub && <small>{c.sub}</small>}
            </div>
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>Recent Orders</h3>
            <button type="button" className="link-btn" onClick={() => navigate('/orders')}>View All</button>
          </div>
          <table className="data-table compact">
            <thead>
              <tr><th>Order</th><th>User</th><th>Amount</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {recentOrders?.map((o) => (
                <tr key={o._id} className="clickable" onClick={() => navigate('/orders')}>
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
          <div className="panel-head">
            <h3>New Users</h3>
            <button type="button" className="link-btn" onClick={() => navigate('/users')}>View All</button>
          </div>
          <div className="user-list">
            {recentUsers?.map((u) => (
              <button key={u._id} type="button" className="user-row user-row-btn" onClick={() => navigate('/users')}>
                <div className="user-avatar-sm">{u.name?.charAt(0) || 'U'}</div>
                <div>
                  <strong>{u.name}</strong>
                  <span>{u.phone || u.email}</span>
                </div>
                <small>{fmtDate(u.createdAt)}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}