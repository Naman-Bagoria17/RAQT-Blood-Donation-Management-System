import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiDroplet, FiLogOut } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">

        {/* Brand */}
        <Link to="/" className="navbar-brand" id="navbar-brand">
          <div className="brand-mark">
            <svg className="brand-drop" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 3C14 3 5 12.5 5 18a9 9 0 0 0 18 0c0-5.5-9-15-9-15Z"
                fill="#c91c1c"
                opacity="1"
              />
              <path
                d="M14 7.5C14 7.5 8 14.5 8 18.5a6 6 0 0 0 12 0c0-4-6-11-6-11Z"
                fill="rgba(255,255,255,0.10)"
              />
            </svg>
            <span className="brand-name">Blood<span>Connect</span></span>
          </div>
        </Link>

        {/* Nav links (visible on larger screens) */}
        {isHome && (
          <ul className="nav-links" role="list">
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#blood-types">Blood types</a></li>
          </ul>
        )}

        {/* Actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <div className="nav-user-info">
                <div className="nav-avatar">{initials}</div>
                <div className="nav-user-text">
                  <span className="nav-user-name">{user?.name}</span>
                  <span className="nav-user-role">{user?.role}</span>
                </div>
              </div>
              <button
                id="navbar-logout-btn"
                className="btn btn-danger-ghost btn-sm"
                onClick={logout}
                aria-label="Log out"
              >
                <FiLogOut size={13} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                id="navbar-login-btn"
                className="btn btn-ghost btn-sm"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                id="navbar-register-btn"
                className="btn btn-primary btn-sm"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
