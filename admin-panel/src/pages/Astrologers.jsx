import CrudPage from '../components/CrudPage';
import Badge from '../components/Badge';

export default function Astrologers() {
  return (
    <CrudPage
      title="Astrologers"
      subtitle="Approve via Applications, then publish on user app"
      endpoint="/astrologers"
      wide
      allowCreate={false}
      defaultItem={{
        name: '', specialty: '', pricePerMin: 20, experience: 1, image: '',
        isOnline: true, isVerified: true, chatEnabled: true, callEnabled: true, isPublished: false,
      }}
      columns={[
        { key: 'name', label: 'Name', render: (r) => (
          <div className="cell-with-img">
            {r.image && <img src={r.image} alt="" className="table-img" />}
            <div>
              <strong>{r.name}</strong>
              {r.approvedViaApplication && <div style={{ fontSize: 11, color: '#166534' }}>✓ Approved</div>}
            </div>
          </div>
        )},
        { key: 'phone', label: 'Panel ID', render: (r) => r.phone || '-' },
        { key: 'specialty', label: 'Specialty' },
        { key: 'pricePerMin', label: 'Price/min', render: (r) => `₹${r.pricePerMin}` },
        { key: 'isPublished', label: 'User App', render: (r) => (
          <Badge variant={r.isPublished && r.approvedViaApplication ? 'success' : 'warning'}>
            {r.isPublished && r.approvedViaApplication ? 'Live' : 'Hidden'}
          </Badge>
        )},
        { key: 'isOnline', label: 'Status', render: (r) => (
          <Badge variant={r.isOnline ? 'success' : 'default'}>{r.isOnline ? 'Online' : 'Offline'}</Badge>
        )},
      ]}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'specialty', label: 'Specialty' },
        { key: 'pricePerMin', label: 'Price per min (₹)', type: 'number', required: true },
        { key: 'experience', label: 'Experience (years)', type: 'number' },
        { key: 'rating', label: 'Rating', type: 'number' },
        { key: 'image', label: 'Image', type: 'image', full: true },
        { key: 'badge', label: 'Badge (Celebrity, Top Choice)' },
        { key: 'bio', label: 'Bio', type: 'textarea', full: true },
        { key: 'isPublished', label: 'Publish', type: 'checkbox', checkboxLabel: 'Show on User App' },
        { key: 'isOnline', label: 'Online', type: 'checkbox', checkboxLabel: 'Show as online' },
        { key: 'isVerified', label: 'Verified', type: 'checkbox', checkboxLabel: 'Verified astrologer' },
        { key: 'chatEnabled', label: 'Chat', type: 'checkbox', checkboxLabel: 'Chat enabled' },
        { key: 'callEnabled', label: 'Call', type: 'checkbox', checkboxLabel: 'Call enabled' },
      ]}
    />
  );
}