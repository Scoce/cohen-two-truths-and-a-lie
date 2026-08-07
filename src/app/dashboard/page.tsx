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
  isGuest?: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

interface LeaderboardEntry {
  id: number;
  playerName: string;
  score: number;
  category: string;
  ageGroup: string;
  createdAt: string;
}

interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  badgeColor: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingCategory, setGeneratingCategory] = useState('');
  
  // Modal states
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'Children' | 'Teens' | 'Adults'>('Adults');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // Auth modal for guests (Login or Register)
  const [showSaveAccountModal, setShowSaveAccountModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register');
  const [saveUsername, setSaveUsername] = useState('');
  const [savePassword, setSavePassword] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const handleLoginAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: saveUsername.trim(),
          password: savePassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Failed to log in');
      } else {
        if (data.user) {
          setUser({ ...data.user, isGuest: false });
        } else {
          // Re-fetch me
          const meRes = await fetch('/api/auth/me');
          if (meRes.ok) {
            const meData = await meRes.json();
            setUser({ ...meData.user, isGuest: false });
          }
        }
        setShowSaveAccountModal(false);
        setSaveUsername('');
        setSavePassword('');
      }
    } catch (err) {
      console.error(err);
      setSaveError('Connection error. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: saveUsername.trim(),
          password: savePassword,
          age: user?.age || 10,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Failed to save account');
      } else {
        // Automatically log in after signup
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: saveUsername.trim(), password: savePassword }),
        });

        if (user) {
          setUser({ ...user, username: saveUsername.trim(), isGuest: false });
        }
        setShowSaveAccountModal(false);
        setSaveUsername('');
        setSavePassword('');
      }
    } catch (err) {
      console.error(err);
      setSaveError('Connection error. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const [difficulty, setDifficulty] = useState<string>('Medium');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trivia_difficulty');
      if (saved) {
        setTimeout(() => {
          setDifficulty(saved);
        }, 0);
      }
    }
  }, []);

  const handleDifficultyChange = (newDifficulty: string) => {
    setDifficulty(newDifficulty);
    localStorage.setItem('trivia_difficulty', newDifficulty);
  };

  useEffect(() => {
    async function fetchUserAndLeaderboard() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        setUser(data.user);

        // Set default leaderboard tab based on user age
        if (data.user.age < 12) {
          setActiveLeaderboardTab('Children');
        } else if (data.user.age < 18) {
          setActiveLeaderboardTab('Teens');
        } else {
          setActiveLeaderboardTab('Adults');
        }

        // Fetch leaderboard
        const leaderboardRes = await fetch('/api/leaderboard');
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          setLeaderboard(leaderboardData.leaderboard || []);
        }

        // Fetch achievements
        const achievementsRes = await fetch('/api/achievements');
        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json();
          setAchievements(achievementsData.achievements || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    fetchUserAndLeaderboard();
  }, [router]);

  const handleLogout = async () => {
    try {
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
      
      // Update active tab based on new age selection
      if (newAge < 12) {
        setActiveLeaderboardTab('Children');
      } else if (newAge < 18) {
        setActiveLeaderboardTab('Teens');
      } else {
        setActiveLeaderboardTab('Adults');
      }
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
        body: JSON.stringify({ category: categoryId, difficulty }),
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

  // Calculate active bucket for dropdown value
  let activeBucket = '25';
  if (user) {
    if (user.age < 12) activeBucket = '8';
    else if (user.age < 18) activeBucket = '14';
  }

  const categories: Category[] = [
    {
      id: 'sports',
      name: isKid ? 'Sports Stars' : 'Sports Legends',
      description: isKid
        ? 'Test your knowledge on legendary sports stars like Lionel Messi and LeBron James!'
        : 'Deconstruct facts and myths about legendary athletes, Olympic champions, and world-record holders.',
      icon: <Trophy size={24} />,
      color: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.25)',
    },
    {
      id: 'movies',
      name: isKid ? 'Movie & Cartoons' : 'Actors & Movies',
      description: isKid
        ? 'Find the truths and lies about awesome characters like Elsa, Harry Potter, and superheroes!'
        : 'Crack deep trivia about Hollywood icons, Oscar winners, and legendary filmmakers.',
      icon: <Film size={24} />,
      color: '#ec4899',
      glowColor: 'rgba(236, 72, 153, 0.25)',
    },
    {
      id: 'science',
      name: isKid ? 'Science & Space' : 'Science & Tech',
      description: isKid
        ? 'Guess truths and lies about cool inventors, astronauts, and science explorers!'
        : 'Discover truths and lies about geniuses, breakthrough inventors, and tech visionaries.',
      icon: <Atom size={24} />,
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.25)',
    },
    {
      id: 'history',
      name: isKid ? 'History & Kings' : 'Historical Figures',
      description: isKid
        ? 'Explore cool history facts, ancient Egypt, pharaohs, and brave adventurers!'
        : 'Explore ancient rulers, revolutionary leaders, and historical figures who shaped the world.',
      icon: <BookOpen size={24} />,
      color: '#eab308',
      glowColor: 'rgba(234, 179, 8, 0.25)',
    },
    {
      id: 'music',
      name: isKid ? 'Pop Stars & Music' : 'Musicians & Bands',
      description: isKid
        ? 'Sort facts from fiction about singers like Taylor Swift and other fun musicians!'
        : 'Sort facts from fiction regarding rock stars, pop icons, and classical virtuosos.',
      icon: <MusicIcon size={24} />,
      color: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.25)',
    },
  ];

  const filteredLeaderboard = leaderboard.filter(
    (entry) => entry.ageGroup === activeLeaderboardTab
  );

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
          <div className={styles.title}>Truths and Lies</div>
          {user && (
            <div className={styles.userInfo}>
              <button 
                onClick={() => {
                  if (user?.isGuest) {
                    setAuthTab('register');
                    setShowSaveAccountModal(true);
                  } else {
                    router.push('/classroom');
                  }
                }}
                className={styles.achievementsLink}
                style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(168, 85, 247, 0.4) 100%)', borderColor: 'rgba(168, 85, 247, 0.5)' }}
                title="Open Teacher & Classroom Hub"
              >
                🍎 Teacher Hub
              </button>
              <button 
                onClick={() => setShowLeaderboardModal(true)} 
                className={styles.leaderboardLink}
                title="View Monthly Leaderboard"
              >
                <Trophy size={16} /> Hall of Fame
              </button>

              {user.isGuest ? (
                <>
                  <button
                    onClick={() => {
                      setAuthTab('login');
                      setShowSaveAccountModal(true);
                    }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    🔑 Log In / Register
                  </button>
                  <span className={styles.username} style={{ opacity: 0.8 }}>🎮 Guest</span>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setShowAchievementsModal(true)} 
                    className={styles.achievementsLink}
                    title="View My Badges"
                  >
                    🏅 Badges
                  </button>
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
                </>
              )}
            </div>
          )}
        </header>

        {/* Guest Banner */}
        {user?.isGuest && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            margin: '1.25rem 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            backdropFilter: 'blur(8px)',
          }}>
            <div>
              <strong style={{ color: '#fff' }}>Playing as Guest:</strong>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                Log in or create a free account to preserve your leaderboard score & unlock Smartboard Classroom Tools!
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setShowSaveAccountModal(true);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                🔑 Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setShowSaveAccountModal(true);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(168, 85, 247, 0.3)',
                }}
              >
                ✨ Create Account
              </button>
            </div>
          </div>
        )}

        {/* Welcome Section & Solo Game Settings Toolbar */}
        <div className={styles.welcomeSection} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <h2 className={styles.welcomeTitle}>Choose a Fun Category!</h2>
            <p className={styles.welcomeDesc}>
              Pick a topic below. The Gemini AI will make two truths and a lie about a famous person or cartoon character. Can you find the lie?
            </p>
          </div>

          {/* Solo Game Controls Toolbar */}
          <div className={styles.soloToolbar}>
            <div className={styles.ageSelectorGroup}>
              <span className={styles.ageLabel}>Playing:</span>
              <select
                value={activeBucket}
                onChange={(e) => handleAgeChange(parseInt(e.target.value, 10))}
                className={styles.ageSelect}
                aria-label="Change age group"
              >
                <option value="8">Children (Under 12)</option>
                <option value="14">Teens (12-17)</option>
                <option value="25">Adults (18+)</option>
              </select>
            </div>

            <div className={styles.ageSelectorGroup}>
              <span className={styles.ageLabel}>Difficulty:</span>
              <select
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                className={styles.ageSelect}
                aria-label="Change difficulty"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Grid (Takes up full width) */}
        <div className={styles.grid}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`${styles.categoryCard} glass-panel`}
              style={{
                '--card-color': cat.color,
                '--card-color-glow': cat.glowColor,
              } as React.CSSProperties}
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

      {/* Monthly Leaderboard Modal */}
      {showLeaderboardModal && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowLeaderboardModal(false)}
        >
          <div 
            className={`${styles.modalContent} glass-panel`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitleGroup}>
                <Trophy size={22} color="var(--neon-cyan)" style={{ filter: 'drop-shadow(0 0 5px var(--neon-cyan-glow))' }} />
                <div>
                  <h3 className={styles.modalTitle}>Monthly Hall of Fame</h3>
                  <div className={styles.modalSubtitle}>Top Players this month</div>
                </div>
              </div>
              <button 
                className={styles.closeBtn} 
                onClick={() => setShowLeaderboardModal(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Leaderboard Age Category Tabs */}
              <div className={styles.tabsContainer}>
                <button 
                  onClick={() => setActiveLeaderboardTab('Children')}
                  className={`${styles.tabBtn} ${activeLeaderboardTab === 'Children' ? styles.activeTab : ''}`}
                >
                  Children (Under 12)
                </button>
                <button 
                  onClick={() => setActiveLeaderboardTab('Teens')}
                  className={`${styles.tabBtn} ${activeLeaderboardTab === 'Teens' ? styles.activeTab : ''}`}
                >
                  Teens (12-17)
                </button>
                <button 
                  onClick={() => setActiveLeaderboardTab('Adults')}
                  className={`${styles.tabBtn} ${activeLeaderboardTab === 'Adults' ? styles.activeTab : ''}`}
                >
                  Adults (18+)
                </button>
              </div>

              <div className={styles.leaderboardList}>
                {filteredLeaderboard.length > 0 ? (
                  filteredLeaderboard.map((entry, index) => {
                    const rank = index + 1;
                    let rankClass = styles.playerRank;
                    if (rank === 1) rankClass += ` ${styles.playerRank1}`;
                    else if (rank === 2) rankClass += ` ${styles.playerRank2}`;
                    else if (rank === 3) rankClass += ` ${styles.playerRank3}`;

                    const isCurrentUser = user && entry.playerName.toLowerCase() === user.username.toLowerCase();
                    const itemClass = `${styles.leaderboardItem} ${isCurrentUser ? styles.leaderboardItemActive : ''}`;

                    return (
                      <div key={entry.id} className={itemClass}>
                        <div className={rankClass}>#{rank}</div>
                        <div className={styles.playerInfo}>
                          <div className={styles.playerNameText}>{entry.playerName}</div>
                          <div className={styles.playerMetaText}>
                            {entry.category}
                          </div>
                        </div>
                        <div className={styles.playerScore}>{entry.score} pts</div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyLeaderboard}>
                    No entries yet in the {activeLeaderboardTab} division. Be the first to claim a spot!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {showAchievementsModal && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowAchievementsModal(false)}
        >
          <div 
            className={`${styles.modalContent} glass-panel`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitleGroup}>
                <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 5px var(--neon-purple-glow))' }}>🏅</span>
                <div>
                  <h3 className={styles.modalTitle}>My Badges</h3>
                  <div className={styles.modalSubtitle}>Track your trivia achievements</div>
                </div>
              </div>
              <button 
                className={styles.closeBtn} 
                onClick={() => setShowAchievementsModal(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.achievementsGrid}>
                {achievements.map((ach) => (
                  <div 
                    key={ach.key} 
                    className={`${styles.achievementCard} ${ach.unlocked ? '' : styles.achievementCardLocked}`}
                    style={{
                      '--ach-color': ach.badgeColor,
                    } as React.CSSProperties}
                  >
                    <div className={styles.achievementIcon}>{ach.icon}</div>
                    <div className={styles.achievementInfo}>
                      <h4 className={styles.achievementName}>{ach.name}</h4>
                      <p className={styles.achievementDesc}>{ach.description}</p>
                      {ach.unlocked ? (
                        <span className={styles.unlockedBadge}>
                          Unlocked {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : ''}
                        </span>
                      ) : (
                        <span className={styles.lockedBadge}>Locked</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dual-Tab Auth Modal */}
      {showSaveAccountModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSaveAccountModal(false)}>
          <div className={`${styles.modalContent} glass-panel`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setSaveError(''); }}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: authTab === 'login' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'transparent',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  🔑 Log In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setSaveError(''); }}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: authTab === 'register' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'transparent',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  ✨ Create Free Account
                </button>
              </div>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowSaveAccountModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={authTab === 'login' ? handleLoginAccount : handleSaveAccount} className={styles.modalBody} style={{ gap: '1rem', display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {authTab === 'login'
                  ? 'Welcome back! Log into your account to access your high scores and Smartboard Tools.'
                  : 'Create a free account to save your scores on the leaderboard and unlock Smartboard Classroom Tools!'}
              </p>

              {saveError && <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>⚠️ {saveError}</div>}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#fff' }}>Username</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={saveUsername}
                  onChange={(e) => setSaveUsername(e.target.value)}
                  disabled={saveLoading}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#fff' }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={savePassword}
                  onChange={(e) => setSavePassword(e.target.value)}
                  disabled={saveLoading}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                {saveLoading
                  ? 'Processing...'
                  : authTab === 'login'
                  ? '🔑 Log In Now'
                  : '✨ Save & Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

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
