'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Award, RefreshCw, LayoutDashboard } from 'lucide-react';
import CityBackground from '@/components/CityBackground';
import styles from '@/styles/game.module.css';
import SoundEffects from '@/lib/soundEffects';
import Confetti from '@/components/Confetti';

interface GameState {
  gameId: number;
  persona: string;
  category: string;
  facts: string[];
  guessedIndex?: number;
  lieIndex?: number;
  isCorrect?: boolean;
  played: boolean;
}

export default function GameRound() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const [game, setGame] = useState<GameState | null>(null);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Transitions
  const [showResult, setShowResult] = useState(false);

  // Session stats
  const [sessionProgress, setSessionProgress] = useState<number | null>(null);
  const [sessionScore, setSessionScore] = useState<number | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Leaderboard submit
  const [playerName, setPlayerName] = useState('');
  const [submittingLeaderboard, setSubmittingLeaderboard] = useState(false);
  const [leaderboardSubmitted, setLeaderboardSubmitted] = useState(false);

  // Hints & Streaks
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [activeHint, setActiveHint] = useState('');
  const [fetchingHint, setFetchingHint] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  const [showHintModal, setShowHintModal] = useState(false);
  const [nextGameId, setNextGameId] = useState<number | null>(null);
  const [pregenerating, setPregenerating] = useState(false);
  const nextGameIdRef = React.useRef<number | null>(null);

  const [confettiActive, setConfettiActive] = useState(false);
  const [unlockedToast, setUnlockedToast] = useState<{ name: string; description: string; icon: string; key: string } | null>(null);

  const ACHIEVEMENT_DETAILS: Record<string, { name: string; description: string; icon: string }> = {
    trivia_rookie: { name: 'Trivia Rookie', description: 'Find your first lie!', icon: '👶' },
    on_fire: { name: 'On Fire', description: 'Reach a streak of 3 correct answers in a session.', icon: '🔥' },
    lie_detector: { name: 'Lie Detector', description: 'Get all 10 answers correct in a single session!', icon: '🔎' },
    hintless_wonder: { name: 'Hintless Wonder', description: 'Complete a full session without using any hints.', icon: '🧠' },
    trivia_master: { name: 'Trivia Master', description: 'Reach a lifetime score of 500 points.', icon: '👑' },
  };

  const handleRequestHint = async () => {
    if (!game || game.played || fetchingHint) return;

    if (activeHint) {
      setShowHintModal(true);
      return;
    }

    if (hintsUsed >= 2) return;

    setFetchingHint(true);
    try {
      const res = await fetch('/api/game/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.gameId }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch hint');
      }

      const result = await res.json();
      setActiveHint(result.hint);
      setHintsUsed(result.hintsUsed);
      setShowHintModal(true);
    } catch (err) {
      console.error(err);
      alert('Error fetching hint. Please try again.');
    } finally {
      setFetchingHint(false);
    }
  };

  // 1. Fetch game details and current user score on mount
  useEffect(() => {
    if (!gameId) return;

    async function initPage() {
      try {
        // Fetch game details
        const gameRes = await fetch(`/api/game/${gameId}`);
        if (!gameRes.ok) {
          setError('Failed to load game round');
          setLoading(false);
          return;
        }
        const gameData = await gameRes.json();
        setGame(gameData);

        if (gameData.played) {
          setShowResult(true);
        }

        if (gameData.sessionProgress !== undefined) {
          setSessionProgress(gameData.sessionProgress);
          setSessionScore(gameData.sessionScore);
          setSessionCompleted(gameData.sessionCompleted);
          setSessionId(gameData.sessionId);
          setHintsUsed(gameData.hintsUsed || 0);
          setCurrentStreak(gameData.currentStreak || 0);
          setCorrectCount(gameData.correctCount || 0);
          if (gameData.played) {
            setPointsEarned(gameData.isCorrect ? (gameData.currentStreak >= 3 ? 30 : 20) : 0);
          }
        }

        // Fetch user stats for header
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserScore(userData.user.score);
          setUsername(userData.user.username);
          setPlayerName(userData.user.username);
        }
      } catch (err) {
        console.error(err);
        setError('Connection error. Failed to load game.');
      } finally {
        setLoading(false);
      }
    }

    initPage();
  }, [gameId]);

  // Background pre-generation for the next session round
  useEffect(() => {
    if (!game || game.played || sessionCompleted || nextGameId || pregenerating) return;
    if (sessionProgress !== null && sessionProgress >= 10) return;

    async function pregenerateNextRound() {
      setPregenerating(true);
      try {
        const response = await fetch('/api/game/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: game?.category }),
        });
        if (response.ok) {
          const data = await response.json();
          setNextGameId(data.gameId);
          nextGameIdRef.current = data.gameId;
        }
      } catch (err) {
        console.error('[pregenerate] Background generation failed:', err);
      } finally {
        setPregenerating(false);
      }
    }

    const timer = setTimeout(pregenerateNextRound, 800);
    return () => clearTimeout(timer);
  }, [game, sessionProgress, sessionCompleted, nextGameId, pregenerating]);

  // 2. Submit guess
  const handleGuess = async (index: number) => {
    if (!game || game.played || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/game/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.gameId,
          guessedIndex: index,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit guess');
      }

      const result = await res.json();
      
      // Update local state with result
      setGame(prev => prev ? {
        ...prev,
        played: true,
        guessedIndex: index,
        lieIndex: result.lieIndex,
        isCorrect: result.isCorrect,
      } : null);

      setSessionProgress(result.sessionProgress);
      setSessionScore(result.sessionScore);
      setSessionCompleted(result.sessionCompleted);
      setCurrentStreak(result.currentStreak || 0);
      setPointsEarned(result.pointsEarned !== undefined ? result.pointsEarned : (result.isCorrect ? 20 : 0));
      setCorrectCount(result.correctCount || 0);

      // Update header score
      setUserScore(result.updatedScore);

      // Play audio feedback
      if (result.isCorrect) {
        SoundEffects.playCorrect();
      } else {
        SoundEffects.playWrong();
      }

      // If session complete, play fanfare and trigger confetti
      if (result.sessionCompleted) {
        SoundEffects.playSessionComplete();
        setConfettiActive(true);
      }

      // Check for newly unlocked achievements
      if (result.newlyUnlocked && result.newlyUnlocked.length > 0) {
        SoundEffects.playAchievement();
        let delay = 0;
        result.newlyUnlocked.forEach((key: string) => {
          const detail = ACHIEVEMENT_DETAILS[key];
          if (detail) {
            setTimeout(() => {
              setUnlockedToast({ ...detail, key });
              // Hide toast after 4 seconds
              setTimeout(() => {
                setUnlockedToast(null);
              }, 4000);
            }, delay);
            delay += 4500;
          }
        });
      }

      // Transition to results screen
      setTimeout(() => {
        setShowResult(true);
      }, 300);
    } catch (err) {
      console.error(err);
      alert('Error submitting guess. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Play again (uses pre-generated round or generates on demand)
  const handlePlayAgain = async () => {
    if (!game) return;

    if (nextGameIdRef.current) {
      router.push(`/game/${nextGameIdRef.current}`);
      return;
    }

    setLoading(true);

    if (pregenerating) {
      // Poll for the background generation to finish
      const checkInterval = setInterval(() => {
        if (nextGameIdRef.current) {
          clearInterval(checkInterval);
          router.push(`/game/${nextGameIdRef.current}`);
        }
      }, 100);
      
      // Cancel after 8 seconds and try manual fallback
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!nextGameIdRef.current) {
          generateManualFallback();
        }
      }, 8000);
      return;
    }

    await generateManualFallback();
  };

  const generateManualFallback = async () => {
    if (!game) return;
    try {
      const response = await fetch('/api/game/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: game.category }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate game');
      }

      const data = await response.json();
      router.push(`/game/${data.gameId}`);
    } catch (err) {
      console.error(err);
      alert('Error generating a new game round.');
      setLoading(false);
    }
  };

  // 4. Submit to Monthly Leaderboard
  const handleLeaderboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !playerName.trim() || submittingLeaderboard) return;

    setSubmittingLeaderboard(true);
    try {
      const res = await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          playerName: playerName.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit to leaderboard');
      }

      setLeaderboardSubmitted(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error submitting name. Please try again.');
    } finally {
      setSubmittingLeaderboard(false);
    }
  };

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
          <p>Preparing the trivia round...</p>
        </div>
      </CityBackground>
    );
  }

  if (error || !game) {
    return (
      <CityBackground>
        <div style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '2rem',
          color: 'var(--text-secondary)'
        }}>
          <p>{error || 'Game round not found'}</p>
          <button onClick={() => router.push('/dashboard')} className={styles.backBtn}>
            <ChevronLeft size={16} /> Return to Dashboard
          </button>
        </div>
      </CityBackground>
    );
  }

  let cardsContainerClass = styles.cardsContainer;
  if (game.played && !showResult) {
    cardsContainerClass += ` ${styles.fadeOut}`;
  }

  return (
    <CityBackground>
      {currentStreak >= 3 && <div className={styles.hotStreakBorder} />}
      <div className={`${styles.container} ${currentStreak >= 3 ? styles.hotStreak : ''}`}>
        {/* Header */}
        <header className={`${styles.header} glass-panel`}>
          <button onClick={() => router.push('/dashboard')} className={styles.backBtn} aria-label="Dashboard">
            <ChevronLeft size={16} />
            <span className={styles.backBtnText}>Dashboard</span>
          </button>
          
          <div className={styles.headerGroups}>
            {sessionProgress !== null && (
              <div className={styles.sessionBadge}>
                <span className={styles.sessionLabelText}>Session: </span>
                <span className={styles.sessionVal}>{sessionProgress}/10</span>
              </div>
            )}

            {sessionProgress !== null && currentStreak > 0 && (
              <div className={`${styles.streakBadge} ${currentStreak >= 3 ? styles.hotStreakBadge : ''}`}>
                <span>🔥 </span>
                <span className={styles.streakLabelText}>Streak: </span>
                <span className={styles.streakVal}>{currentStreak}</span>
              </div>
            )}
            
            {userScore !== null && (
              <div className={styles.scoreGroup}>
                <span>🏆 </span>
                <span className={styles.scoreLabelText}>Score: </span>
                <span className={styles.scoreVal}>{userScore}</span>
                <span className={styles.scorePtsText}> pts</span>
              </div>
            )}
          </div>
        </header>

        {/* Persona Title */}
        <div className={styles.introSection}>
          <span className={styles.categoryLabel}>{game.category} edition</span>
          <h1 className={styles.personaName}>{game.persona}</h1>
          <p className={styles.promptText}>
            {showResult 
              ? 'Results revealed!' 
              : 'Two of these statements are true. One is a lie. Click on the lie!'
            }
          </p>
          {!showResult && !game.played && (
            <div>
              {activeHint ? (
                <button
                  onClick={() => setShowHintModal(true)}
                  className={styles.compactHintBtn}
                  style={{ borderColor: 'var(--neon-purple)', background: 'rgba(168, 85, 247, 0.15)' }}
                >
                  🔮 View Hint Riddle
                </button>
              ) : (
                hintsUsed < 2 && (
                  <button
                    onClick={handleRequestHint}
                    disabled={fetchingHint}
                    className={styles.compactHintBtn}
                  >
                    {fetchingHint ? '🔮 Fetching Hint...' : `🔮 Need a Hint? (${2 - hintsUsed} left)`}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Hint Lifeline Panel (Removed to prevent vertical layout bloat) */}

        {/* Shuffled Fact Cards (hidden once result is shown) */}
        {!showResult && (
          <div className={cardsContainerClass}>
            {game.facts.map((fact, index) => {
              let cardClass = `${styles.card} glass-panel`;
              let badgeText = '';
              let badgeClass = '';

              if (game.played) {
                cardClass += ` ${styles.revealed}`;
                
                const isThisLie = index === game.lieIndex;
                const isThisUserGuess = index === game.guessedIndex;

                if (isThisLie) {
                  cardClass += ` ${styles.isLieRevealed}`;
                  badgeText = isThisUserGuess ? 'YOUR GUESS • LIE!' : 'LIE!';
                  badgeClass = styles.badgeLie;
                } else if (isThisUserGuess) {
                  cardClass += ` ${styles.isUserWrongChoice}`;
                  badgeText = 'YOUR GUESS • TRUTH';
                  badgeClass = styles.badgeGuessedWrong;
                } else {
                  cardClass += ` ${styles.isTruthRevealed}`;
                  badgeText = 'TRUTH';
                  badgeClass = styles.badgeTruth;
                }
              }

              return (
                <div
                  key={index}
                  className={cardClass}
                  onClick={() => handleGuess(index)}
                >
                  <div className={styles.cardNum}>{index + 1}</div>
                  <div className={styles.cardText}>{fact}</div>
                  {badgeText && (
                    <span className={`${styles.badge} ${badgeClass}`}>
                      {badgeText}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Result Summary panel (Regular Round) */}
        {showResult && !sessionCompleted && (
          <div className={`${styles.resultSection} ${styles.fadeIn} glass-panel`}>
            <div className={styles.iconWrapper}>
              <Award size={48} color={game.isCorrect ? 'var(--color-success)' : 'var(--color-error)'} />
            </div>
            
            <h2 className={`${styles.resultTitle} ${game.isCorrect ? styles.correct : styles.incorrect}`}>
              {game.isCorrect ? 'CORRECT GUESS!' : 'INCORRECT GUESS'}
            </h2>
            
            <p className={styles.resultText}>
              {game.isCorrect 
                ? (pointsEarned === 30 
                    ? `🔥 Streak Multiplier Active! You found the lie about ${game.persona} and earned +30 points!` 
                    : `Great job! You found the lie about ${game.persona} and earned +20 points!`)
                : `Nice try, but that statement is actually true! That was a fact about ${game.persona}.`
              }
            </p>

            <div className={styles.actionRow}>
              <button onClick={handlePlayAgain} className={styles.btnPrimary}>
                <RefreshCw size={16} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
                Next Round
              </button>
              <button onClick={() => router.push('/dashboard')} className={styles.btnSecondary}>
                <LayoutDashboard size={16} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
                Categories
              </button>
            </div>
          </div>
        )}

        {/* Result Summary panel (Session Complete) */}
        {showResult && sessionCompleted && (
          <div className={`${styles.resultSection} ${styles.fadeIn} glass-panel`}>
            <div className={styles.iconWrapper}>
              <Award size={64} color="var(--neon-cyan)" style={{ filter: 'drop-shadow(0 0 10px var(--neon-cyan-glow))' }} />
            </div>
            
            <h2 className={`${styles.resultTitle} ${styles.correct}`} style={{ color: 'var(--neon-cyan)', textShadow: '0 0 20px var(--neon-cyan-glow)' }}>
              SESSION COMPLETE!
            </h2>
            
            <p className={styles.resultText}>
              {game.isCorrect 
                ? (pointsEarned === 30 
                    ? `🔥 Streak Multiplier Active! You found the lie about ${game.persona} and earned +30 points!` 
                    : `Great job! You found the lie about ${game.persona} and earned +20 points!`)
                : `Nice try, but that statement is actually true! That was a fact about ${game.persona}.`
              }
            </p>
            
            <p className={styles.resultText} style={{ marginTop: '0.5rem' }}>
              Fantastic! You finished all 10 rounds in the <strong>{game.category}</strong> category!
            </p>

            <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                Session Score: <strong style={{ color: 'var(--neon-purple)', fontSize: '1.5rem', textShadow: '0 0 10px var(--neon-purple-glow)' }}>{sessionScore} pts</strong>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Correct answers: <strong>{correctCount} / 10</strong>
              </div>
            </div>

            {/* Leaderboard form */}
            {!leaderboardSubmitted ? (
              <form className={styles.leaderboardForm} onSubmit={handleLeaderboardSubmit}>
                <label htmlFor="playerName" className={styles.formLabel}>
                  Submit your score to the Monthly Leaderboard!
                </label>
                <input
                  id="playerName"
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className={styles.formInput}
                  required
                  maxLength={30}
                />
                <button
                  type="submit"
                  disabled={submittingLeaderboard || !playerName.trim()}
                  className={styles.submitBtn}
                >
                  {submittingLeaderboard ? 'Submitting...' : 'Join Hall of Fame'}
                </button>
              </form>
            ) : (
              <div className={styles.successMessage}>
                🎉 Your score was submitted to the leaderboard!
              </div>
            )}

            <div className={styles.actionRow} style={{ marginTop: '1.5rem' }}>
              <button onClick={() => router.push('/dashboard')} className={styles.btnPrimary}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hint Modal Overlay */}
      {showHintModal && activeHint && (
        <div className={styles.modalOverlay} onClick={() => setShowHintModal(false)}>
          <div className={`${styles.hintModal} glass-panel`} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>🔮 The Guide's Riddle</h3>
            <p className={styles.modalRiddleText}>{activeHint}</p>
            <button onClick={() => setShowHintModal(false)} className={styles.modalCloseBtn}>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Confetti Celebration */}
      <Confetti active={confettiActive} />

      {/* Achievement Toast Notification */}
      {unlockedToast && (
        <div className={styles.achievementToast}>
          <div className={styles.toastIcon}>{unlockedToast.icon}</div>
          <div className={styles.toastContent}>
            <span className={styles.toastLabel}>Achievement Unlocked!</span>
            <h4 className={styles.toastTitle}>{unlockedToast.name}</h4>
            <p className={styles.toastDesc}>{unlockedToast.description}</p>
          </div>
        </div>
      )}
    </CityBackground>
  );
}
