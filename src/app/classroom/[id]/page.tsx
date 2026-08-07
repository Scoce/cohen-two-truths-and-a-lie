'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Eye, EyeOff, RotateCcw, HelpCircle, CheckCircle2, XCircle, QrCode, Users, Zap, Award } from 'lucide-react';
import CityBackground from '@/components/CityBackground';
import QRCodeImage from '@/components/QRCodeImage';

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

interface StudentSubmission {
  studentName: string;
  avatar: string;
  guessedIndex: number;
  secondsTaken: number;
  isCorrect: boolean;
  score: number;
}

export default function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const gameId = resolvedParams.id;
  const router = useRouter();

  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mode Selection: 'teacher' (Teacher-led) | 'contest' (Live 10s Speed Contest with QR)
  const [classroomMode, setClassroomMode] = useState<'teacher' | 'contest'>('teacher');
  
  // Teacher-Led Mode State
  const [revealed, setRevealed] = useState(false);
  const [selectedLie, setSelectedLie] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Live 15s Speed Contest State
  const [contestTimer, setContestTimer] = useState<number>(15);
  const [contestActive, setContestActive] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>('9925');
  const [studentLeaderboard, setStudentLeaderboard] = useState<StudentSubmission[]>([]);
  const [mockSimulating, setMockSimulating] = useState<boolean>(false);

  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/api/game/${gameId}`);
        if (!res.ok) {
          throw new Error('Failed to load game');
        }
        const data = await res.json();
        const rawGame = data.game || data;
        setGame({
          id: rawGame.gameId || rawGame.id,
          persona: rawGame.persona,
          category: rawGame.category,
          fact_1: rawGame.facts ? rawGame.facts[0] : rawGame.fact_1,
          fact_2: rawGame.facts ? rawGame.facts[1] : rawGame.fact_2,
          fact_3: rawGame.facts ? rawGame.facts[2] : rawGame.fact_3,
          lie_index: typeof rawGame.lieIndex === 'number' ? rawGame.lieIndex : (typeof rawGame.lie_index === 'number' ? rawGame.lie_index : 0),
          difficulty: rawGame.difficulty || 'Medium'
        });
      } catch (err) {
        console.error(err);
        setError('Error loading classroom game.');
      } finally {
        setLoading(false);
      }
    }
    fetchGame();

    // Read selected mode & roomCode from setup configuration
    try {
      const saved = localStorage.getItem('classroom_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.roomCode) {
          setRoomCode(parsed.roomCode);
        }
        if (parsed.mode) {
          setClassroomMode(parsed.mode);
          if (parsed.mode === 'contest') {
            setContestActive(true);
            setContestTimer(15);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [gameId]);

  // Sync game persona with live room store
  useEffect(() => {
    if (game && roomCode) {
      fetch(`/api/classroom/rooms/${roomCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress', currentGameId: game.id, persona: game.persona }),
      }).catch(console.error);
    }
  }, [game, roomCode]);

  // Poll for real live student submissions during active contest
  useEffect(() => {
    if (!roomCode || !contestActive) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/classroom/rooms/${roomCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room && Array.isArray(data.room.submissions) && data.room.submissions.length > 0) {
            setStudentLeaderboard(data.room.submissions);
          }
        }
      } catch (err) {
        console.error('Error polling student submissions:', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [roomCode, contestActive]);

  // Mode A: Teacher Manual Timer
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

  // Mode B: 10s Contest Countdown Timer & Auto-Reveal
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (contestActive && contestTimer > 0) {
      interval = setInterval(() => {
        setContestTimer((prev) => prev - 1);
      }, 1000);
    } else if (contestActive && contestTimer === 0) {
      setContestActive(false);
      setRevealed(true);
    }
    return () => clearInterval(interval);
  }, [contestActive, contestTimer]);

  const handleStartContest = () => {
    setContestTimer(15);
    setContestActive(true);
    setRevealed(false);

    // Simulate class responses for demonstration if no live students are connected
    if (studentLeaderboard.length === 0 && !mockSimulating) {
      setMockSimulating(true);
      const mockStudents = [
        { name: 'Alex M.', avatar: '🐶' },
        { name: 'Jordan K.', avatar: '🦊' },
        { name: 'Taylor S.', avatar: '🚀' },
        { name: 'Sam P.', avatar: '👑' },
        { name: 'Riley B.', avatar: '🤖' }
      ];
      setTimeout(() => {
        if (!game) return;
        const submissions: StudentSubmission[] = mockStudents.map((st) => {
          const seconds = Math.floor(Math.random() * 8) + 1;
          const guessedIndex = Math.random() > 0.3 ? game.lie_index : (game.lie_index + 1) % 3;
          const isCorrect = guessedIndex === game.lie_index;
          const score = isCorrect ? Math.max(200, 1000 - seconds * 80) : 0;
          return { studentName: st.name, avatar: st.avatar, guessedIndex, secondsTaken: seconds, isCorrect, score };
        }).sort((a, b) => b.score - a.score);

        setStudentLeaderboard(submissions);
      }, 3000);
    }
  };

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
    setContestTimer(10);
    setContestActive(false);

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
        padding: '1.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        {/* Top Control Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '0.85rem 1.5rem'
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
              padding: '0.55rem 1rem',
              fontSize: '0.95rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={18} /> Exit Smartboard
          </button>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '10px', padding: '4px' }}>
            <button
              onClick={() => { setClassroomMode('contest'); setRevealed(false); }}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: classroomMode === 'contest' ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' : 'transparent',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Zap size={16} /> Mode A: Live QR 15s Speed Contest ⭐
            </button>
            <button
              onClick={() => { setClassroomMode('teacher'); setRevealed(false); }}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: classroomMode === 'teacher' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'transparent',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Users size={16} /> Mode B: Teacher-Led
            </button>
          </div>

          {/* Mode Specific Top Timer */}
          {classroomMode === 'teacher' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: timerSeconds <= 5 ? '#ef4444' : '#a855f7' }}>
                00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', background: isTimerRunning ? '#e11d48' : '#22c55e', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {isTimerRunning ? 'Pause' : 'Start'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '900', color: contestTimer <= 3 ? '#ef4444' : '#f59e0b', fontFamily: 'monospace' }}>
                ⏱️ {contestTimer}s
              </span>
              <button
                onClick={handleStartContest}
                disabled={contestActive}
                style={{ padding: '0.55rem 1.2rem', borderRadius: '8px', background: contestActive ? 'rgba(255,255,255,0.2)' : '#e11d48', color: '#fff', border: 'none', fontWeight: 'bold', cursor: contestActive ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
              >
                {contestActive ? 'Contest Running...' : '🚀 START 15s CONTEST'}
              </button>
            </div>
          )}
        </div>

        {/* Persona Banner & Mode Instructions */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '16px',
          padding: '1.25rem 2rem',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.85rem' }}>
              {game.category.toUpperCase()} • {game.difficulty || 'Medium'}
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0.2rem 0 0 0', textShadow: '0 0 15px rgba(168, 85, 247, 0.5)' }}>
              {game.persona}
            </h1>
          </div>

          {/* Mode B: Live QR Code Badge for Projector */}
          {classroomMode === 'contest' && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '0.6rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ background: '#fff', padding: '0.25rem', borderRadius: '8px' }}>
                <QRCodeImage
                  value={typeof window !== 'undefined' ? `${window.location.origin}/join?code=${roomCode}` : `https://truths-and-lies.app/join?code=${roomCode}`}
                  size={64}
                />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Scan to Join Live</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b', letterSpacing: '2px' }}>ROOM #{roomCode}</div>
              </div>
            </div>
          )}
        </div>

        {/* Main Body Section: Split Grid when in Contest Mode */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: classroomMode === 'contest' ? '1fr 340px' : '1fr',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          flex: 1
        }}>
          {/* Left Column: Statements Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                    padding: '1.5rem 2rem',
                    borderRadius: '16px',
                    background: bgColor,
                    border: `3px solid ${borderColor}`,
                    backdropFilter: 'blur(12px)',
                    cursor: revealed ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: isThisLie && revealed ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', lineHeight: 1.4, flex: 1 }}>
                    {text}
                  </div>

                  {revealed && (
                    <div>
                      {isThisLie ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 800, fontSize: '1.25rem' }}>
                          <XCircle size={28} /> THE LIE!
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontWeight: 800, fontSize: '1.25rem' }}>
                          <CheckCircle2 size={28} /> TRUE
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Speed Leaderboard Card (Always visible on right side in Contest mode) */}
          {classroomMode === 'contest' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '20px',
              padding: '1.5rem',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '1.1rem', fontWeight: 800 }}>
                  <Award size={22} /> Live Leaderboard
                </span>
                <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }}>
                  {studentLeaderboard.length} Received
                </span>
              </div>

              {studentLeaderboard.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                  {studentLeaderboard.map((entry, index) => (
                    <div key={index} style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '0.75rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      animation: 'fadeIn 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: index === 0 ? '#f59e0b' : '#fff', fontSize: '0.95rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{entry.avatar}</span>
                        <span>#{index + 1} {entry.studentName}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {revealed ? (
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: entry.isCorrect ? '#22c55e' : '#ef4444' }}>
                            {entry.isCorrect ? `+${entry.score} pts` : '❌ Incorrect'}
                          </div>
                        ) : (
                          <div style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 700 }}>
                            ⚡ {entry.secondsTaken}s (Locked In)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📱</div>
                  <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.4 }}>
                    Waiting for students to tap 1, 2, or 3 on their phones...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hint Box */}
        {hint && (
          <div style={{
            padding: '1rem 1.5rem',
            background: 'rgba(234, 179, 8, 0.15)',
            border: '2px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '14px',
            marginBottom: '1.5rem',
            color: '#fde047',
            fontSize: '1.25rem',
            textAlign: 'center',
            backdropFilter: 'blur(8px)'
          }}>
            💡 <strong>Riddle Hint:</strong> {hint}
          </div>
        )}

        {/* Bottom Control Action Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '1rem 1.75rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={handleFetchHint}
            disabled={loadingHint || !!hint}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(234, 179, 8, 0.2)',
              color: '#fde047',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: hint ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <HelpCircle size={20} /> {hint ? 'Hint Revealed' : loadingHint ? 'Asking AI...' : 'Reveal Riddle Hint'}
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setRevealed(!revealed)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: revealed ? 'rgba(255, 255, 255, 0.15)' : 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: revealed ? 'none' : '0 0 15px rgba(225, 29, 72, 0.4)'
              }}
            >
              {revealed ? <EyeOff size={20} /> : <Eye size={20} />}
              {revealed ? 'Hide Lie' : 'REVEAL LIE TO CLASS'}
            </button>

            <button
              onClick={handleNextRandomRound}
              style={{
                padding: '0.75rem 1.75rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)'
              }}
            >
              <Play size={20} /> Next Round
            </button>
          </div>
        </div>
      </div>
    </CityBackground>
  );
}
