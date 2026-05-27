import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const sessionUser = await getUserFromRequest(req);
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const res = await query(
      'SELECT achievement_key as "achievementKey", unlocked_at as "unlockedAt" FROM user_achievements WHERE user_id = $1',
      [sessionUser.userId]
    );

    const unlockedMap = new Map<string, string>();
    res.rows.forEach((row: any) => {
      unlockedMap.set(row.achievementKey, row.unlockedAt);
    });

    const ALL_ACHIEVEMENTS = [
      {
        key: 'trivia_rookie',
        name: 'Trivia Rookie',
        description: 'Find your first lie!',
        icon: '👶',
        badgeColor: 'var(--neon-blue)',
      },
      {
        key: 'on_fire',
        name: 'On Fire',
        description: 'Reach a streak of 3 correct answers in a session.',
        icon: '🔥',
        badgeColor: 'var(--neon-orange)',
      },
      {
        key: 'lie_detector',
        name: 'Lie Detector',
        description: 'Get all 10 answers correct in a single session!',
        icon: '🔎',
        badgeColor: 'var(--neon-green)',
      },
      {
        key: 'hintless_wonder',
        name: 'Hintless Wonder',
        description: 'Complete a full session without using any hints.',
        icon: '🧠',
        badgeColor: 'var(--neon-purple)',
      },
      {
        key: 'trivia_master',
        name: 'Trivia Master',
        description: 'Reach a lifetime score of 500 points.',
        icon: '👑',
        badgeColor: 'var(--neon-gold)',
      },
    ];

    const achievements = ALL_ACHIEVEMENTS.map((ach) => {
      const isUnlocked = unlockedMap.has(ach.key);
      return {
        ...ach,
        unlocked: isUnlocked,
        unlockedAt: isUnlocked ? unlockedMap.get(ach.key) : null,
      };
    });

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('[achievements-get] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
