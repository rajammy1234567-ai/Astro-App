import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="top-header">
      <div className="header-search">
        <span>🔍</span>
        <input type="text" placeholder="Search anything..." />
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