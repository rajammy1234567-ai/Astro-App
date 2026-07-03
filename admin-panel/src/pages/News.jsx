import CrudPage from '../components/CrudPage';

export default function News() {
  return (
    <CrudPage
      title="News"
      subtitle="Manage press and news articles"
      endpoint="/news"
      defaultItem={{ title: '', source: '', image: '', isPublished: true }}
      columns={[
        { key: 'title', label: 'Title', render: (r) => (
          <div className="cell-with-img">
            {r.image && <img src={r.image} alt="" className="table-img wide" />}
            <strong>{r.title}</strong>
          </div>
        )},
        { key: 'source', label: 'Source' },
        { key: 'isPublished', label: 'Live', render: (r) => (r.isPublished ? '✅' : '❌') },
      ]}
      fields={[
        { key: 'title', label: 'Title', required: true, full: true },
        { key: 'source', label: 'Source' },
        { key: 'image', label: 'Image', type: 'image', full: true },
        { key: 'isPublished', label: 'Published', type: 'checkbox', checkboxLabel: 'Show in user app (News section)' },
      ]}
    />
  );
}