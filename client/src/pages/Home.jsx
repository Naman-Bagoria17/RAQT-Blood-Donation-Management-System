import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  FiDroplet,
  FiUserCheck,
  FiActivity,
  FiArrowRight,
  FiShield,
  FiClock,
  FiUsers,
} from 'react-icons/fi';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_TYPE_INFO = [
  { type: 'A+', note: 'Can donate to A+, AB+', featured: false },
  {type: 'A-', note: 'Universal \RH\ donor', featured: false },
  { type: 'B+', note: 'Can donate to B+, AB+', featured: false },
  { type: 'B-', note: 'Can donate to B, AB', featured: false },
  { type: 'AB+', note: 'Universal recipient', featured: true },
  { type: 'AB-', note: 'Can donate plasma to all', featured: false },
  { type: 'O+', note: 'Most common blood type', featured: false },
  { type: 'O-', note: 'Universal red cell donor', featured: true },
];

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="page-wrapper home-page">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb-1" />
          <div className="hero-orb-2" />
        </div>

        <div className="container">
          <div className="hero-inner">

            {/* Left content */}
            <div>
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-dot" />
                <span>Blood Donation Management</span>
              </div>

              <h1 className="hero-heading">
                The bridge between<br />
                those who give and<br />
                those <em>who need.</em>
              </h1>

              <p className="hero-sub">
                BloodConnect makes it simple for donors to stay registered and
                for medical professionals to coordinate life-saving transfusions —
                all in one secure platform.
              </p>

              <div className="hero-actions">
                {isAuthenticated ? (
                  <Link
                    to={user?.role === 'donor' ? '/donor/dashboard' : '/doctor/dashboard'}
                    id="hero-dashboard-btn"
                    className="btn btn-primary"
                  >
                    Go to Dashboard <FiArrowRight size={15} />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" id="hero-register-btn" className="btn btn-primary">
                      Start as Donor <FiArrowRight size={15} />
                    </Link>
                    <Link to="/register" id="hero-doctor-btn" className="btn btn-outline"
                      state={{ defaultRole: 'doctor' }}>
                      Join as Doctor
                    </Link>
                  </>
                )}
              </div>

              <div className="hero-trust">
                <div className="trust-item">
                  <span className="trust-value">8</span>
                  <span className="trust-label">Blood types tracked</span>
                </div>
                <div className="trust-sep" />
                <div className="trust-item">
                  <span className="trust-value">2</span>
                  <span className="trust-label">Roles — Donor & Doctor</span>
                </div>
                <div className="trust-sep" />
                <div className="trust-item">
                  <span className="trust-value">JWT</span>
                  <span className="trust-label">Secure authentication</span>
                </div>
              </div>
            </div>

            {/* Right visual — blood type cards */}
            <div className="hero-visual">
              <div className="blood-type-grid">
                {BLOOD_TYPE_INFO.map((bt) => (
                  <div key={bt.type} className={`blood-type-card${bt.featured ? ' featured' : ''}`}>
                    <FiDroplet size={14} color="var(--red)" />
                    <span className="blood-type-label">{bt.type}</span>
                    <span className="blood-type-note">{bt.note}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how-it-works" className="section" style={{ borderTop: '1px solid var(--border-1)' }}>
        <div className="container">
          <div className="section-header">
            <p className="label">How it works</p>
            <h2 className="section-heading">
              From registration to<br />coordination — in minutes.
            </h2>
            <p className="section-sub">
              No complex onboarding. No paperwork. Just a streamlined system
              designed for clarity and speed when it matters most.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-connector" />
            <div className="step-connector step-connector-2" />

            <div className="step-card">
              <span className="step-number">01</span>
              <h3 className="step-title">Create your account</h3>
              <p className="step-desc">
                Register as a donor or doctor in under two minutes. Choose your role,
                enter your details, and you're in — no email verification required.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>
              <h3 className="step-title">Complete your profile</h3>
              <p className="step-desc">
                Donors add their blood group and last donation date.
                Doctors link their hospital. All information is stored securely
                and can be updated anytime from your dashboard.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>
              <h3 className="step-title">Access role-based tools</h3>
              <p className="step-desc">
                Your dashboard is tailored to your role. Donors track their
                donation history. Medical professionals manage coordination
                and view relevant donor data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Blood Types ───────────────────────────────────────── */}
      <section id="blood-types" className="section-sm blood-types-section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
            <p className="label">All blood groups</p>
            <h2 className="section-heading" style={{ fontSize: '1.6rem' }}>
              Every type matters.
            </h2>
          </div>
          <div className="blood-types-full-grid">
            {BLOOD_TYPES.map((bt) => (
              <div key={bt} className="btf-card">
                <span className="btf-type">{bt}</span>
                <span className="btf-label">Blood Type</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-6)',
          }}>
            {[
              {
                icon: <FiShield size={20} />,
                title: 'Secure by design',
                desc: 'JWT authentication, bcrypt password hashing, and role-based access control protecting every endpoint.',
              },
              {
                icon: <FiUsers size={20} />,
                title: 'Built for both sides',
                desc: 'Donors and doctors each get a purpose-built interface. One system, two experiences — no overlap, no confusion.',
              },
              {
                icon: <FiClock size={20} />,
                title: 'Always up to date',
                desc: 'Update your blood group, last donation date, or hospital affiliation whenever things change — real-time data, always.',
              },
            ].map((item) => (
              <div key={item.title} className="panel">
                <div className="panel-body">
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--r-sm)',
                    background: 'var(--red-subtle)', border: '1px solid var(--red-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--red-light)', marginBottom: 'var(--space-5)',
                  }}>
                    {item.icon}
                  </div>
                  <h3 style={{
                    fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-1)',
                    marginBottom: 'var(--space-2)', letterSpacing: '-0.01em',
                  }}>{item.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="section-sm">
        <div className="container">
          <div className="cta-strip">
            <div className="cta-strip-text">
              <h2>Ready to make a difference?</h2>
              <p>
                Join the network today. Registration is free, fast, and your
                information is always in your control.
              </p>
            </div>
            <div className="cta-strip-actions">
              {isAuthenticated ? (
                <Link
                  to={user?.role === 'donor' ? '/donor/dashboard' : '/doctor/dashboard'}
                  id="cta-dashboard-btn"
                  className="btn btn-primary"
                >
                  Open Dashboard <FiArrowRight size={14} />
                </Link>
              ) : (
                <>
                  <Link to="/register" id="cta-register-btn" className="btn btn-primary">
                    Register now <FiArrowRight size={14} />
                  </Link>
                  <Link to="/login" id="cta-login-btn" className="btn btn-outline">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-inner">
            <span className="footer-copy">
              © {new Date().getFullYear()} BloodConnect — Phase 1 Demo
            </span>
            <ul className="footer-links">
              <li><Link to="/" id="footer-home-link">Home</Link></li>
              <li><Link to="/login" id="footer-login-link">Login</Link></li>
              <li><Link to="/register" id="footer-register-link">Register</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
