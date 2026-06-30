import CrudPage from '../components/CrudPage';
import Badge from '../components/Badge';

export default function Astrologers() {
  return (
    <CrudPage
      title="Astrologers"
      subtitle="Manage astrologer profiles, pricing and availability"
      endpoint="/astrologers"
      wide
      defaultItem={{ name: '', specialty: '', pricePerMin: 20, experience: 1, image: '', isOnline: true, isVerified: true, chatEnabled: true, callEnabled: true }}
      columns={[
        { key: 'name', label: 'Name', render: (r) => (
          <div className="cell-with-img">
            {r.image && <img src={r.image} alt="" className="table-img" />}
            <strong>{r.name}</strong>
          </div>
        )},
        { key: 'specialty', label: 'Specialty' },
        { key: 'pricePerMin', label: 'Price/min', render: (r) => `₹${r.pricePerMin}` },
        { key: 'rating', label: 'Rating', render: (r) => `⭐ ${r.rating}` },
        { key: 'isOnline', label: 'Status', render: (r) => <Badge variant={r.isOnline ? 'success' : 'default'}>{r.isOnline ? 'Online' : 'Offline'}</Badge> },
      ]}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'specialty', label: 'Specialty' },
        { key: 'pricePerMin', label: 'Price per min (₹)', type: 'number', required: true },
        { key: 'experience', label: 'Experience (years)', type: 'number' },
        { key: 'rating', label: 'Rating', type: 'number' },
        { key: 'image', label: 'Image URL', full: true },
        { key: 'badge', label: 'Badge (Celebrity, Top Choice)' },
        { key: 'isOnline', label: 'Online', type: 'checkbox', checkboxLabel: 'Show as online' },
        { key: 'isVerified', label: 'Verified', type: 'checkbox', checkboxLabel: 'Verified astrologer' },
        { key: 'chatEnabled', label: 'Chat', type: 'checkbox', checkboxLabel: 'Chat enabled' },
        { key: 'callEnabled', label: 'Call', type: 'checkbox', checkboxLabel: 'Call enabled' },
      ]}
    />
  );
}