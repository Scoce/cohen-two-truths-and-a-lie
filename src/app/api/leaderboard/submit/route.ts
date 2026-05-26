import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const sessionUser = await getUserFromRequest(req);
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const { sessionId, playerName } = await req.json().catch(() => ({}));

    if (!sessionId || !playerName || typeof playerName !== 'string' || playerName.trim() === '') {
      return NextResponse.json(
        { error: 'Session ID and a valid player name are required' },
        { status: 400 }
      );
    }

    const trimmedName = playerName.trim().substring(0, 30);

    // Validate player name content to reject HTML tags, scripts or malicious characters
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!nameRegex.test(trimmedName)) {
      return NextResponse.json(
        { error: 'Player name can only contain letters, numbers, spaces, hyphens, and underscores.' },
        { status: 400 }
      );
    }

    // 3. Fetch the session
    const sessionRes = await query(
      'SELECT * FROM sessions WHERE id = $1 AND user_id = $2',
      [sessionId, sessionUser.userId]
    );

    if (sessionRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    const session = sessionRes.rows[0];

    // Ensure session is completed
    if (!session.completed) {
      return NextResponse.json(
        { error: 'Cannot submit an uncompleted session to the leaderboard' },
        { status: 400 }
      );
    }

    // 4. Check if session was already submitted
    const existingLeaderboardRes = await query(
      'SELECT id FROM leaderboards WHERE session_id = $1',
      [sessionId]
    );

    if (existingLeaderboardRes.rows.length > 0) {
      return NextResponse.json(
        { error: 'This session has already been submitted to the leaderboard' },
        { status: 400 }
      );
    }

    // 5. Fetch user age to determine age group
    const userRes = await query('SELECT age FROM users WHERE id = $1', [sessionUser.userId]);
    const age = userRes.rows.length > 0 ? userRes.rows[0].age : 10;
    
    let ageGroup = 'Adults';
    if (age < 12) {
      ageGroup = 'Children';
    } else if (age < 18) {
      ageGroup = 'Teens';
    }

    // 6. Insert leaderboard entry
    await query(
      `INSERT INTO leaderboards (user_id, player_name, score, category, age_group, session_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sessionUser.userId,
        trimmedName,
        session.score,
        session.category,
        ageGroup,
        sessionId,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[leaderboard-submit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit leaderboard entry' },
      { status: 500 }
    );
  }
}
