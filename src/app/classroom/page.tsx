'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Zap, Play, ShieldCheck, HelpCircle } from 'lucide-react';
import CityBackground from '@/components/CityBackground';

export default function ClassroomHubPage() {
  const router = useRouter();

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
        {/* Top Header Navigation */}
        <div style={{
          width: '100%',
          maxWidth: '960px',
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
            <ArrowLeft size={18} /> Return to Solo Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: 800, fontSize: '1.1rem' }}>
            🍎 Teacher & Classroom Hub
          </div>
        </div>

        {/* Hero Section */}
        <div style={{
          width: '100%',
          maxWidth: '960px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.25)',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <span style={{ color: '#a855f7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.85rem' }}>
            K-12 Interactive AI Classroom Tools
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0.5rem 0 1rem 0' }}>
            Smartboard & Live Student Contest Suite
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto 2rem auto', lineHeight: 1.5 }}>
            Project educational warm-ups on your Smartboard or engage your class with 10-second live student speed contests using QR codes.
          </p>

          <button
            onClick={() => router.push('/classroom/setup')}
            style={{
              padding: '1.1rem 3rem',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#fff',
              fontWeight: 900,
              fontSize: '1.3rem',
              cursor: 'pointer',
              boxShadow: '0 4px 25px rgba(168, 85, 247, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            🚀 LAUNCH NEW SMARTBOARD SESSION <Play size={22} />
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          width: '100%',
          maxWidth: '960px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(225, 29, 72, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            backdropFilter: 'blur(12px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e11d48', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              <Zap size={24} /> Mode A: Live 15s Speed Contest ⭐
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
              Students scan a QR code to answer on their own devices. Includes automatic 15-second timer and live speed leaderboard.
            </p>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            backdropFilter: 'blur(12px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6366f1', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              <Users size={24} /> Mode B: Teacher-Led Smartboard
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
              Full-screen projector view designed to be read across the room. Whole class discusses statements together while teacher reveals the lie.
            </p>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            backdropFilter: 'blur(12px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#22c55e', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              <ShieldCheck size={24} /> AI Classroom Safety
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
              Built-in Gemini AI content moderation filters student nicknames to automatically block profanity, meme numbers (67/69/420), and brainrot slang.
            </p>
          </div>
        </div>
      </div>
    </CityBackground>
  );
}
