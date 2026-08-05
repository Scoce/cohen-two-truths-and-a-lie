import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getUserFromRequest(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const gameId = parseInt(id, 10);
    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    // Fetch target game
    const gameRes = await query('SELECT * FROM games WHERE id = $1', [gameId]);
    if (gameRes.rowCount === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const game = gameRes.rows[0];

    // Build TeachWeave activity payload
    const payload = {
      title: `Two Truths & A Lie — ${game.persona}`,
      resourceType: 'interactive_quiz',
      sourceApp: 'two-truths-and-a-lie',
      category: game.category,
      difficulty: game.difficulty || 'Medium',
      persona: game.persona,
      createdAt: game.created_at,
      questions: [
        {
          persona: game.persona,
          statements: [
            { text: game.fact_1, isLie: game.lie_index === 0 },
            { text: game.fact_2, isLie: game.lie_index === 1 },
            { text: game.fact_3, isLie: game.lie_index === 2 },
          ],
          lieIndex: game.lie_index,
        },
      ],
      exportVersion: '1.0',
    };

    return NextResponse.json(payload, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="teach-weave-${game.persona.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json"`,
      },
    });
  } catch (error) {
    console.error('[teach-weave-export] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
