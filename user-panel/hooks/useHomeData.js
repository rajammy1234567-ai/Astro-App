import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAstrologers } from '../redux/astrologerSlice';
import { fetchBlogs } from '../redux/blogSlice';
import { fetchProducts } from '../redux/storeSlice';
import { newsApi } from '../services/newsApi';

const STALE_MS = 45000; // don't refetch home every focus within 45s

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

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
  const lastFetch = useRef(0);

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

  const refresh = useCallback(
    (force = false) => {
      const now = Date.now();
      if (!force && lastFetch.current && now - lastFetch.current < STALE_MS) {
        // Still refresh news lightly only if empty
        if (!news.length) loadNews();
        return;
      }
      lastFetch.current = now;
      dispatch(fetchAstrologers());
      dispatch(fetchBlogs());
      dispatch(fetchProducts());
      loadNews();
    },
    [dispatch, loadNews, news.length]
  );

  useFocusEffect(
    useCallback(() => {
      refresh(false);
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
    astrologers: sortAstrologers(astrologers || []),
    blogs: mappedBlogs,
    products: products || [],
    news,
    loading: astroLoading || blogLoading || storeLoading || newsLoading,
    connectionError,
    refresh: () => refresh(true),
  };
}

export function useAstrologers(type) {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((s) => s.astrologer);
  const last = useRef({ type: null, at: 0 });

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (last.current.type === type && now - last.current.at < STALE_MS) return;
      last.current = { type, at: now };
      dispatch(fetchAstrologers(type ? { type } : {}));
    }, [dispatch, type])
  );

  const filtered = (list || []).filter((a) => {
    if (type === 'chat') return a.chatEnabled !== false;
    if (type === 'call') return a.callEnabled !== false;
    return true;
  });

  return {
    astrologers: sortAstrologers(filtered),
    loading,
    error,
  };
}
