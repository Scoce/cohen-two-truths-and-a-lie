'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CityBackground from '@/components/CityBackground';
import { Zap, CheckCircle2, Trophy } from 'lucide-react';

function StudentJoinContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [roomCode, setRoomCode] = useState(initialCode);
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedGuess, setSelectedGuess] = useState<number | null>(null);

  useEffect(() => {
    if (initialCode) {
      setRoomCode(initialCode);
    }
  }, [initialCode]);

  const [moderating, setModerating] = useState(false);
  const [modError, setModError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setModError('');
    if (!roomCode.trim() || !nickname.trim()) return;

    setModerating(true);
    try {
      const res = await fetch('/api/classroom/moderate-nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      const data = await res.json();
      if (!data.allowed) {
        setModError(data.reason || 'Please choose a clean, friendly classroom nickname!');
      } else {
        // Register student in live room store
        await fetch(`/api/classroom/rooms/${roomCode}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: nickname.trim(), avatar: selectedAvatar }),
        }).catch(console.error);

        setJoined(true);
      }
    } catch (err) {
      console.error(err);
      setJoined(true); // Fail open if error
    } finally {
      setModerating(false);
    }
  };

  const [joinStartTime, setJoinStartTime] = useState<number>(Date.now());

  const handleSelectGuess = async (index: number) => {
    if (submitted) return;
    setSelectedGuess(index);
    setSubmitted(true);
    const secondsTaken = Math.max(1, Math.round((Date.now() - joinStartTime) / 1000));

    // Submit student answer to room store
    fetch(`/api/classroom/rooms/${roomCode}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: nickname,
        avatar: selectedAvatar,
        guessedIndex: index,
        secondsTaken,
      }),
    }).catch(console.error);
  };

  const AVATARS = ['🐶', '🐱', '🦊', '🐼', '🦁', '🚀', '👑', '⚡', '🎨', '🤖', '👾', '🦄'];
  const [selectedAvatar, setSelectedAvatar] = useState('🐶');
  const [roomStatus, setRoomStatus] = useState<'lobby' | 'in_progress'>('lobby');
  const [currentPersona, setCurrentPersona] = useState<string>('');
  const [connectedClassmates, setConnectedClassmates] = useState<Array<{ nickname: string; avatar: string }>>([]);

  // Poll room status when student has joined to know when teacher starts the game
  useEffect(() => {
    if (!joined || !roomCode) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/classroom/rooms/${roomCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            if (data.room.status === 'in_progress' && roomStatus === 'lobby') {
              setJoinStartTime(Date.now());
            }
            setRoomStatus(data.room.status || 'lobby');
            if (data.room.persona) {
              setCurrentPersona(data.room.persona);
            }
            if (Array.isArray(data.room.students)) {
              setConnectedClassmates(data.room.students);
            }
          }
        }
      } catch (err) {
        console.error('Error polling room status on student side:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [joined, roomCode, roomStatus]);

  return (
    <CityBackground>
      <div style={{
        minHeight: '100vh',
        width: '100%',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box'
      }}>
        {!joined ? (
          /* Student Join Form */
          <div style={{
            width: '100%',
            maxWidth: '440px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{ color: '#a855f7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Live Student Contest
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: '0 0 1.5rem 0' }}>
              Join Classroom Game
            </h1>

            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  Room Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8492"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: '2px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    color: '#f59e0b'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  Your Nickname
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="Enter your name"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    fontSize: '1.1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    color: '#fff'
                  }}
                />
              </div>

              {/* Avatar Selector Grid */}
              <div>
                <label style={{ display: 'block', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Choose Your Avatar
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      style={{
                        fontSize: '1.5rem',
                        padding: '0.5rem',
                        borderRadius: '10px',
                        border: selectedAvatar === avatar ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                        background: selectedAvatar === avatar ? 'rgba(168, 85, 247, 0.3)' : 'rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        transform: selectedAvatar === avatar ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              {modError && (
                <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '0.65rem', fontSize: '0.85rem' }}>
                  ⚠️ {modError}
                </div>
              )}

              <button
                type="submit"
                disabled={moderating}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  cursor: moderating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 20px rgba(225, 29, 72, 0.4)',
                  marginTop: '0.5rem',
                  opacity: moderating ? 0.7 : 1
                }}
              >
                {moderating ? 'Checking Nickname...' : '🚀 JOIN GAME NOW'}
              </button>
            </form>
          </div>
        ) : (
          /* Connected Student Live Answer Interface */
          <div style={{
            width: '100%',
            maxWidth: '480px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.85rem' }}>
              <div style={{ fontWeight: 800, color: '#a855f7', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{selectedAvatar}</span> {nickname}
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.35rem 0.85rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
                ROOM #{roomCode}
              </div>
            </div>

            {roomStatus === 'lobby' ? (
              /* Student Waiting Lobby Screen */
              <div style={{ padding: '1.5rem 0' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'bounce 2s infinite' }}>⏳</div>
                <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, margin: '0 0 0.5rem 0' }}>
                  Waiting for Teacher to Start...
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                  Get ready! Tap the LIE as fast as you can when the round begins!
                </p>

                {/* Classmates Counter & Roster */}
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Connected Classmates ({connectedClassmates.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                    {connectedClassmates.map((c, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.65rem', borderRadius: '12px', fontSize: '0.85rem', color: '#fff' }}>
                        {c.avatar || '🐶'} {c.nickname}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : !submitted ? (
              /* 3-Button Remote Control Answer Pad when in_progress */
              <div>
                <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                  ⚡ {currentPersona ? currentPersona.toUpperCase() : 'TAP THE LIE!'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                  Look at the 3 statements on the Smartboard and tap 1, 2, or 3 below:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
                  {[1, 2, 3].map((num, idx) => (
                    <button
                      key={num}
                      onClick={() => handleSelectGuess(idx)}
                      style={{
                        padding: '1.75rem 0.5rem',
                        borderRadius: '20px',
                        border: '2px solid rgba(168, 85, 247, 0.5)',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(168, 85, 247, 0.35) 100%)',
                        color: '#fff',
                        fontSize: '2.25rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        boxShadow: '0 6px 20px rgba(168, 85, 247, 0.3)',
                        transition: 'transform 0.1s ease, background 0.15s ease'
                      }}
                    >
                      <span>{num}</span>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, fontWeight: 700 }}>Statement #{num}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem 0' }}>
                <CheckCircle2 size={64} color="#22c55e" style={{ margin: '0 auto 1rem auto' }} />
                <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.5rem 0' }}>
                  Answer Locked In!
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  You selected Statement #{selectedGuess! + 1}. Look up at the Smartboard for results & leaderboard!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </CityBackground>
  );
}

export default function StudentJoinPage() {
  return (
    <Suspense fallback={
      <CityBackground>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          Loading Join Page...
        </div>
      </CityBackground>
    }>
      <StudentJoinContent />
    </Suspense>
  );
}
