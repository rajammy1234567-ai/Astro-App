import CrudPage from '../components/CrudPage';

export default function Testimonials() {
  return (
    <CrudPage
      title="Testimonials"
      subtitle="Manage video testimonials"
      endpoint="/testimonials"
      wide
      defaultItem={{ name: '', location: '', quote: '', rating: 5, thumbnail: '', videoUrl: '', isActive: true }}
      columns={[
        { key: 'name', label: 'Name', render: (r) => (
          <div className="cell-with-img">
            {r.thumbnail && <img src={r.thumbnail} alt="" className="table-img" />}
            <div><strong>{r.name}</strong><small>{r.location}</small></div>
          </div>
        )},
        { key: 'rating', label: 'Rating', render: (r) => `⭐ ${r.rating}` },
        { key: 'quote', label: 'Quote', render: (r) => <span className="truncate">{r.quote}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'location', label: 'Location' },
        { key: 'rating', label: 'Rating', type: 'number' },
        { key: 'quote', label: 'Quote', type: 'textarea', full: true },
        { key: 'thumbnail', label: 'Thumbnail', type: 'image', full: true },
        { key: 'videoUrl', label: 'Video URL', full: true },
        { key: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Show on app' },
      ]}
    />
  );
}