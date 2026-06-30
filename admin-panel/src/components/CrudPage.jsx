import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import Modal from './Modal';

export default function CrudPage({ title, subtitle, endpoint, columns, fields, defaultItem = {}, wide }) {
  const { items, loading, create, update, remove } = useCrud(endpoint);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultItem);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultItem);
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    const values = {};
    fields.forEach((f) => { values[f.key] = item[f.key] ?? ''; });
    setForm(values);
    setOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      fields.forEach((f) => {
        if (f.type === 'number') payload[f.key] = Number(payload[f.key]) || 0;
        if (f.type === 'checkbox') payload[f.key] = !!payload[f.key];
      });
      if (editing) await update(editing._id, payload);
      else await create(payload);
      setOpen(false);
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete this ${title.slice(0, -1).toLowerCase()}?`)) return;
    try {
      await remove(item._id);
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const tableColumns = [
    ...columns,
    {
      key: 'actions',
      label: 'Actions',
      width: '140px',
      render: (row) => (
        <div className="action-btns">
          <button type="button" className="btn-sm btn-outline" onClick={() => openEdit(row)}>Edit</button>
          <button type="button" className="btn-sm btn-danger" onClick={() => handleDelete(row)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={<button type="button" className="btn-primary" onClick={openCreate}>+ Add New</button>}
      />
      <DataTable columns={tableColumns} data={items} loading={loading} />

      <Modal open={open} title={editing ? `Edit ${title}` : `Add ${title}`} onClose={() => setOpen(false)} wide={wide}>
        <form onSubmit={handleSave} className="form-grid">
          {fields.map((field) => (
            <div key={field.key} className={`form-group ${field.full ? 'full' : ''}`}>
              <label>{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  rows={field.rows || 3}
                  value={form[field.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  required={field.required}
                />
              ) : field.type === 'select' ? (
                <select
                  value={form[field.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                >
                  {field.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })}
                  />
                  {field.checkboxLabel || field.label}
                </label>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={form[field.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  required={field.required}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
          <div className="form-actions full">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}