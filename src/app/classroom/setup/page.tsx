'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, QrCode, Play, Users, Zap, Settings, Trophy, ShieldCheck } from 'lucide-react';
import CityBackground from '@/components/CityBackground';
import QRCodeImage from '@/components/QRCodeImage';

export default function ClassroomSetupPage() {
  const router = useRouter();

  // Setup options
  const [category, setCategory] = useState<string>('sports');
  const [ageGroup, setAgeGroup] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [mode, setMode] = useState<'teacher' | 'contest'>('teacher');
  const [roomCode] = useState<string>(() => String(Math.floor(1000 + Math.random() * 9000)));

  const [step, setStep] = useState<'config' | 'lobby'>('config');
  const [starting, setStarting] = useState(false);

  const handleStartSession = async () => {
    setStarting(true);
    try {
      // Generate Round 1 for the classroom session
      const res = await fetch('/api/game/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category === 'random' ? ['sports', 'movies', 'science', 'history', 'music'][Math.floor(Math.random() * 5)] : category,
          difficulty,
          age: ageGroup,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate classroom round');
      }

      const data = await res.json();

      // Save classroom configuration to localStorage
      localStorage.setItem('classroom_config', JSON.stringify({
        category,
        difficulty,
        ageGroup,
        totalRounds,
        currentRound: 1,
        mode,
        roomCode,
      }));

      // Route directly to Smartboard view for Round 1
      router.push(`/classroom/${data.gameId}`);
    } catch (err) {
      console.error(err);
      alert('Error starting classroom session. Please try again.');
      setStarting(false);
    }
  };

  return (
    <CityBackground>
      <div style={{
        minHeight: '100vh',
        width: '100%',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        {/* Top Bar */}
        <div style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
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
              padding: '0.6rem 1.2rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} /> Return to Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: 800 }}>
            <Trophy size={20} /> Smartboard Classroom Launcher
          </div>
        </div>

        {/* Setup Card */}
        <div style={{
          width: '100%',
          maxWidth: '900px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.25)'
        }}>
          {step === 'config' ? (
            <div>
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Settings size={28} color="#a855f7" /> Configure Classroom Session
                </h1>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                  Set up your Smartboard presentation or live student contest before projecting to your class.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '2.5rem' }}>
                {/* Mode Selection */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#fff', fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem' }}>
                    Select Classroom Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div
                      onClick={() => setMode('teacher')}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '14px',
                        border: `2px solid ${mode === 'teacher' ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                        background: mode === 'teacher' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#fff', fontSize: '1.1rem', marginBottom: '0.35rem' }}>
                        <Users size={20} color="#6366f1" /> Mode A: Teacher-Led
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        Project statements on the Smartboard. Whole class discusses together while teacher reveals the lie.
                      </p>
                    </div>

                    <div
                      onClick={() => setMode('contest')}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '14px',
                        border: `2px solid ${mode === 'contest' ? '#e11d48' : 'rgba(255,255,255,0.1)'}`,
                        background: mode === 'contest' ? 'rgba(225, 29, 72, 0.2)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#fff', fontSize: '1.1rem', marginBottom: '0.35rem' }}>
                        <Zap size={20} color="#e11d48" /> Mode B: Live QR Speed Contest
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        Students scan QR Code to answer on their own devices. Automatic 10s timer with speed leaderboard.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label style={{ display: 'block', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '1rem' }}
                  >
                    <option value="sports">Sports Legends</option>
                    <option value="movies">Movies & Cartoons</option>
                    <option value="science">Science & Space</option>
                    <option value="history">Historical Figures</option>
                    <option value="music">Musicians & Bands</option>
                    <option value="random">🔀 Random Category Mix</option>
                  </select>
                </div>

                {/* Age Group */}
                <div>
                  <label style={{ display: 'block', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Grade / Target Age</label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(parseInt(e.target.value, 10))}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '1rem' }}
                  >
                    <option value={8}>Elementary (Under 12)</option>
                    <option value={14}>Middle / High School (12-17)</option>
                    <option value={25}>Adults / Teachers (18+)</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label style={{ display: 'block', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '1rem' }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Number of Rounds */}
                <div>
                  <label style={{ display: 'block', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Number of Rounds</label>
                  <select
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(parseInt(e.target.value, 10))}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '1rem' }}
                  >
                    <option value={5}>5 Rounds (~5-8 mins)</option>
                    <option value={10}>10 Rounds (~12-15 mins)</option>
                    <option value={15}>15 Rounds (~20 mins)</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={() => setStep('lobby')}
                  style={{
                    padding: '0.9rem 2.5rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.15rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  Proceed to Smartboard Lobby <Play size={20} />
                </button>
              </div>
            </div>
          ) : (
            /* Full Screen Smartboard Setup & Lobby Screen */
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '2rem' }}>
                <span style={{ color: '#a855f7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>
                  Smartboard Projection Lobby
                </span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0.5rem 0' }}>
                  Ready to Start Classroom Session!
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                  Project this screen on your Smartboard. {mode === 'contest' ? 'Students can scan the QR code to join.' : 'Click start when ready.'}
                </p>
              </div>

              {/* QR Code & Room Info Card */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem',
                alignItems: 'center',
                marginBottom: '2.5rem'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '2px dashed rgba(168, 85, 247, 0.5)',
                  borderRadius: '20px',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.25rem'
                }}>
                  <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '16px', boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
                    <QRCodeImage
                      value={typeof window !== 'undefined' ? `${window.location.origin}/join?code=${roomCode}` : `https://truths-and-lies.app/join?code=${roomCode}`}
                      size={180}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Scan QR or Visit <strong>{typeof window !== 'undefined' ? window.location.host : 'TruthsAndLies.app'}/join</strong>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f59e0b', letterSpacing: '3px' }}>
                      ROOM #{roomCode}
                    </div>
                  </div>
                </div>

                {/* Live Connected Students Roster */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  minHeight: '260px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 800, color: '#a855f7', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={20} /> Connected Students
                    </span>
                    <span style={{ background: '#a855f7', color: '#fff', padding: '0.2rem 0.75rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
                      5 Joined
                    </span>
                  </div>

                  {/* Student Avatars Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', flex: 1 }}>
                    {[
                      { name: 'Alex M.', avatar: '🐶' },
                      { name: 'Jordan K.', avatar: '🦊' },
                      { name: 'Taylor S.', avatar: '🚀' },
                      { name: 'Sam P.', avatar: '👑' },
                      { name: 'Riley B.', avatar: '🤖' }
                    ].map((student, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '0.75rem 0.5rem',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <span style={{ fontSize: '1.8rem' }}>{student.avatar}</span>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{student.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Session Summary Pills */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.08)', borderRadius: '20px', color: '#fff', fontSize: '0.9rem' }}>
                  📚 Category: <strong>{category.toUpperCase()}</strong>
                </span>
                <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.08)', borderRadius: '20px', color: '#fff', fontSize: '0.9rem' }}>
                  🔄 Length: <strong>{totalRounds} Rounds</strong>
                </span>
                <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.08)', borderRadius: '20px', color: '#fff', fontSize: '0.9rem' }}>
                  🎯 Mode: <strong>{mode === 'teacher' ? 'Teacher-Led' : '10s Speed Contest'}</strong>
                </span>
              </div>

              {/* Start Game Button */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                <button
                  onClick={() => setStep('config')}
                  style={{
                    padding: '0.9rem 1.75rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Change Settings
                </button>
                <button
                  onClick={handleStartSession}
                  disabled={starting}
                  style={{
                    padding: '1rem 3rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '1.3rem',
                    cursor: starting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 30px rgba(225, 29, 72, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  {starting ? 'Generating Round 1...' : '🚀 START CLASSROOM SESSION'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CityBackground>
  );
}
