import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const QUICK_NAV = [
  { label: 'Dashboard', path: '/' },
  { label: 'Users', path: '/users' },
  { label: 'Astrologers', path: '/astrologers' },
  { label: 'Applications', path: '/astrologer-applications' },
  { label: 'Products', path: '/products' },
  { label: 'Orders', path: '/orders' },
  { label: 'Transactions', path: '/transactions' },
  { label: 'Blogs', path: '/blogs' },
  { label: 'News', path: '/news' },
  { label: 'Pooja Services', path: '/poojas' },
  { label: 'Gift Cards', path: '/gift-cards' },
  { label: 'Testimonials', path: '/testimonials' },
  { label: 'Support FAQs', path: '/support-faqs' },
  { label: 'Free Services', path: '/free-services' },
];

export default function Header() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return QUICK_NAV.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  const handleLogout = () => {
    logout();
    toast.info('Logged out');
    navigate('/login');
  };

  const goTo = (path) => {
    navigate(path);
    setQuery('');
    setOpen(false);
    toast.info(`Opened ${QUICK_NAV.find((n) => n.path === path)?.label || 'page'}`);
  };

  return (
    <header className="top-header">
      <div className="header-search-wrap">
        <div className="header-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search pages (products, users, orders...)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) goTo(results[0].path);
              if (e.key === 'Escape') setOpen(false);
            }}
          />
        </div>
        {open && query && results.length > 0 && (
          <div className="search-dropdown">
            {results.map((item) => (
              <button key={item.path} type="button" className="search-item" onClick={() => goTo(item.path)}>
                {item.label}
              </button>
            ))}
          </div>
        )}
        {open && query && results.length === 0 && (
          <div className="search-dropdown">
            <div className="search-empty">No pages found</div>
          </div>
        )}
      </div>
      <div className="header-right">
        <div className="header-pill">Live</div>
        <div className="admin-profile">
          <div className="admin-avatar">{admin?.name?.charAt(0) || 'A'}</div>
          <div className="admin-info">
            <strong>{admin?.name}</strong>
            <span>{admin?.email}</span>
          </div>
        </div>
        <button type="button" className="btn-outline btn-sm" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}