import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Heart, Sparkles, LogIn, UserPlus, CheckCircle, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, demoLogin, user } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    if (typeof window !== 'undefined') {
      router.push('/');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.post('/auth/register', { name, email, phone, password });
        if (res.success) {
          await login(email, password);
          router.push('/');
        }
      } else {
        await login(email, password);
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin();
      router.push('/');
    } catch (err: any) {
      setError('Sign-in failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Heart size={32} fill="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            LL LifeLink
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Connected care. Clear medication. Peace of mind.
          </p>
        </div>

        {/* Quick Sign In with Seeded Caregiver Credentials */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn"
            style={{
              width: '100%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              border: '1.5px dashed var(--primary)',
              fontWeight: 700,
              padding: '0.85rem'
            }}
          >
            <Sparkles size={18} />
            <span>{loading ? 'Authenticating...' : 'Sign in as Primary Caregiver (caregiver@lifelink.com)'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: 'var(--text-light)', fontSize: '0.8rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          <span style={{ padding: '0 0.75rem', fontWeight: 600 }}>OR SIGN IN WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isRegister && (
            <>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Ananya Raman"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Mobile Phone Number
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="+91 98400 12345"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="caregiver@lifelink.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Password
            </label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
          >
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            <span>{loading ? 'Please wait...' : isRegister ? 'Create Caregiver Account' : 'Log In to Caregiver Portal'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          {isRegister ? (
            <p style={{ color: 'var(--text-muted)' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Log In
              </button>
            </p>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              New family caregiver?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Create an account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
