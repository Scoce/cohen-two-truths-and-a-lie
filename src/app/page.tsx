'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CityBackground from '@/components/CityBackground';
import styles from '@/styles/auth.module.css';

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('8');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authChecking, setAuthChecking] = useState(true);

  // Automatically route to game dashboard without requiring any login prompt
  useEffect(() => {
    async function initSessionAndRedirect() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          router.push('/dashboard');
          return;
        }

        // Auto-initialize a guest session so user lands straight into the game
        const guestRes = await fetch('/api/auth/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ age: 10 }),
        });

        if (guestRes.ok) {
          router.push('/dashboard');
        } else {
          setAuthChecking(false);
        }
      } catch (err) {
        console.error('Failed to initialize session', err);
        setAuthChecking(false);
      }
    }
    initSessionAndRedirect();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin
        ? { username: username.trim(), password }
        : { username: username.trim(), password, age: parseInt(age, 10) || 10 };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        if (isLogin) {
          setSuccess('Login successful! Redirecting...');
          router.push('/dashboard');
        } else {
          setSuccess('Signup successful! You can now log in.');
          setIsLogin(true);
          setPassword('');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPlay = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: parseInt(age, 10) || 10 }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to start guest session');
      } else {
        setSuccess('Starting guest session...');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <CityBackground>
        <div style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        }}>
          <p>Verifying session...</p>
        </div>
      </CityBackground>
    );
  }

  return (
    <CityBackground>
      <div className={styles.container}>
        <div className={`${styles.card} glass-panel`}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Truths and Lies</h1>
            <p className={styles.subtitle}>Two Truths and a Lie • AI Edition</p>
          </div>

          {/* Direct Instant Guest Play Hero Button */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div className={styles.formGroup} style={{ marginBottom: '0.75rem', textAlign: 'left' }}>
              <label htmlFor="guestAge" className={styles.label}>
                Who is playing?
              </label>
              <select
                id="guestAge"
                className={styles.input}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                disabled={loading}
              >
                <option value="8">Children (Under 12)</option>
                <option value="14">Teens (12-17)</option>
                <option value="25">Adults (18+)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleGuestPlay}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#fff',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                transition: 'transform 0.15s ease, opacity 0.15s ease',
              }}
            >
              🚀 Play Now as Guest (No Login Required)
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.25rem 0',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ padding: '0 0.75rem' }}>or sign in to save scores</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${isLogin ? styles.tabActive : ''}`}
              onClick={() => {
                setIsLogin(true);
                setError('');
                setSuccess('');
              }}
              disabled={loading}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`${styles.tab} ${!isLogin ? styles.tabActive : ''}`}
              onClick={() => {
                setIsLogin(false);
                setError('');
                setSuccess('');
              }}
              disabled={loading}
            >
              Register
            </button>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <input
                id="username"
                type="text"
                className={styles.input}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </CityBackground>
  );
}
