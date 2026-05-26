import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

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

    // 2. Parse request parameters
    const { gameId } = await req.json().catch(() => ({}));

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    // 3. Fetch the game details
    const gameRes = await query(
      'SELECT * FROM games WHERE id = $1 AND user_id = $2',
      [gameId, sessionUser.userId]
    );

    if (gameRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game round not found' },
        { status: 404 }
      );
    }

    const game = gameRes.rows[0];

    // Ensure they can't ask for a hint after already playing the card
    if (game.guessed_index !== null) {
      return NextResponse.json(
        { error: 'This round has already been played. No hints allowed!' },
        { status: 400 }
      );
    }

    if (game.session_id === null) {
      return NextResponse.json(
        { error: 'No session associated with this game round' },
        { status: 400 }
      );
    }

    // 4. Fetch the session details to verify hint limit
    const sessionRes = await query(
      'SELECT * FROM sessions WHERE id = $1',
      [game.session_id]
    );

    if (sessionRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Associated session not found' },
        { status: 404 }
      );
    }

    const session = sessionRes.rows[0];
    const hintsUsed = session.hints_used || 0;

    if (hintsUsed >= 2) {
      return NextResponse.json(
        { error: 'You have already used your 2 hints for this session!' },
        { status: 400 }
      );
    }

    // Fetch user age for hint tuning
    const userRes = await query('SELECT age FROM users WHERE id = $1', [sessionUser.userId]);
    const age = userRes.rows.length > 0 ? userRes.rows[0].age : 10;

    // 5. Generate hint using Gemini
    const facts = [game.fact_1, game.fact_2, game.fact_3];
    const lieText = facts[game.lie_index];
    let hintText = '';

    if (aiClient) {
      try {
        const prompt = `You are a helper guide in a game of "Two Truths and a Lie".
The current round is about: "${game.persona}".
Here are the three statements:
1. "${game.fact_1}"
2. "${game.fact_2}"
3. "${game.fact_3}"
The lie is statement number ${game.lie_index + 1} ("${lieText}").

Write a short, fun, 2-line rhyming riddle that hints at which statement is the lie WITHOUT directly revealing its number or text. Keep it appropriate for a target age of ${age} years old. Do not include any JSON wrappers or other text, just return the 2-line riddle.`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        hintText = response.text?.trim() || '';
      } catch (geminiErr) {
        console.error('[hint-api] Gemini call failed, falling back to template:', geminiErr);
      }
    }

    // Fallback if Gemini failed or key is not set
    if (!hintText) {
      hintText = `One of these details about ${game.persona} is not quite right... Think closely about what they are famous for!`;
    }

    // 6. Increment hints_used in the session
    await query(
      'UPDATE sessions SET hints_used = hints_used + 1 WHERE id = $1',
      [game.session_id]
    );

    return NextResponse.json({
      hint: hintText,
      hintsUsed: hintsUsed + 1
    });
  } catch (error) {
    console.error('[hint-api] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate hint' },
      { status: 500 }
    );
  }
}
