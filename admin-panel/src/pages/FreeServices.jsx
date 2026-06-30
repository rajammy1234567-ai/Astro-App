import CrudPage from '../components/CrudPage';

export default function FreeServices() {
  return (
    <CrudPage
      title="Free Services"
      subtitle="Manage free service offerings in the app"
      endpoint="/free-services"
      defaultItem={{ title: '', description: '', icon: 'gift-outline', route: '/kundli', order: 0, isActive: true }}
      columns={[
        { key: 'title', label: 'Service' },
        { key: 'route', label: 'Route' },
        { key: 'order', label: 'Order' },
        { key: 'isActive', label: 'Active', render: (r) => r.isActive ? '✅' : '❌' },
      ]}
      fields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'description', label: 'Description', full: true },
        { key: 'icon', label: 'Icon (Ionicons)' },
        { key: 'route', label: 'App Route' },
        { key: 'order', label: 'Display Order', type: 'number' },
        { key: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Show in app' },
      ]}
    />
  );
}