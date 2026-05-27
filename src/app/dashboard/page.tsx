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

interface LeaderboardEntry {
  id: number;
  playerName: string;
  score: number;
  category: string;
  ageGroup: string;
  createdAt: string;
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
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

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
      await fetch('/api/api/auth/logout', { method: 'POST' }).catch(() => {});
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
              <button 
                onClick={() => setShowLeaderboardModal(true)} 
                className={styles.leaderboardLink}
                title="View Monthly Leaderboard"
              >
                <Trophy size={16} /> Hall of Fame
              </button>
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

        {/* Categories Grid (Takes up full width) */}
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
                      ['--ach-color' as any]: ach.badgeColor,
                    }}
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
