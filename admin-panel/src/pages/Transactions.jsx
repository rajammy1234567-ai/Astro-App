import { useCrud } from '../hooks/useCrud';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';

const fmt = (n) => `₹${n || 0}`;
const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Transactions() {
  const { items, loading } = useCrud('/transactions');

  const columns = [
    { key: 'user', label: 'User', render: (r) => r.user?.name || '-' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Type', render: (r) => <Badge variant={r.type === 'credit' ? 'success' : 'error'}>{r.type}</Badge> },
    { key: 'amount', label: 'Amount', render: (r) => <span style={{ color: r.type === 'credit' ? '#166534' : '#991b1b', fontWeight: 700 }}>{r.type === 'credit' ? '+' : '-'}{fmt(r.amount)}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'completed' ? 'success' : 'warning'}>{r.status}</Badge> },
    { key: 'createdAt', label: 'Date', render: (r) => fmtDate(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="Transactions" subtitle="All wallet transactions across users" />
      <DataTable columns={columns} data={items} loading={loading} />
    </div>
  );
}