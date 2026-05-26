'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Film, Atom, BookOpen, Music as MusicIcon, ArrowRight, LogOut } from 'lucide-react';
import CityBackground from '@/components/CityBackground';
import styles from '@/styles/dashboard.module.css';

interface User {
  id: number;
  username: string;
  score: number;
  age: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingCategory, setGeneratingCategory] = useState('');

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/api/auth/logout', { method: 'POST' }).catch(() => {});
      // Just in case, call the actual correct route as well
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Error during logout:', err);
      router.push('/');
    }
  };

  const handleAgeChange = async (newAge: number) => {
    if (!user) return;
    try {
      const response = await fetch('/api/auth/update-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: newAge }),
      });

      if (!response.ok) {
        throw new Error('Failed to update age');
      }

      setUser(prev => prev ? { ...prev, age: newAge } : null);
    } catch (err) {
      console.error(err);
      alert('Failed to update age. Please try again.');
    }
  };

  const handleSelectCategory = async (categoryId: string, categoryName: string) => {
    setGenerating(true);
    setGeneratingCategory(categoryName);
    try {
      const response = await fetch('/api/game/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate game');
      }

      const data = await response.json();
      router.push(`/game/${data.gameId}`);
    } catch (err) {
      console.error(err);
      alert('Error generating game round. Please try again.');
      setGenerating(false);
    }
  };

  const isKid = user ? user.age < 12 : true;

  const categories: Category[] = [
    {
      id: 'sports',
      name: isKid ? 'Sports Stars' : 'Sports Legends',
      description: isKid
        ? 'Test your knowledge on legendary sports stars like Lionel Messi and LeBron James!'
        : 'Deconstruct facts and myths about legendary athletes, Olympic champions, and world-record holders.',
      icon: <Trophy size={24} />,
      color: '#3b82f6', // blue
      glowColor: 'rgba(59, 130, 246, 0.25)',
    },
    {
      id: 'movies',
      name: isKid ? 'Movie & Cartoons' : 'Actors & Movies',
      description: isKid
        ? 'Find the truths and lies about awesome characters like Elsa, Harry Potter, and superheroes!'
        : 'Crack deep trivia about Hollywood icons, Oscar winners, and legendary filmmakers.',
      icon: <Film size={24} />,
      color: '#ec4899', // pink
      glowColor: 'rgba(236, 72, 153, 0.25)',
    },
    {
      id: 'science',
      name: isKid ? 'Science & Space' : 'Science & Tech',
      description: isKid
        ? 'Guess truths and lies about cool inventors, astronauts, and science explorers!'
        : 'Discover truths and lies about geniuses, breakthrough inventors, and tech visionaries.',
      icon: <Atom size={24} />,
      color: '#10b981', // green
      glowColor: 'rgba(16, 185, 129, 0.25)',
    },
    {
      id: 'history',
      name: isKid ? 'History & Kings' : 'Historical Figures',
      description: isKid
        ? 'Explore cool history facts, ancient Egypt, pharaohs, and brave adventurers!'
        : 'Explore ancient rulers, revolutionary leaders, and historical figures who shaped the world.',
      icon: <BookOpen size={24} />,
      color: '#eab308', // yellow/gold
      glowColor: 'rgba(234, 179, 8, 0.25)',
    },
    {
      id: 'music',
      name: isKid ? 'Pop Stars & Music' : 'Musicians & Bands',
      description: isKid
        ? 'Sort facts from fiction about singers like Taylor Swift and other fun musicians!'
        : 'Sort facts from fiction regarding rock stars, pop icons, and classical virtuosos.',
      icon: <MusicIcon size={24} />,
      color: '#a855f7', // purple
      glowColor: 'rgba(168, 85, 247, 0.25)',
    },
  ];

  if (loading) {
    return (
      <CityBackground>
        <div style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        }}>
          <p>Loading your dashboard...</p>
        </div>
      </CityBackground>
    );
  }

  return (
    <CityBackground>
      <div className={styles.container}>
        {/* Header */}
        <header className={`${styles.header} glass-panel`}>
          <div className={styles.title}>Antigravity</div>
          {user && (
            <div className={styles.userInfo}>
              <div className={styles.ageSelectorGroup}>
                <span className={styles.ageLabel}>Age:</span>
                <select
                  value={user.age}
                  onChange={(e) => handleAgeChange(parseInt(e.target.value, 10))}
                  className={styles.ageSelect}
                  aria-label="Change age group"
                >
                  {Array.from({ length: 93 }, (_, i) => i + 8).map((a) => (
                    <option key={a} value={a}>
                      {a === 100 ? '100+' : a}
                    </option>
                  ))}
                </select>
              </div>
              <span className={styles.username}>{user.username}</span>
              <span className={styles.scoreBadge}>{user.score} pts</span>
              <button 
                onClick={handleLogout} 
                className={styles.logoutBtn}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </header>

        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <h2 className={styles.welcomeTitle}>Choose a Fun Category!</h2>
          <p className={styles.welcomeDesc}>
            Pick a topic below. The Gemini AI will make two truths and a lie about a famous person or cartoon character. Can you find the lie?
          </p>
        </div>

        {/* Categories Grid */}
        <div className={styles.grid}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`${styles.categoryCard} glass-panel`}
              style={{
                // Custom properties passed down to CSS
                ['--card-color' as any]: cat.color,
                ['--card-color-glow' as any]: cat.glowColor,
              }}
              onClick={() => handleSelectCategory(cat.id, cat.name)}
            >
              <div className={styles.iconWrapper}>{cat.icon}</div>
              <h3 className={styles.cardTitle}>{cat.name}</h3>
              <p className={styles.cardDescription}>{cat.description}</p>
              <button type="button" className={styles.playBtn} aria-label={`Play ${cat.name}`}>
                Play Now <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Generating Overlay */}
      {generating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(9, 9, 14, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          zIndex: 9999,
          padding: '2rem',
          textAlign: 'center'
        }}>
          {/* Loading Spinner */}
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(168, 85, 247, 0.1)',
            borderTop: '4px solid var(--neon-purple)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
              Consulting the AI Wizard...
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
              Gemini AI is writing two truths and a lie about a famous star or character in <strong>{generatingCategory}</strong>...
            </p>
          </div>
          
          <style jsx global>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </CityBackground>
  );
}
