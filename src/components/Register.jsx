import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-3.3-4.53-6.16-4.53z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const { signUpWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await signUpWithEmail(name, email, password);
      setLoading(false);
      alert('Registration successful! You can now log in.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErrorMsg(err.message || 'Registration failed.');
    }
  };

  const handleGoogleSelect = async (gName, gEmail) => {
    setLoading(true);
    setErrorMsg('');
    setShowGoogleModal(false);
    try {
      await loginWithGoogle(gName, gEmail);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErrorMsg(err.message || 'Google Sign-In failed.');
    }
  };

  return (
    <div className="login-page" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* SaaS Branding Column */}
      <div className="login-hero" style={{
        flex: 1.2,
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 8%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: 'white',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex'
          }}>
            <HeartPulse size={28} />
          </div>
          <span style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
            MediGuardian AI
          </span>
        </div>
        <h2 style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '20px' }}>
          Begin your patient journey.
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', maxWidth: '480px' }}>
          Create your clinical record to log daily regimens, compile diagnostic reports, and share details with care coordinators.
        </p>
      </div>

      {/* Registration Form Column */}
      <div className="login-form-container" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div className="login-form-card" style={{
          width: '100%',
          maxWidth: '420px',
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 className="login-form-title" style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px' }}>
            Register New Patient
          </h2>
          <p className="login-form-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '30px' }}>
            Create a separate local clinical health record.
          </p>

          {errorMsg && (
            <div className="chat-disclaimer" style={{ 
              backgroundColor: 'var(--danger-light)', 
              borderColor: 'rgba(239,68,68,0.2)', 
              color: 'var(--danger-hover)', 
              marginBottom: '20px',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '0.8rem'
            }}>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input" 
                  style={{ paddingLeft: '42px', width: '100%', borderRadius: '12px' }}
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  placeholder="patient@mg-health.org" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input" 
                  style={{ paddingLeft: '42px', width: '100%', borderRadius: '12px' }}
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input" 
                  style={{ paddingLeft: '42px', width: '100%', borderRadius: '12px' }}
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input" 
                  style={{ paddingLeft: '42px', width: '100%', borderRadius: '12px' }}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', padding: '14px', marginTop: '10px', borderRadius: '12px', fontWeight: '700' }}
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Continue with Google */}
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setShowGoogleModal(true)}
            disabled={loading}
            style={{ width: '100%', padding: '12px', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center', fontWeight: '700', borderRadius: '12px' }}
          >
            <GoogleIcon size={18} /> Continue with Google
          </button>

          <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '800', textDecoration: 'none' }}>
              Sign in here
            </Link>
          </div>
        </div>
      </div>

      {/* Simulated Google Accounts Chooser Overlay Dialog Modal */}
      {showGoogleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '30px', animation: 'tabFadeIn 0.3s ease-out', position: 'relative', background: 'white', borderRadius: '24px' }}>
            <button 
              onClick={() => setShowGoogleModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '50%', marginBottom: '12px' }}>
                <GoogleIcon size={28} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Sign in with Google</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Choose a Google account to continue to MediGuardian AI</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Account 1 */}
              <button 
                type="button" 
                onClick={() => handleGoogleSelect('Alex Johnson', 'alex.johnson.demo@gmail.com')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-dark)',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                  AJ
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Alex Johnson</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>alex.johnson.demo@gmail.com</div>
                </div>
              </button>

              {/* Account 2 */}
              <button 
                type="button" 
                onClick={() => handleGoogleSelect('Sarah Williams', 'sarah.williams.demo@gmail.com')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-dark)',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                  SW
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Sarah Williams</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>sarah.williams.demo@gmail.com</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
