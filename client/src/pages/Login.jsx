import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiDroplet } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Must be at least 6 characters.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    try {
      const data = await login(form.email, form.password);
      const from = location.state?.from?.pathname;

      if (data.user.role === 'donor') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                await api.put('/location/update', {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                });
                toast.success(`Welcome back, ${data.user.name}`);
                navigate(from || '/donor/dashboard', { replace: true });
              } catch (err) {
                console.error('Failed to update location', err);
                toast.success(`Welcome back, ${data.user.name}`);
                navigate(from || '/donor/dashboard', { replace: true });
              } finally {
                setLoading(false);
              }
            },
            async (error) => {
              alert("Location access is mandatory for donors. Please enable it in your browser settings to proceed.");
              await logout();
              setLoading(false);
            }
          );
        } else {
          alert("Geolocation is not supported by your browser.");
          await logout();
          setLoading(false);
        }
      } else {
        // Doctor login - no location needed
        toast.success(`Welcome back, ${data.user.name}`);
        navigate(from || '/doctor/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">

      {/* ── Left panel ──────────────────────────────────────── */}
      <div className="auth-left">
        <div className="auth-left-bg" />

        <div className="auth-left-brand">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C14 3 5 12.5 5 18a9 9 0 0 0 18 0c0-5.5-9-15-9-15Z" fill="#c91c1c" opacity="1" />
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--text-1)' }}>
              Blood<span style={{ color: 'var(--red)' }}>Connect</span>
            </span>
          </Link>
        </div>

        <div className="auth-left-content">
          <h2 className="auth-left-heading">
            Every drop<br /><em>counts.</em>
          </h2>
          <p className="auth-left-sub">
            Sign in to manage your blood donation profile, track your history,
            and stay connected with the medical network.
          </p>

          <div className="auth-testimonial">
            <p className="auth-testimonial-text">
              "BloodConnect made it incredibly easy to track my donations and
              ensure my information was always current. A simple tool that can
              literally save lives."
            </p>
            <span className="auth-testimonial-author">— Registered Donor</span>
          </div>
        </div>

        <div className="auth-left-footer">
          Phase 1 — Donor & Doctor Management
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <div className="auth-right">
        <div style={{ maxWidth: 360, width: '100%', margin: '0 auto' }}>

          <div className="auth-right-header">
            <h1 className="auth-right-title">Sign in</h1>
            <p className="auth-right-sub">
              No account?{' '}
              <Link to="/register" id="login-signup-link">Create one here →</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate id="login-form">

            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Email address</label>
              <div className="input-wrap">
                <span className="input-icon"><FiMail size={14} /></span>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  className="form-input input-with-icon"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="login-password" className="form-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon"><FiLock size={14} /></span>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  className="form-input input-with-icon"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  style={{ paddingRight: 38 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-btn"
                  id="toggle-password-btn"
                  onClick={() => setShowPw(!showPw)}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            <div style={{ marginTop: 'var(--space-6)' }}>
              <button
                type="submit"
                id="login-submit-btn"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" /> Signing in…</>
                  : <>Sign in <FiArrowRight size={14} /></>}
              </button>
            </div>
          </form>

          <div className="form-divider" style={{ marginTop: 'var(--space-8)' }}>
            <span className="form-divider-line" />
            <span className="form-divider-text">or</span>
            <span className="form-divider-line" />
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-3)' }}>
            <Link to="/" id="login-back-home" style={{ color: 'var(--text-3)' }}>
              ← Back to home
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;
