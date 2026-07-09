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

export function useHomeData() {
  const dispatch = useDispatch();
  const { list: astrologers, loading: astroLoading } = useSelector((s) => s.astrologer);
  const { list: blogs, loading: blogLoading, error: blogError } = useSelector((s) => s.blog);
  const { products, loading: storeLoading, error: storeError } = useSelector((s) => s.store);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(null);

  const loadNews = useCallback(() => {
    setNewsLoading(true);
    setNewsError(null);
    return newsApi.getAll()
      .then((data) => setNews(data.map((n) => ({ ...n, id: n._id, date: formatDate(n.createdAt) }))))
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

  const mappedBlogs = blogs.map((b) => ({
    ...b,
    _id: b._id || b.id,
    date: b.date || formatDate(b.createdAt),
    views: b.views || '0',
  }));

  const connectionError = storeError || blogError || newsError;

  return {
    astrologers: astrologers.length ? astrologers.filter((a) => a.isOnline) : [],
    blogs: mappedBlogs,
    products,
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

  return {
    astrologers: list.length
      ? list.filter((a) => a.isOnline && (type === 'chat' ? a.chatEnabled : type === 'call' ? a.callEnabled : true))
      : [],
    loading,
    error,
  };
}