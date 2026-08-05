'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.refresh();
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('A connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <style>{`
        .login-page-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background-color: #fafafa;
        }
        .login-form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #ffffff;
        }
        .login-image-side {
          display: none;
          flex: 1.2;
          position: relative;
          background-image: linear-gradient(to right, rgba(0,0,0,0.5), rgba(27, 94, 32, 0.7)), url('/login_food.png');
          background-size: cover;
          background-position: center;
        }
        .login-image-overlay-text {
          position: absolute;
          bottom: 80px;
          left: 60px;
          right: 60px;
          color: #ffffff;
          font-family: var(--font-sans);
        }
        .login-image-overlay-text h2 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .login-image-overlay-text p {
          font-size: 1.1rem;
          opacity: 0.9;
          line-height: 1.6;
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .login-card {
          width: 100%;
          max-width: 380px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .mobile-banner {
          display: block;
          width: 100%;
          height: 140px;
          background-image: linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.6)), url('/login_food.png');
          background-size: cover;
          background-position: center;
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          margin-top: -24px;
          margin-left: -24px;
          margin-right: -24px;
          width: calc(100% + 48px);
          position: relative;
        }
        @media (min-width: 992px) {
          .login-image-side {
            display: flex;
            align-items: flex-end;
          }
          .mobile-banner {
            display: none;
          }
        }
        .glowing-team {
          color: #22C55E;
          font-weight: 800;
          text-shadow: 0 0 4px rgba(34, 197, 94, 0.3);
          animation: pulse-glow 2s ease-in-out infinite;
          transition: color 0.3s ease;
        }
        @keyframes pulse-glow {
          0%, 100% {
            text-shadow: 0 0 3px rgba(34, 197, 94, 0.4), 0 0 6px rgba(34, 197, 94, 0.2);
            color: #22C55E;
          }
          50% {
            text-shadow: 0 0 10px rgba(34, 197, 94, 0.8), 0 0 15px rgba(34, 197, 94, 0.4);
            color: #4ade80;
          }
        }
      `}</style>

      {/* Left side: Login form */}
      <div className="login-form-side">
        <div className="login-card card" style={{ padding: '24px', overflow: 'hidden' }}>
          {/* Mobile Only: Banner food image */}
          <div className="mobile-banner" />

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '8px' }}>
            <img src="/uklogo.png" alt="UK-Chammery Logo" style={{ width: '70px', height: 'auto', marginBottom: '12px' }} />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>
              UK-Chammery
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Smart Office Meal Management System
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ margin: 0 }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="email" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)' }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nimal@ukchammery.com"
                style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', width: '100%' }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="password" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)' }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ padding: '12px 42px 12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', width: '100%' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', minHeight: '44px', fontWeight: 600, marginTop: '8px' }}
            >
              <LogIn size={18} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px', fontWeight: 500 }}>
            crafted by <span className="glowing-team">EPC IT Team</span>
          </div>
        </div>
      </div>

      {/* Right side: Food image overlay */}
      <div className="login-image-side">
        <div className="login-image-overlay-text">
          <h2>Delicious meals, tracked effortlessly.</h2>
          <p>
            Welcome to the UK-Chammery office dining portal. Log in to place daily breakfast, lunch, or dinner requests, check billing estimates, and track wallet transactions.
          </p>
        </div>
      </div>
    </div>
  );
}
