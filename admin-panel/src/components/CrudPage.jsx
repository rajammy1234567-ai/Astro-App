import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';
import { useToast } from '../context/ToastContext';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import Modal from './Modal';
import ImageField from './ImageField';

function initForm(fields, item, defaultItem) {
  const form = { ...defaultItem };
  fields.forEach((f) => {
    const val = item?.[f.key];
    if (f.type === 'number') form[f.key] = val != null ? val : (defaultItem[f.key] ?? '');
    else if (f.type === 'checkbox') form[f.key] = !!val;
    else form[f.key] = val ?? defaultItem[f.key] ?? '';
  });
  return form;
}

export default function CrudPage({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  defaultItem = {},
  wide,
  allowCreate = true,
}) {
  const { items, loading, error, create, update, remove, refresh } = useCrud(endpoint);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultItem);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(initForm(fields, null, defaultItem));
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm(initForm(fields, item, defaultItem));
    setOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const missing = fields.filter((f) => f.required && !String(form[f.key] ?? '').trim());
    if (missing.length) {
      toast.error(`Required: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }
    if (endpoint === '/products' && !form.isActive && !editing) {
      if (!confirm('Warning: "Show in store" is OFF — product save hoga par user shop mein hidden rahega. Continue?')) return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      fields.forEach((f) => {
        if (f.type === 'number') payload[f.key] = Number(payload[f.key]) || 0;
        if (f.type === 'checkbox') payload[f.key] = !!payload[f.key];
      });
      if (editing) {
        await update(editing._id, payload);
        toast.success(`${title} updated successfully`);
      } else {
        await create(payload);
        const msg = endpoint === '/products'
          ? 'Product added! User app → Remedies tab → Astro Store mein dikhega.'
          : `${title} created successfully`;
        toast.success(msg);
      }
      setOpen(false);
    } catch (err) {
      toast.error(err.message || 'Save failed — check backend is running');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name || item.title || item.code || 'this item'}"?`)) return;
    try {
      await remove(item._id);
      toast.success('Deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const tableColumns = [
    ...columns,
    {
      key: 'actions',
      label: 'Actions',
      width: '140px',
      render: (row) => (
        <div className="action-btns" onClick={(e) => e.stopPropagation()}>
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
        action={
          allowCreate ? (
            <button type="button" className="btn-primary" onClick={openCreate}>+ Add New</button>
          ) : null
        }
      />

      {error && (
        <div className="page-error">
          ⚠️ {error} — <button type="button" className="link-btn" onClick={refresh}>Retry</button>
        </div>
      )}

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
              ) : field.type === 'image' ? (
                <ImageField
                  label={field.label}
                  value={form[field.key] ?? ''}
                  onChange={(v) => setForm({ ...form, [field.key]: v })}
                  placeholder={field.placeholder}
                />
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
              {saving ? 'Saving...' : editing ? 'Update' : endpoint === '/products' ? 'Add Product' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}