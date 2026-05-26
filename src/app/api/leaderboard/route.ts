import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(
      `SELECT id, player_name as "playerName", score, category, age_group as "ageGroup", created_at as "createdAt"
       FROM leaderboards 
       WHERE created_at >= DATE_TRUNC('month', NOW())
       ORDER BY score DESC, created_at ASC 
       LIMIT 10`
    );

    return NextResponse.json({ leaderboard: res.rows });
  } catch (error) {
    console.error('[leaderboard-get] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
