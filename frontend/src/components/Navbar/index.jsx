import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import SvgIcon from '../SvgIcon';

export default function Navbar({ onLogout, user }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const role = user?.role || 'accessor';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/accessor', label: 'Session', icon: 'instructor' },
  ];

  return (
    <nav style={{
      background: 'var(--gray-900)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--gray-700)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
    }}>
      <div style={{ margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
          {/* Logo */}
          <Link to="/accessor" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
            <img src="/assets/logo.png" alt="OpSim GPE Logo" style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gray-100)', margin: 0, padding: 0 }}>OpSim GPE</h1>
              <p style={{ fontSize: '0.65rem', color: 'var(--primary)', margin: 0, padding: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructor Panel</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {navItems.map(({ path, label, icon }) => (
              <Link key={path} to={path} className={`nav-link ${isActive(path) ? 'active' : ''}`}>
                <SvgIcon name={icon} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* User Info + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-100)' }}>
                {user?.name || 'Instructor'}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>
                {user?.email || ''}
              </p>
            </div>
            <div style={{
              width: '2.5rem', height: '2.5rem',
              background: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <SvgIcon name="instructor" size="1.25rem" color="white" />
            </div>
            {onLogout && (
              <button onClick={onLogout} style={{
                padding: '0.4rem 0.8rem', background: 'var(--gray-700)', border: '1px solid var(--gray-600)',
                borderRadius: '0.4rem', color: 'var(--gray-300)', cursor: 'pointer', fontSize: '0.75rem'
              }}>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
