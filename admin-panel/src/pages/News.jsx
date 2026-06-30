import CrudPage from '../components/CrudPage';

export default function News() {
  return (
    <CrudPage
      title="News"
      subtitle="Manage press and news articles"
      endpoint="/news"
      defaultItem={{ title: '', source: '', image: '' }}
      columns={[
        { key: 'title', label: 'Title', render: (r) => (
          <div className="cell-with-img">
            {r.image && <img src={r.image} alt="" className="table-img wide" />}
            <strong>{r.title}</strong>
          </div>
        )},
        { key: 'source', label: 'Source' },
      ]}
      fields={[
        { key: 'title', label: 'Title', required: true, full: true },
        { key: 'source', label: 'Source' },
        { key: 'image', label: 'Image URL', full: true },
      ]}
    />
  );
}