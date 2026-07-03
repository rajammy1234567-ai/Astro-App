import { useRef, useState } from 'react';
import api from '../services/api';

export default function ImageField({ label, value, onChange, placeholder }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Sirf image file select karo (JPG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image 8 MB se chhoti honi chahiye.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
      });
      const res = await api.post('/upload', { image: dataUrl });
      onChange(res.url);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-field">
      <div className="image-field-row">
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Image URL ya local file upload karo'}
        />
        <button
          type="button"
          className="btn-outline image-pick-btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : '📁 Local Image'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={handleFile}
        />
      </div>
      {value ? (
        <img src={value} alt="" className="image-field-preview" onError={(e) => { e.target.style.display = 'none'; }} />
      ) : null}
      {error ? <p className="image-field-error">{error}</p> : null}
    </div>
  );
}