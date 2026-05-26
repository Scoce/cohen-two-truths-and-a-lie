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

    // Get the latest score from the database
    const res = await query('SELECT id, username, score, age, created_at FROM users WHERE id = $1', [sessionUser.userId]);
    if (res.rowCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = res.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        score: user.score,
        age: user.age,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('[me-api] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
