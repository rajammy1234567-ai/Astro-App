import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAstrologers } from '../redux/astrologerSlice';
import { fetchBlogs } from '../redux/blogSlice';
import { fetchProducts } from '../redux/storeSlice';
import { newsApi } from '../services/newsApi';
import { ASTROLOGERS, BLOGS, NEWS } from '../constants/mockData';

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
  const { list: blogs, loading: blogLoading } = useSelector((s) => s.blog);
  const { products, loading: storeLoading } = useSelector((s) => s.store);
  const [news, setNews] = useState(NEWS);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAstrologers());
    dispatch(fetchBlogs());
    dispatch(fetchProducts());
    setNewsLoading(true);
    newsApi.getAll()
      .then((data) => setNews(data.map((n) => ({ ...n, id: n._id, date: formatDate(n.createdAt) }))))
      .catch(() => setNews(NEWS))
      .finally(() => setNewsLoading(false));
  }, [dispatch]);

  const mappedBlogs = (blogs.length ? blogs : BLOGS).map((b) => ({
    ...b,
    _id: b._id || b.id,
    date: b.date || formatDate(b.createdAt),
    views: b.views || '0',
  }));

  return {
    astrologers: astrologers.length ? astrologers : ASTROLOGERS,
    blogs: mappedBlogs,
    products,
    news,
    loading: astroLoading || blogLoading || storeLoading || newsLoading,
  };
}

export function useAstrologers(type) {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((s) => s.astrologer);

  useEffect(() => {
    dispatch(fetchAstrologers(type ? { type } : {}));
  }, [dispatch, type]);

  return {
    astrologers: list.length ? list : ASTROLOGERS.filter((a) => {
      if (type === 'chat') return a.chatEnabled;
      if (type === 'call') return a.callEnabled;
      return true;
    }),
    loading,
    error,
  };
}