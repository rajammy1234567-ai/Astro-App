import { NavLink } from 'react-router-dom';

const NAV = [
  { section: 'Overview' },
  { to: '/', label: 'Dashboard', icon: '📊' },
  { section: 'Management' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/astrologers', label: 'Astrologers', icon: '🔮' },
  { to: '/astrologer-applications', label: 'Applications', icon: '📋' },
  { to: '/products', label: 'Products', icon: '🛍️' },
  { to: '/orders', label: 'Orders', icon: '📦' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { section: 'Content' },
  { to: '/blogs', label: 'Blogs', icon: '📝' },
  { to: '/news', label: 'News', icon: '📰' },
  { to: '/poojas', label: 'Pooja Services', icon: '🪔' },
  { to: '/testimonials', label: 'Testimonials', icon: '⭐' },
  { to: '/support-faqs', label: 'Support FAQs', icon: '❓' },
  { to: '/free-services', label: 'Free Services', icon: '🎁' },
  { section: 'Marketing' },
  { to: '/gift-cards', label: 'Gift Cards', icon: '🎫' },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">☀️</div>
        {!collapsed && (
          <div>
            <strong>AstroTalk</strong>
            <span>Admin Panel</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item, i) =>
          item.section ? (
            !collapsed && <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        )}
      </nav>

      <button type="button" className="sidebar-toggle" onClick={onToggle}>
        {collapsed ? '→' : '←'}
      </button>
    </aside>
  );
}