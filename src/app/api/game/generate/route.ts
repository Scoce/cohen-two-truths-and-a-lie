import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateTwoTruthsAndALie } from '@/lib/gemini';

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

    // 2. Parse category from body
    const body = await req.json().catch(() => ({}));
    const category = body.category || 'sports';

    // 3. Generate 2 truths and a lie
    console.log(`[game-generate] Generating round for category "${category}"...`);
    
    // Fetch the user's age to customize content difficulty
    const userRes = await query('SELECT age FROM users WHERE id = $1', [sessionUser.userId]);
    const age = userRes.rows.length > 0 ? userRes.rows[0].age : 10;

    // Fetch the user's recently played personas in this category to prevent repeats
    const recentRes = await query(
      `SELECT DISTINCT persona FROM games 
       WHERE user_id = $1 AND category = $2 AND guessed_index IS NOT NULL 
       ORDER BY id DESC LIMIT 3`,
      [sessionUser.userId, category]
    );
    const excludePersonas = recentRes.rows.map((row) => row.persona);

    const { persona, facts: originalFacts, lieIndex: originalLieIndex } = await generateTwoTruthsAndALie(category, age, excludePersonas);

    // 4. Shuffle facts and track where the lie ends up
    const items = originalFacts.map((fact, index) => ({
      text: fact,
      isLie: index === originalLieIndex,
    }));

    // Perform a robust shuffle
    const shuffledItems = [...items];
    for (let i = shuffledItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }

    const shuffledFacts = shuffledItems.map((item) => item.text);
    const newLieIndex = shuffledItems.findIndex((item) => item.isLie);

    // 5. Store the game state in Neon Postgres
    console.log(`[game-generate] Saving game state to database for user ID ${sessionUser.userId}...`);
    const dbRes = await query(
      `INSERT INTO games (user_id, persona, category, fact_1, fact_2, fact_3, lie_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        sessionUser.userId,
        persona,
        category,
        shuffledFacts[0],
        shuffledFacts[1],
        shuffledFacts[2],
        newLieIndex,
      ]
    );

    const gameId = dbRes.rows[0].id;

    // 6. Return gameplay details (do NOT return lie_index to prevent cheating)
    return NextResponse.json({
      gameId,
      persona,
      category,
      facts: shuffledFacts,
    });
  } catch (error) {
    console.error('[game-generate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate game round' },
      { status: 500 }
    );
  }
}
