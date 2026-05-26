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

    // 3. Check for an active, uncompleted game session for this user (cross-category)
    const activeSessionRes = await query(
      `SELECT * FROM sessions 
       WHERE user_id = $1 AND completed = FALSE 
       ORDER BY id DESC LIMIT 1`,
      [sessionUser.userId]
    );

    let sessionId: number;
    let currentQuestionCount = 0;
    let currentSessionScore = 0;

    if (activeSessionRes.rows.length > 0) {
      const activeSession = activeSessionRes.rows[0];
      sessionId = activeSession.id;
      currentQuestionCount = activeSession.question_count;
      currentSessionScore = activeSession.score;
      
      // If the session somehow exceeded 10 questions, mark it completed and create a new one
      if (currentQuestionCount >= 10) {
        await query('UPDATE sessions SET completed = TRUE WHERE id = $1', [sessionId]);
        const newSessionRes = await query(
          `INSERT INTO sessions (user_id, category, score, question_count, completed) 
           VALUES ($1, $2, 0, 0, FALSE) RETURNING id`,
          [sessionUser.userId, category]
        );
        sessionId = newSessionRes.rows[0].id;
        currentQuestionCount = 0;
        currentSessionScore = 0;
      }
    } else {
      // Create a new session
      console.log(`[game-generate] Starting new 10-question session in category "${category}"...`);
      const newSessionRes = await query(
        `INSERT INTO sessions (user_id, category, score, question_count, completed) 
         VALUES ($1, $2, 0, 0, FALSE) RETURNING id`,
        [sessionUser.userId, category]
      );
      sessionId = newSessionRes.rows[0].id;
    }

    // Increment question count for this session
    currentQuestionCount += 1;
    await query(
      'UPDATE sessions SET question_count = $1 WHERE id = $2',
      [currentQuestionCount, sessionId]
    );

    // 4. Fetch user's age to customize difficulty
    const userRes = await query('SELECT age FROM users WHERE id = $1', [sessionUser.userId]);
    const age = userRes.rows.length > 0 ? userRes.rows[0].age : 10;

    let ageGroup = 'Kids';
    if (age >= 18) {
      ageGroup = 'Adults';
    } else if (age >= 12) {
      ageGroup = 'Teens';
    }

    let persona = '';
    let originalFacts: string[] = [];
    let originalLieIndex = 0;

    // Check if there is an unplayed question in trivia_pool for this user/category/ageGroup
    const cachedTriviaRes = await query(
      `SELECT * FROM trivia_pool 
       WHERE category = $1 AND age_group = $2
       AND persona NOT IN (
         SELECT persona FROM games WHERE user_id = $3
       )
       ORDER BY RANDOM() LIMIT 1`,
      [category, ageGroup, sessionUser.userId]
    );

    if (cachedTriviaRes.rows.length > 0) {
      const cachedTrivia = cachedTriviaRes.rows[0];
      console.log(`[game-generate] Cache HIT! Using cached trivia for "${cachedTrivia.persona}"`);
      persona = cachedTrivia.persona;
      originalFacts = [cachedTrivia.fact_1, cachedTrivia.fact_2, cachedTrivia.fact_3];
      originalLieIndex = cachedTrivia.lie_index;
    } else {
      console.log(`[game-generate] Cache MISS! Generating fresh trivia using Gemini...`);
      // 5. Query user's recently played personas in this category/session to prevent repeats
      const recentRes = await query(
        `SELECT persona FROM games 
         WHERE user_id = $1 AND (session_id = $2 OR category = $3) 
         ORDER BY id DESC LIMIT 15`,
        [sessionUser.userId, sessionId, category]
      );
      const excludePersonas = Array.from(new Set(recentRes.rows.map((row) => row.persona))).slice(0, 5);

      // 6. Generate truths and lies (now passing age and exclusions list)
      const trivia = await generateTwoTruthsAndALie(category, age, excludePersonas);
      persona = trivia.persona;
      originalFacts = trivia.facts;
      originalLieIndex = trivia.lieIndex;

      // Save to pool for future cache hits
      await query(
        `INSERT INTO trivia_pool (category, age_group, persona, fact_1, fact_2, fact_3, lie_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          category,
          ageGroup,
          persona,
          originalFacts[0],
          originalFacts[1],
          originalFacts[2],
          originalLieIndex,
        ]
      );
    }

    // 7. Shuffle facts and track where the lie ends up
    const items = originalFacts.map((fact, index) => ({
      text: fact,
      isLie: index === originalLieIndex,
    }));

    const shuffledItems = [...items];
    for (let i = shuffledItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }

    const shuffledFacts = shuffledItems.map((item) => item.text);
    const newLieIndex = shuffledItems.findIndex((item) => item.isLie);

    // 8. Store the game state in Neon Postgres linked to the session
    console.log(`[game-generate] Saving game round to database for session ID ${sessionId}...`);
    const dbRes = await query(
      `INSERT INTO games (user_id, persona, category, fact_1, fact_2, fact_3, lie_index, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        sessionUser.userId,
        persona,
        category,
        shuffledFacts[0],
        shuffledFacts[1],
        shuffledFacts[2],
        newLieIndex,
        sessionId,
      ]
    );

    const gameId = dbRes.rows[0].id;

    // 9. Return gameplay details (do NOT return lie_index)
    return NextResponse.json({
      gameId,
      persona,
      category,
      facts: shuffledFacts,
      sessionProgress: currentQuestionCount,
      sessionScore: currentSessionScore,
      sessionId
    });
  } catch (error) {
    console.error('[game-generate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate game round' },
      { status: 500 }
    );
  }
}
