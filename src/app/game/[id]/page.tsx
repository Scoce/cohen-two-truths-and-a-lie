'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Award, RefreshCw, LayoutDashboard } from 'lucide-react';
import CityBackground from '@/components/CityBackground';
import styles from '@/styles/game.module.css';

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

      // Update header score
      setUserScore(result.updatedScore);

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

  // 3. Play again (generates a new round in the same category)
  const handlePlayAgain = async () => {
    if (!game) return;
    setLoading(true);
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
      <div className={styles.container}>
        {/* Header */}
        <header className={`${styles.header} glass-panel`}>
          <button onClick={() => router.push('/dashboard')} className={styles.backBtn}>
            <ChevronLeft size={16} /> Dashboard
          </button>
          
          <div className={styles.headerGroups}>
            {sessionProgress !== null && (
              <div className={styles.sessionBadge}>
                <span className={styles.sessionLabel}>Session:</span>
                <span className={styles.sessionVal}>{sessionProgress}/10</span>
              </div>
            )}
            
            {userScore !== null && (
              <div className={styles.scoreGroup}>
                <span className={styles.scoreLabel}>Total Score:</span>
                <span className={styles.scoreVal}>{userScore} pts</span>
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
        </div>

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
                ? `Great job! You found the lie about ${game.persona} and earned +20 points!`
                : `Nice try, but that statement is actually true! That was a fact about ${game.persona}.`
              }
            </p>

            <div className={styles.actionRow}>
              <button onClick={handlePlayAgain} className={styles.btnPrimary}>
                <RefreshCw size={16} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
                Next Persona
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
              Fantastic! You finished all 10 rounds in the <strong>{game.category}</strong> category!
            </p>

            <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                Session Score: <strong style={{ color: 'var(--neon-purple)', fontSize: '1.5rem', textShadow: '0 0 10px var(--neon-purple-glow)' }}>{sessionScore} / 200 pts</strong>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Correct answers: <strong>{sessionScore ? sessionScore / 20 : 0} / 10</strong>
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
    </CityBackground>
  );
}
