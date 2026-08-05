import { NextResponse } from 'next/server';
import { addSubmission, getRoom } from '@/lib/classroomStore';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { studentName, avatar, guessedIndex, secondsTaken } = await req.json();

    if (!studentName || guessedIndex === undefined) {
      return NextResponse.json({ error: 'studentName and guessedIndex are required' }, { status: 400 });
    }

    const room = getRoom(code);
    let lieIndex = 0;

    // Fetch actual game lie index if gameId is present
    if (room && room.currentGameId) {
      try {
        const gameRes = await fetch(`${new URL(req.url).origin}/api/game/${room.currentGameId}`);
        if (gameRes.ok) {
          const gameData = await gameRes.json();
          lieIndex = typeof gameData.lieIndex === 'number' ? gameData.lieIndex : (gameData.game?.lieIndex ?? 0);
        }
      } catch (e) {
        console.error('Error fetching game lie index:', e);
      }
    }

    const isCorrect = guessedIndex === lieIndex;
    const timeTaken = Math.max(1, Number(secondsTaken) || 2);
    const score = isCorrect ? Math.max(200, 1000 - timeTaken * 50) : 0;

    addSubmission(code, {
      studentName: studentName.trim(),
      avatar: avatar || '🐶',
      guessedIndex,
      secondsTaken: timeTaken,
      isCorrect,
      score,
    });

    return NextResponse.json({ success: true, isCorrect, score });
  } catch (error) {
    console.error('[submit-answer-api] Error:', error);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}
