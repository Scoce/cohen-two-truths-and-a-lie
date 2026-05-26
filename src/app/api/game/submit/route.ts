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
    const { gameId, guessedIndex } = await req.json();

    if (gameId === undefined || guessedIndex === undefined || guessedIndex < 0 || guessedIndex > 2) {
      return NextResponse.json(
        { error: 'Invalid parameters provided' },
        { status: 400 }
      );
    }

    // 3. Fetch the game from database
    const gameRes = await query(
      'SELECT * FROM games WHERE id = $1 AND user_id = $2',
      [gameId, sessionUser.userId]
    );

    if (gameRes.rowCount === 0) {
      return NextResponse.json(
        { error: 'Game round not found or unauthorized' },
        { status: 404 }
      );
    }

    const game = gameRes.rows[0];

    // 4. Prevent double submission
    if (game.guessed_index !== null) {
      return NextResponse.json(
        { error: 'This game round has already been played' },
        { status: 400 }
      );
    }

    // 5. Evaluate the guess
    const isCorrect = guessedIndex === game.lie_index;

    // 6. Update the game record
    await query(
      'UPDATE games SET guessed_index = $1, is_correct = $2 WHERE id = $3',
      [guessedIndex, isCorrect, gameId]
    );

    // 7. Update Session state and User score
    let sessionProgress = 1;
    let sessionScore = 0;
    let sessionCompleted = false;
    let updatedTotalScore = 0;

    const pointsEarned = isCorrect ? 20 : 0;

    if (game.session_id !== null) {
      // Get current session
      const sessionRes = await query(
        'SELECT * FROM sessions WHERE id = $1',
        [game.session_id]
      );
      
      if (sessionRes.rows.length > 0) {
        const session = sessionRes.rows[0];
        sessionProgress = session.question_count;
        sessionScore = session.score + pointsEarned;
        sessionCompleted = sessionProgress >= 10;

        const newCategory = session.category === game.category ? session.category : 'Mixed';

        // Save updated session state including potentially updated category
        await query(
          'UPDATE sessions SET score = $1, completed = $2, category = $3 WHERE id = $4',
          [sessionScore, sessionCompleted, newCategory, game.session_id]
        );
      }
    }

    // Update user's total score in the database
    if (isCorrect) {
      const userRes = await query(
        'UPDATE users SET score = score + $1 WHERE id = $2 RETURNING score',
        [pointsEarned, sessionUser.userId]
      );
      updatedTotalScore = userRes.rows[0].score;
    } else {
      const userRes = await query(
        'SELECT score FROM users WHERE id = $1',
        [sessionUser.userId]
      );
      updatedTotalScore = userRes.rows[0].score;
    }

    // 8. Return response
    return NextResponse.json({
      isCorrect,
      lieIndex: game.lie_index,
      sessionProgress,
      sessionScore,
      sessionCompleted,
      updatedScore: updatedTotalScore,
    });
  } catch (error) {
    console.error('[game-submit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit guess' },
      { status: 500 }
    );
  }
}
