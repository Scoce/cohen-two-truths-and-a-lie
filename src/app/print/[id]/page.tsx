'use client';

import React, { useEffect, useState, use } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const gameId = resolvedParams.id;
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        setError('Error loading worksheet.');
      } finally {
        setLoading(false);
      }
    }
    fetchGame();
  }, [gameId]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        Loading printable worksheet...
      </div>
    );
  }

  if (error || !game) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif', color: 'red' }}>
        {error || 'Game not found.'}
      </div>
    );
  }

  const statements = [game.fact_1, game.fact_2, game.fact_3];

  return (
    <div style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      {/* Screen-Only Control Bar */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '1rem',
        background: '#f3f4f6',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.2rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          <Printer size={18} /> Print Worksheet
        </button>
      </div>

      {/* Printable Worksheet Body */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Student Name / Header */}
        <div style={{ borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Two Truths & A Lie Worksheet
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#4b5563', fontSize: '0.9rem' }}>
              Topic: <strong>{game.persona}</strong> ({game.category.toUpperCase()} • {game.difficulty || 'Medium'})
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.9rem', lineHeight: '1.6' }}>
            <div>Name: ______________________</div>
            <div>Date:  ______________________</div>
            <div>Score: ______ / 100</div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <strong>Instructions:</strong> Read the three statements about <strong>{game.persona}</strong> below. Two statements are true facts, and one statement is a lie! Check the box next to the statement you believe is the <strong>LIE</strong>.
        </div>

        {/* Question Item */}
        <div style={{ border: '1px solid #000', borderRadius: '8px', padding: '1.5rem', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '1rem' }}>
            Persona: {game.persona}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {statements.map((text, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.75rem', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid #000', borderRadius: '4px', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '1.05rem', lineHeight: '1.5' }}>
                  <strong>Statement {idx + 1}:</strong> {text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Separate Teacher Answer Key Page Break */}
        <div style={{ pageBreakBefore: 'always', paddingTop: '2rem', borderTop: '2px dashed #9ca3af' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#dc2626', margin: '0 0 0.5rem 0' }}>
            TEACHER ANSWER KEY (Detachable)
          </h2>
          <p style={{ color: '#4b5563', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Keep this section separate before distributing worksheets to students.
          </p>

          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1.25rem', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>Persona: {game.persona}</h3>
            <p style={{ margin: 0, fontSize: '1.05rem' }}>
              <strong>The LIE is Statement #{game.lie_index + 1}:</strong> &quot;{statements[game.lie_index]}&quot;
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
