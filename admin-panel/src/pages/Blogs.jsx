import CrudPage from '../components/CrudPage';

export default function Blogs() {
  return (
    <CrudPage
      title="Blogs"
      subtitle="Manage astrology blog articles"
      endpoint="/blogs"
      wide
      defaultItem={{ title: '', excerpt: '', content: '', author: 'Astrologer Anshika', category: 'Astrology', image: '', views: '0' }}
      columns={[
        { key: 'title', label: 'Title', render: (r) => (
          <div className="cell-with-img">
            {r.image && <img src={r.image} alt="" className="table-img wide" />}
            <div><strong>{r.title}</strong><small>{r.author}</small></div>
          </div>
        )},
        { key: 'category', label: 'Category' },
        { key: 'views', label: 'Views' },
      ]}
      fields={[
        { key: 'title', label: 'Title', required: true, full: true },
        { key: 'excerpt', label: 'Excerpt', type: 'textarea', full: true },
        { key: 'content', label: 'Content', type: 'textarea', rows: 5, full: true },
        { key: 'author', label: 'Author' },
        { key: 'category', label: 'Category' },
        { key: 'views', label: 'Views' },
        { key: 'image', label: 'Image URL', full: true },
      ]}
    />
  );
}