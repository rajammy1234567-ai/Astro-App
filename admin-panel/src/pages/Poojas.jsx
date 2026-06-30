import CrudPage from '../components/CrudPage';

export default function Poojas() {
  return (
    <CrudPage
      title="Pooja Services"
      subtitle="Manage online pooja bookings"
      endpoint="/poojas"
      defaultItem={{ name: '', description: '', duration: '2 hours', price: 1500, icon: 'flame-outline', isActive: true }}
      columns={[
        { key: 'name', label: 'Pooja' },
        { key: 'duration', label: 'Duration' },
        { key: 'price', label: 'Price', render: (r) => `₹${r.price}` },
        { key: 'isActive', label: 'Active', render: (r) => r.isActive ? '✅' : '❌' },
      ]}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'duration', label: 'Duration' },
        { key: 'price', label: 'Price (₹)', type: 'number', required: true },
        { key: 'icon', label: 'Icon name (Ionicons)' },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
        { key: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Available for booking' },
      ]}
    />
  );
}