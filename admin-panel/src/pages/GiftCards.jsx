import CrudPage from '../components/CrudPage';
import Badge from '../components/Badge';

export default function GiftCards() {
  return (
    <CrudPage
      title="Gift Cards"
      subtitle="Create and manage gift card codes"
      endpoint="/gift-cards"
      defaultItem={{ code: '', amount: 100 }}
      columns={[
        { key: 'code', label: 'Code', render: (r) => <code className="code-badge">{r.code}</code> },
        { key: 'amount', label: 'Amount', render: (r) => `₹${r.amount}` },
        { key: 'isRedeemed', label: 'Status', render: (r) => <Badge variant={r.isRedeemed ? 'default' : 'success'}>{r.isRedeemed ? 'Redeemed' : 'Active'}</Badge> },
        { key: 'redeemedBy', label: 'Redeemed By', render: (r) => r.redeemedBy?.name || '-' },
      ]}
      fields={[
        { key: 'code', label: 'Gift Card Code', required: true, placeholder: 'ASTRO100' },
        { key: 'amount', label: 'Amount (₹)', type: 'number', required: true },
      ]}
    />
  );
}