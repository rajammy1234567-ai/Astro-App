import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useCrud(endpoint) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(endpoint);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.message || 'Failed to load data';
      setError(
        msg.includes('Network') || msg.includes('fetch')
          ? 'Backend connect nahi ho raha — server chalao (cd server && npm run dev)'
          : msg
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (data) => {
    await api.post(endpoint, data);
    await refresh();
  };

  const update = async (id, data) => {
    await api.put(`${endpoint}/${id}`, data);
    await refresh();
  };

  const remove = async (id) => {
    await api.delete(`${endpoint}/${id}`);
    await refresh();
  };

  return { items, loading, error, refresh, create, update, remove };
}