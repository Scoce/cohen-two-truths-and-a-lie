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

  // Check if user is already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Failed to verify session', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
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
            <h1 className={styles.title}>Antigravity</h1>
            <p className={styles.subtitle}>Two Truths and a Lie • AI Edition</p>
          </div>

          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${isLogin ? styles.tabActive : ''}`}
              onClick={() => {
                setIsLogin(true);
                setError('');
                setSuccess('');
                setAge('8');
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
                setAge('8');
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

            {!isLogin && (
              <div className={styles.formGroup}>
                <label htmlFor="age" className={styles.label}>
                  Who is playing?
                </label>
                <select
                  id="age"
                  className={styles.input}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="8">Children (Under 12)</option>
                  <option value="14">Teens (12-17)</option>
                  <option value="25">Adults (18+)</option>
                </select>
              </div>
            )}

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
