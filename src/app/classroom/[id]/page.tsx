'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Eye, EyeOff, RotateCcw, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import CityBackground from '@/components/CityBackground';

interface GameData {
  id: number;
  persona: string;
  category: string;
  fact_1: string;
  fact_2: string;
  fact_3: string;
  lie_index: number;
  difficulty: string;
}

export default function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const gameId = resolvedParams.id;
  const router = useRouter();

  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Smartboard presentation state
  const [revealed, setRevealed] = useState(false);
  const [selectedLie, setSelectedLie] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/api/game/${gameId}`);
        if (!res.ok) {
          throw new Error('Failed to load game');
        }
        const data = await res.json();
        setGame(data.game);
      } catch (err) {
        console.error(err);
        setError('Error loading classroom game.');
      } finally {
        setLoading(false);
      }
    }
    fetchGame();
  }, [gameId]);

  // Timer countdown hook
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleFetchHint = async () => {
    if (hint || loadingHint) return;
    setLoadingHint(true);
    try {
      const res = await fetch('/api/game/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: parseInt(gameId, 10) }),
      });
      if (res.ok) {
        const data = await res.json();
        setHint(data.hint);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHint(false);
    }
  };

  const handleNextRandomRound = async () => {
    if (!game) return;
    setLoading(true);
    setRevealed(false);
    setSelectedLie(null);
    setHint(null);
    setTimerSeconds(30);
    setIsTimerRunning(false);

    try {
      const res = await fetch('/api/game/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: game.category, difficulty: game.difficulty }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/classroom/${data.gameId}`);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CityBackground>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem' }}>
          Loading Smartboard Presentation...
        </div>
      </CityBackground>
    );
  }

  if (error || !game) {
    return (
      <CityBackground>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '1.5rem' }}>
          {error || 'Game not found.'}
        </div>
      </CityBackground>
    );
  }

  const statements = [game.fact_1, game.fact_2, game.fact_3];

  return (
    <CityBackground>
      <div style={{
        minHeight: '100vh',
        width: '100%',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        {/* Smartboard Top Control Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '1rem 1.5rem'
        }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1rem',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={20} /> Exit Classroom Mode
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                color: timerSeconds <= 5 ? '#ef4444' : '#a855f7'
              }}>
                00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  background: isTimerRunning ? '#e11d48' : '#22c55e',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {isTimerRunning ? 'Pause Timer' : 'Start Timer'}
              </button>
              <button
                onClick={() => { setTimerSeconds(30); setIsTimerRunning(false); }}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer'
                }}
                title="Reset Timer"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Persona Banner */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '20px',
          padding: '1.5rem 2rem',
          backdropFilter: 'blur(12px)'
        }}>
          <span style={{ color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem' }}>
            Classroom Challenge • {game.category.toUpperCase()}
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', margin: '0.5rem 0 0 0', textShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}>
            {game.persona}
          </h1>
        </div>

        {/* Statements Display (Smartboard Huge Font Grid) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          marginBottom: '2rem',
          flex: 1
        }}>
          {statements.map((text, idx) => {
            const isThisLie = idx === game.lie_index;
            const isSelected = selectedLie === idx;

            let borderColor = 'rgba(255, 255, 255, 0.15)';
            let bgColor = 'rgba(15, 23, 42, 0.65)';

            if (revealed) {
              if (isThisLie) {
                borderColor = '#ef4444';
                bgColor = 'rgba(239, 68, 68, 0.2)';
              } else {
                borderColor = '#22c55e';
                bgColor = 'rgba(34, 197, 94, 0.15)';
              }
            } else if (isSelected) {
              borderColor = '#a855f7';
              bgColor = 'rgba(168, 85, 247, 0.2)';
            }

            return (
              <div
                key={idx}
                onClick={() => !revealed && setSelectedLie(idx)}
                style={{
                  padding: '2rem',
                  borderRadius: '18px',
                  background: bgColor,
                  border: `3px solid ${borderColor}`,
                  backdropFilter: 'blur(12px)',
                  cursor: revealed ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  boxShadow: isSelected ? '0 0 25px rgba(168, 85, 247, 0.4)' : 'none'
                }}
              >
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: isThisLie && revealed ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: '#fff',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 600, color: '#fff', lineHeight: 1.4, flex: 1 }}>
                  {text}
                </div>

                {revealed && (
                  <div>
                    {isThisLie ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 800, fontSize: '1.4rem' }}>
                        <XCircle size={32} /> THE LIE!
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontWeight: 800, fontSize: '1.4rem' }}>
                        <CheckCircle2 size={32} /> TRUE
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Hint Box (if toggled) */}
        {hint && (
          <div style={{
            padding: '1.25rem 1.75rem',
            background: 'rgba(234, 179, 8, 0.15)',
            border: '2px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '16px',
            marginBottom: '2rem',
            color: '#fde047',
            fontSize: '1.4rem',
            textAlign: 'center',
            backdropFilter: 'blur(8px)'
          }}>
            💡 <strong>Riddle Hint:</strong> {hint}
          </div>
        )}

        {/* Smartboard Bottom Action Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '1.25rem 2rem',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={handleFetchHint}
            disabled={loadingHint || !!hint}
            style={{
              padding: '0.85rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(234, 179, 8, 0.2)',
              color: '#fde047',
              fontSize: '1.2rem',
              fontWeight: 700,
              cursor: hint ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <HelpCircle size={24} /> {hint ? 'Hint Revealed' : loadingHint ? 'Asking AI...' : 'Reveal Riddle Hint'}
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setRevealed(!revealed)}
              style={{
                padding: '0.85rem 2rem',
                borderRadius: '12px',
                border: 'none',
                background: revealed ? 'rgba(255, 255, 255, 0.15)' : 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                color: '#fff',
                fontSize: '1.25rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: revealed ? 'none' : '0 0 20px rgba(225, 29, 72, 0.4)'
              }}
            >
              {revealed ? <EyeOff size={24} /> : <Eye size={24} />}
              {revealed ? 'Hide Lie' : 'REVEAL LIE TO CLASS'}
            </button>

            <button
              onClick={handleNextRandomRound}
              style={{
                padding: '0.85rem 2rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: '#fff',
                fontSize: '1.25rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
              }}
            >
              <Play size={24} /> Next Classroom Round
            </button>
          </div>
        </div>
      </div>
    </CityBackground>
  );
}
