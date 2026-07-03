/** Strip null/invalid rows from admin API list responses */
export function normalizeAdminList(data) {
  if (!Array.isArray(data)) return [];
  return data.filter((row) => {
    if (row == null || typeof row !== 'object') return false;
    const id = row._id ?? row.id;
    return id != null && id !== '';
  });
}

export function rowKey(row, index) {
  const id = row?._id ?? row?.id;
  return id != null ? String(id) : `row-${index}`;
}