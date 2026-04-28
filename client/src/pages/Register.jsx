import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowRight, FiEye, FiEyeOff, FiUser, FiMail, FiLock, FiPhone, FiDroplet } from 'react-icons/fi';
import { MdOutlineLocalHospital } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  const defaultRole = location.state?.defaultRole || 'donor';

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: defaultRole,
    blood_group: 'O+', contact: '',
    hospital_name: '',
  });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'At least 6 characters required.';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    if (form.role === 'donor') {
      if (!form.blood_group) e.blood_group = 'Blood group is required.';
      if (form.contact && !/^[0-9]{10}$/.test(form.contact)) e.contact = 'Enter a valid 10-digit number.';
    }
    if (form.role === 'doctor') {
      if (!form.hospital_name.trim()) e.hospital_name = 'Hospital name is required.';
      if (form.contact && !/^[0-9]{10}$/.test(form.contact)) e.contact = 'Enter a valid 10-digit number.';
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleRole = (role) => {
    setForm((p) => ({ ...p, role }));
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const performRegister = async (lat = null, lon = null) => {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        contact: form.contact || undefined,
        latitude: lat,
        longitude: lon,
        ...(form.role === 'donor' ? { blood_group: form.blood_group } : { hospital_name: form.hospital_name.trim() }),
      };
      const data = await register(payload);
      toast.success(`Account created! Welcome, ${data.user.name}`);
      navigate(form.role === 'donor' ? '/donor/dashboard' : '/doctor/dashboard', { replace: true });
    };

    if (form.role === 'donor') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await performRegister(pos.coords.latitude, pos.coords.longitude);
            } catch (err) {
              toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
            } finally {
              setLoading(false);
            }
          },
          (error) => {
            alert("Location access is mandatory for donors. Please enable it in your browser settings to proceed.");
            setLoading(false);
          }
        );
      } else {
        alert("Geolocation is not supported by your browser.");
        setLoading(false);
      }
    } else {
      try {
        await performRegister();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
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
            Join the<br />network that<br /><em>saves lives.</em>
          </h2>
          <p className="auth-left-sub">
            Registration is free and takes under two minutes.
            Your data is secure, private, and always in your control.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              { label: 'Donors', desc: 'Share your blood group and donation history.' },
              { label: 'Doctors', desc: 'Manage hospital profiles and track coordination.' },
            ].map((item) => (
              <div key={item.label} className="auth-testimonial">
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--red-light)', marginBottom: 4 }}>
                  {item.label}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.55 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-left-footer">Phase 1 — MERN Stack · JWT Auth · RBAC</div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <div className="auth-right" style={{ overflowY: 'auto' }}>
        <div style={{ maxWidth: 400, width: '100%', margin: '0 auto', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-8)' }}>

          <div className="auth-right-header">
            <h1 className="auth-right-title">Create account</h1>
            <p className="auth-right-sub">
              Already registered?{' '}
              <Link to="/login" id="register-signin-link">Sign in →</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate id="register-form">

            {/* ── Role selector ── */}
            <div>
              <span className="role-card-label">I am registering as</span>
              <div className="role-cards">

                <label className="role-card">
                  <input
                    type="radio"
                    id="role-donor"
                    name="role"
                    value="donor"
                    checked={form.role === 'donor'}
                    onChange={() => handleRole('donor')}
                  />
                  <div className="role-card-body">
                    <div className="role-card-icon">
                      <FiDroplet size={16} />
                    </div>
                    <div className="role-card-info">
                      <span className="role-card-name">Donor</span>
                      <span className="role-card-desc">I want to donate blood</span>
                    </div>
                    <div className="role-card-check">
                      {form.role === 'donor' && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                </label>

                <label className="role-card">
                  <input
                    type="radio"
                    id="role-doctor"
                    name="role"
                    value="doctor"
                    checked={form.role === 'doctor'}
                    onChange={() => handleRole('doctor')}
                  />
                  <div className="role-card-body">
                    <div className="role-card-icon">
                      <MdOutlineLocalHospital size={18} />
                    </div>
                    <div className="role-card-info">
                      <span className="role-card-name">Doctor</span>
                      <span className="role-card-desc">I represent a hospital</span>
                    </div>
                    <div className="role-card-check">
                      {form.role === 'doctor' && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                </label>

              </div>
            </div>

            {/* ── Account fields ── */}
            <p className="form-section-label">Account details</p>

            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">Full name</label>
              <div className="input-wrap">
                <span className="input-icon"><FiUser size={14} /></span>
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  className="form-input input-with-icon"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  autoFocus
                />
              </div>
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Email address</label>
              <div className="input-wrap">
                <span className="input-icon"><FiMail size={14} /></span>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  className="form-input input-with-icon"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="reg-password" className="form-label">Password</label>
                <div className="input-wrap">
                  <span className="input-icon"><FiLock size={14} /></span>
                  <input
                    id="reg-password"
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    className="form-input input-with-icon"
                    placeholder="Min. 6 chars"
                    value={form.password}
                    onChange={handleChange}
                    style={{ paddingRight: 38 }}
                  />
                  <button
                    type="button"
                    id="toggle-reg-pw-btn"
                    className="input-btn"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="reg-confirm-pw" className="form-label">Confirm password</label>
                <div className="input-wrap">
                  <span className="input-icon"><FiLock size={14} /></span>
                  <input
                    id="reg-confirm-pw"
                    type={showPw ? 'text' : 'password'}
                    name="confirmPassword"
                    className="form-input input-with-icon"
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* ── Donor fields ── */}
            {form.role === 'donor' && (
              <>
                <p className="form-section-label">Donor information</p>
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="reg-blood-group" className="form-label">Blood group</label>
                    <select
                      id="reg-blood-group"
                      name="blood_group"
                      className="form-input"
                      value={form.blood_group}
                      onChange={handleChange}
                    >
                      {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                    {errors.blood_group && <p className="form-error">{errors.blood_group}</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-contact" className="form-label">Contact <span style={{ color: 'var(--text-4)' }}>(optional)</span></label>
                    <div className="input-wrap">
                      <span className="input-icon"><FiPhone size={13} /></span>
                      <input
                        id="reg-contact"
                        type="tel"
                        name="contact"
                        className="form-input input-with-icon"
                        placeholder="10-digit number"
                        value={form.contact}
                        onChange={handleChange}
                        maxLength={10}
                      />
                    </div>
                    {errors.contact && <p className="form-error">{errors.contact}</p>}
                  </div>
                </div>
              </>
            )}

            {/* ── Doctor fields ── */}
            {form.role === 'doctor' && (
              <>
                <p className="form-section-label">Hospital information</p>
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="reg-hospital" className="form-label">Hospital name</label>
                    <div className="input-wrap">
                      <span className="input-icon"><MdOutlineLocalHospital size={15} /></span>
                      <input
                        id="reg-hospital"
                        type="text"
                        name="hospital_name"
                        className="form-input input-with-icon"
                        placeholder="City Medical Center"
                        value={form.hospital_name}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.hospital_name && <p className="form-error">{errors.hospital_name}</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-doc-contact" className="form-label">Contact <span style={{ color: 'var(--text-4)' }}>(optional)</span></label>
                    <div className="input-wrap">
                      <span className="input-icon"><FiPhone size={13} /></span>
                      <input
                        id="reg-doc-contact"
                        type="tel"
                        name="contact"
                        className="form-input input-with-icon"
                        placeholder="10-digit number"
                        value={form.contact}
                        onChange={handleChange}
                        maxLength={10}
                      />
                    </div>
                    {errors.contact && <p className="form-error">{errors.contact}</p>}
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: 'var(--space-6)' }}>
              <button
                type="submit"
                id="register-submit-btn"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" /> Creating account…</>
                  : <>Create account <FiArrowRight size={14} /></>}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 'var(--space-5)' }}>
            <Link to="/" id="register-back-home" style={{ color: 'var(--text-3)' }}>← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
