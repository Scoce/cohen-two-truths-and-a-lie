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
    let currentStreak = 0;
    let pointsEarned = 0;
    let correctCount = 0;

    if (game.session_id !== null) {
      // Get current session
      const sessionRes = await query(
        'SELECT * FROM sessions WHERE id = $1',
        [game.session_id]
      );
      
      if (sessionRes.rows.length > 0) {
        const session = sessionRes.rows[0];
        const oldStreak = session.current_streak || 0;

        if (isCorrect) {
          currentStreak = oldStreak + 1;
          pointsEarned = currentStreak >= 3 ? 30 : 20;
        } else {
          currentStreak = 0;
          pointsEarned = 0;
        }

        sessionProgress = session.question_count;
        sessionScore = session.score + pointsEarned;
        sessionCompleted = sessionProgress >= 10;

        const newCategory = session.category === game.category ? session.category : 'Mixed';

        // Save updated session state including potentially updated category and streak
        await query(
          'UPDATE sessions SET score = $1, completed = $2, current_streak = $3, category = $4 WHERE id = $5',
          [sessionScore, sessionCompleted, currentStreak, newCategory, game.session_id]
        );
      }

      // Count correct answers in the session
      const correctRes = await query(
        'SELECT COUNT(*) as correct_count FROM games WHERE session_id = $1 AND is_correct = TRUE',
        [game.session_id]
      );
      correctCount = parseInt(correctRes.rows[0]?.correct_count || '0', 10);
    } else {
      pointsEarned = isCorrect ? 20 : 0;
      correctCount = isCorrect ? 1 : 0;
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
      currentStreak,
      current_streak: currentStreak,
      pointsEarned,
      correctCount,
    });
  } catch (error) {
    console.error('[game-submit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit guess' },
      { status: 500 }
    );
  }
}
