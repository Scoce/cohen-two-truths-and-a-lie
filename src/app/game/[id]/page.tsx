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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

        // Fetch user stats for header
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserScore(userData.user.score);
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

      // Update header score
      setUserScore(result.updatedScore);
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

  return (
    <CityBackground>
      <div className={styles.container}>
        {/* Header */}
        <header className={`${styles.header} glass-panel`}>
          <button onClick={() => router.push('/dashboard')} className={styles.backBtn}>
            <ChevronLeft size={16} /> Dashboard
          </button>
          {userScore !== null && (
            <div className={styles.scoreGroup}>
              <span className={styles.scoreLabel}>Total Score:</span>
              <span className={styles.scoreVal}>{userScore} pts</span>
            </div>
          )}
        </header>

        {/* Persona Title */}
        <div className={styles.introSection}>
          <span className={styles.categoryLabel}>{game.category} edition</span>
          <h1 className={styles.personaName}>{game.persona}</h1>
          <p className={styles.promptText}>
            {game.played 
              ? 'Results revealed below! Can you find what the lie was?' 
              : 'Two of these statements are true. One is a lie. Click on the lie!'
            }
          </p>
        </div>

        {/* Shuffled Fact Cards */}
        <div className={styles.cardsContainer}>
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

        {/* Result Summary panel */}
        {game.played && (
          <div className={`${styles.resultSection} glass-panel`}>
            <div className={styles.iconWrapper}>
              <Award size={48} color={game.isCorrect ? 'var(--color-success)' : 'var(--color-error)'} />
            </div>
            
            <h2 className={`${styles.resultTitle} ${game.isCorrect ? styles.correct : styles.incorrect}`}>
              {game.isCorrect ? 'CORRECT GUESS!' : 'INCORRECT GUESS'}
            </h2>
            
            <p className={styles.resultText}>
              {game.isCorrect 
                ? `Great job! You found the lie about ${game.persona} and earned +10 points!`
                : `Nice try, but that statement is actually true! That was a fact about ${game.persona}.`
              }
            </p>

            <div className={styles.actionRow}>
              <button onClick={handlePlayAgain} className={styles.btnPrimary}>
                <RefreshCw size={16} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
                Play Another
              </button>
              <button onClick={() => router.push('/dashboard')} className={styles.btnSecondary}>
                <LayoutDashboard size={16} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
                Categories
              </button>
            </div>
          </div>
        )}
      </div>
    </CityBackground>
  );
}
