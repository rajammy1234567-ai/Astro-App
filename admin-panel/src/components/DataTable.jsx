export default function DataTable({ columns, data, loading, emptyText = 'No data found', onRowClick }) {
  if (loading) {
    return <div className="table-loading">Loading...</div>;
  }

  if (!data?.length) {
    return <div className="table-empty">{emptyText}</div>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || row.id || i} onClick={() => onRowClick?.(row)} className={onRowClick ? 'clickable' : ''}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}