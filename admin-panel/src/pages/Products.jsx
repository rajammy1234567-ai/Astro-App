import CrudPage from '../components/CrudPage';

export default function Products() {
  return (
    <CrudPage
      title="Products"
      subtitle="Manage Astro Store products"
      endpoint="/products"
      defaultItem={{ name: '', price: 499, category: 'gemstones', image: '' }}
      columns={[
        { key: 'name', label: 'Product', render: (r) => (
          <div className="cell-with-img">
            {r.image && <img src={r.image} alt="" className="table-img" />}
            <strong>{r.name}</strong>
          </div>
        )},
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price', render: (r) => `₹${r.price}` },
      ]}
      fields={[
        { key: 'name', label: 'Product Name', required: true },
        { key: 'price', label: 'Price (₹)', type: 'number', required: true },
        { key: 'category', label: 'Category', type: 'select', options: [
          { value: 'jewelry', label: 'Jewelry' },
          { value: 'rudraksha', label: 'Rudraksha' },
          { value: 'gemstones', label: 'Gemstones' },
          { value: 'consultation', label: 'Consultation' },
        ]},
        { key: 'image', label: 'Image URL', full: true },
      ]}
    />
  );
}