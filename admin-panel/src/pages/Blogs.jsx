import CrudPage from '../components/CrudPage';

export default function Blogs() {
  return (
    <CrudPage
      title="Blogs"
      subtitle="Manage astrology blog articles"
      endpoint="/blogs"
      wide
      defaultItem={{ title: '', excerpt: '', content: '', author: 'Astrologer Anshika', category: 'Astrology', image: '', views: '0', isPublished: true }}
      columns={[
        { key: 'title', label: 'Title', render: (r) => (
          <div className="cell-with-img">
            {r.image && <img src={r.image} alt="" className="table-img wide" />}
            <div><strong>{r.title}</strong><small>{r.author}</small></div>
          </div>
        )},
        { key: 'category', label: 'Category' },
        { key: 'views', label: 'Views' },
        { key: 'isPublished', label: 'Live', render: (r) => (r.isPublished ? '✅' : '❌') },
      ]}
      fields={[
        { key: 'title', label: 'Title', required: true, full: true },
        { key: 'excerpt', label: 'Excerpt', type: 'textarea', full: true },
        { key: 'content', label: 'Content', type: 'textarea', rows: 5, full: true },
        { key: 'author', label: 'Author' },
        { key: 'category', label: 'Category' },
        { key: 'views', label: 'Views' },
        { key: 'image', label: 'Image', type: 'image', full: true },
        { key: 'isPublished', label: 'Published', type: 'checkbox', checkboxLabel: 'Show in user app (Blog section)' },
      ]}
    />
  );
}