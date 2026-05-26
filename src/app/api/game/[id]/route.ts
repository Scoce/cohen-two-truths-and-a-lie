import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const sessionUser = await getUserFromRequest(req);
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const gameId = parseInt(id, 10);

    if (isNaN(gameId)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    // 2. Query game from database
    const gameRes = await query(
      'SELECT * FROM games WHERE id = $1 AND user_id = $2',
      [gameId, sessionUser.userId]
    );

    if (gameRes.rowCount === 0) {
      return NextResponse.json(
        { error: 'Game round not found' },
        { status: 404 }
      );
    }

    const game = gameRes.rows[0];

    // 3. If already played, return the results
    if (game.guessed_index !== null) {
      return NextResponse.json({
        gameId: game.id,
        persona: game.persona,
        category: game.category,
        facts: [game.fact_1, game.fact_2, game.fact_3],
        guessedIndex: game.guessed_index,
        lieIndex: game.lie_index,
        isCorrect: game.is_correct,
        played: true
      });
    }

    // 4. If not played yet, hide the lie_index
    return NextResponse.json({
      gameId: game.id,
      persona: game.persona,
      category: game.category,
      facts: [game.fact_1, game.fact_2, game.fact_3],
      played: false
    });
  } catch (error) {
    console.error('[game-get-api] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve game details' },
      { status: 500 }
    );
  }
}
