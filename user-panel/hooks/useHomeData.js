import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAstrologers } from '../redux/astrologerSlice';
import { fetchBlogs } from '../redux/blogSlice';
import { fetchProducts } from '../redux/storeSlice';
import { newsApi } from '../services/newsApi';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/** Online first, then rating, then name — never hide offline on home */
function sortAstrologers(list = []) {
  return [...list].sort((a, b) => {
    if (!!b.isOnline !== !!a.isOnline) return b.isOnline ? 1 : -1;
    const r = (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (r !== 0) return r;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

export function useHomeData() {
  const dispatch = useDispatch();
  const { list: astrologers, loading: astroLoading, error: astroError } = useSelector((s) => s.astrologer);
  const { list: blogs, loading: blogLoading, error: blogError } = useSelector((s) => s.blog);
  const { products, loading: storeLoading, error: storeError } = useSelector((s) => s.store);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(null);

  const loadNews = useCallback(() => {
    setNewsLoading(true);
    setNewsError(null);
    return newsApi
      .getAll()
      .then((data) =>
        setNews(
          (Array.isArray(data) ? data : []).map((n) => ({
            ...n,
            id: n._id,
            date: formatDate(n.createdAt),
          }))
        )
      )
      .catch((err) => {
        setNews([]);
        setNewsError(err.message || 'News load failed');
      })
      .finally(() => setNewsLoading(false));
  }, []);

  const refresh = useCallback(() => {
    dispatch(fetchAstrologers());
    dispatch(fetchBlogs());
    dispatch(fetchProducts());
    loadNews();
  }, [dispatch, loadNews]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const mappedBlogs = (blogs || []).map((b) => ({
    ...b,
    _id: b._id || b.id,
    date: b.date || formatDate(b.createdAt),
    views: b.views || '0',
  }));

  const connectionError = storeError || blogError || newsError || astroError;

  return {
    // Show all published astrologers (online first) so home never looks empty
    astrologers: sortAstrologers(astrologers || []),
    blogs: mappedBlogs,
    products: products || [],
    news,
    loading: astroLoading || blogLoading || storeLoading || newsLoading,
    connectionError,
    refresh,
  };
}

export function useAstrologers(type) {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((s) => s.astrologer);

  useEffect(() => {
    dispatch(fetchAstrologers(type ? { type } : {}));
  }, [dispatch, type]);

  const filtered = (list || []).filter((a) => {
    if (type === 'chat') return a.chatEnabled !== false;
    if (type === 'call') return a.callEnabled !== false;
    return true;
  });

  return {
    // Prefer online but still show offline (with wait) so lists work offline too
    astrologers: sortAstrologers(filtered),
    loading,
    error,
  };
}
