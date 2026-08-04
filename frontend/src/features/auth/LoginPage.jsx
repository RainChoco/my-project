import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from './services/authApi';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // PrivateRoute stores the attempted URL in location.state.from
  const returnTo = location.state?.from?.pathname || '/contracts';

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // login() calls POST /api/auth/login, persists token+user via auth.js, returns user
      await login(form);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to connect to server — make sure the backend is running on port 5000.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.blob1} />
      <div style={s.blob2} />

      <div style={s.card}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.logo}>TC</div>
          <div>
            <div style={s.brandName}>Town Council Portal</div>
            <div style={s.brandSub}>Tender Evaluation System</div>
          </div>
        </div>

        <h1 style={s.heading}>Welcome back</h1>
        <p  style={s.subheading}>Sign in to access the procurement portal</p>

        {/* Error */}
        {error && (
          <div style={s.errorBox} role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8"  x2="12"    y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form} noValidate>
          <div style={s.fieldGroup}>
            <label htmlFor="login-email" style={s.label}>Email address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@towncouncil.gov.sg"
              style={s.input}
              onFocus={e => (e.target.style.borderColor = '#2563eb')}
              onBlur={e  => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          <div style={s.fieldGroup}>
            <label htmlFor="login-password" style={s.label}>Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={s.input}
              onFocus={e => (e.target.style.borderColor = '#2563eb')}
              onBlur={e  => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !form.email || !form.password}
            style={{
              ...s.button,
              opacity: loading || !form.email || !form.password ? 0.65 : 1,
              cursor:  loading || !form.email || !form.password ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? <span style={s.btnInner}><span style={s.spinner} />Signing in…</span>
              : 'Sign in'}
          </button>
        </form>

        {/* Demo hint */}
        <div style={s.hint}>
          <span style={s.hintDot} />
          Demo: <code style={s.code}>admin@demo.com</code> / <code style={s.code}>password123</code>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '1rem', position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  blob1: {
    position: 'absolute', top: '-20%', right: '-10%',
    width: '500px', height: '500px', borderRadius: '50%', pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)',
  },
  blob2: {
    position: 'absolute', bottom: '-15%', left: '-10%',
    width: '400px', height: '400px', borderRadius: '50%', pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
  },
  card: {
    background: 'rgba(255,255,255,0.99)', borderRadius: '20px', padding: '2.5rem',
    width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1,
    boxShadow: '0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '2rem' },
  logo: {
    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: '800', fontSize: '1rem',
    boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
  },
  brandName: { fontWeight: '700', fontSize: '1rem', color: '#0f172a', lineHeight: 1.2 },
  brandSub:  { fontSize: '0.75rem', color: '#64748b', marginTop: '2px' },
  heading:   { fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.25rem' },
  subheading:{ fontSize: '0.9rem',  color: '#64748b', margin: '0 0 1.75rem' },
  errorBox: {
    display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: 1.5,
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
    padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.875rem', marginBottom: '1.25rem',
  },
  form:       { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  label:      { fontSize: '0.875rem', fontWeight: '600', color: '#374151' },
  input: {
    padding: '0.75rem 1rem', fontSize: '0.95rem', outline: 'none', width: '100%',
    border: '1.5px solid #d1d5db', borderRadius: '10px', background: '#fafafa',
    color: '#0f172a', boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  button: {
    marginTop: '0.5rem', padding: '0.875rem', width: '100%', border: 'none',
    borderRadius: '10px', fontWeight: '700', fontSize: '0.975rem',
    color: 'white', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'transform 0.15s',
  },
  btnInner: { display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' },
  spinner: {
    display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white',
    animation: 'spin 0.7s linear infinite',
  },
  hint: {
    marginTop: '1.5rem', padding: '0.75rem 1rem', display: 'flex',
    alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
    background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px',
    fontSize: '0.8rem', color: '#0369a1',
  },
  hintDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9', flexShrink: 0 },
  code: {
    background: '#e0f2fe', padding: '1px 5px', borderRadius: '4px',
    fontFamily: 'monospace', fontSize: '0.8rem', color: '#0369a1',
  },
};
