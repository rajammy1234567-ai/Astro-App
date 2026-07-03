import CrudPage from '../components/CrudPage';

const CATEGORIES = [
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'rudraksha', label: 'Rudraksha' },
  { value: 'gemstones', label: 'Gemstones' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'yantra', label: 'Yantra' },
  { value: 'pooja-items', label: 'Pooja Items' },
];

export default function Products() {
  return (
    <CrudPage
      title="Products"
      subtitle="Manage Astro Store — all shop items in user app"
      endpoint="/products"
      defaultItem={{
        name: '', description: '', price: 499, category: 'gemstones', image: '',
        stock: 10, isActive: true, isFeatured: false, isNewLaunch: false,
      }}
      columns={[
        { key: 'name', label: 'Product', render: (r) => (
          <div className="cell-with-img">
            {r.image && <img src={r.image} alt="" className="table-img" />}
            <div>
              <strong>{r.name}</strong>
              {!r.isActive && <span style={{ color: '#ef4444', fontSize: 11, marginLeft: 6 }}>Hidden</span>}
            </div>
          </div>
        )},
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price', render: (r) => `₹${r.price}` },
        { key: 'stock', label: 'Stock' },
        { key: 'flags', label: 'Sections', render: (r) => (
          <span>
            {r.isFeatured ? '🔥 Top' : ''}{r.isFeatured && r.isNewLaunch ? ' · ' : ''}
            {r.isNewLaunch ? '✨ New' : ''}{!r.isFeatured && !r.isNewLaunch ? '—' : ''}
          </span>
        )},
        { key: 'isActive', label: 'Live', render: (r) => (r.isActive ? '✅' : '❌') },
      ]}
      fields={[
        { key: 'name', label: 'Product Name', required: true },
        { key: 'price', label: 'Price (₹)', type: 'number', required: true },
        { key: 'stock', label: 'Stock Qty', type: 'number', required: true },
        { key: 'category', label: 'Category', type: 'select', options: CATEGORIES },
        { key: 'image', label: 'Image', type: 'image', full: true },
        { key: 'description', label: 'Description', type: 'textarea', full: true, rows: 4 },
        { key: 'isActive', label: 'Published', type: 'checkbox', checkboxLabel: 'Show in store (user app → Remedies → Shop)' },
        { key: 'isFeatured', label: 'Top Selling', type: 'checkbox', checkboxLabel: 'Top Selling section' },
        { key: 'isNewLaunch', label: 'New Launch', type: 'checkbox', checkboxLabel: 'Newly Launched section' },
      ]}
    />
  );
}