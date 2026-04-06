import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiCalendar, FiEdit3, FiBarChart2, FiLogOut } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { to: '/', icon: <FiHome />, label: 'Dashboard' },
    { to: '/cycles', icon: <FiCalendar />, label: 'Cycles' },
    { to: '/log', icon: <FiEdit3 />, label: 'Daily Log' },
    { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <span className="brand-icon">🌸</span>
          <span className="brand-text">FemFlow</span>
        </Link>
      </div>
      <div className="navbar-links">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
      <div className="navbar-user">
        <span className="user-name">Hi, {user.name}</span>
        <button onClick={logout} className="btn-logout">
          <FiLogOut /> Logout
        </button>
      </div>
    </nav>
  );
}
