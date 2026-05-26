import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateTwoTruthsAndALie } from '@/lib/gemini';

export const maxDuration = 60; // Allow up to 60 seconds on Vercel Pro if available

const CATEGORIES = ['sports', 'movies', 'science', 'history', 'music'];
const AGE_GROUPS = [
  { name: 'Kids', age: 8 },
  { name: 'Teens', age: 14 },
  { name: 'Adults', age: 25 }
];

export async function POST(req: Request) {
  return handleMaintenance(req);
}

export async function GET(req: Request) {
  return handleMaintenance(req);
}

async function handleMaintenance(req: Request) {
  try {
    // 1. Authorization check
    const authHeader = req.headers.get('Authorization');
    const url = new URL(req.url);
    const secretParam = url.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    // In production, enforce cron secret check
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      const expectedAuth = `Bearer ${cronSecret}`;
      if (authHeader !== expectedAuth && secretParam !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[cron-pool-maintenance] Starting trivia pool refresh and expansion...');

    // 2. Refresh: Delete trivia questions older than 30 days
    const deleteRes = await query(
      `DELETE FROM trivia_pool WHERE created_at < NOW() - INTERVAL '30 days'`
    );
    const deletedCount = deleteRes.rowCount || 0;
    console.log(`[cron-pool-maintenance] Expired and deleted ${deletedCount} questions.`);

    // 3. Fetch all current pool questions to calculate sizes
    const poolRes = await query('SELECT * FROM trivia_pool');
    const allPool = poolRes.rows;

    let totalAdded = 0;
    const addedReport: string[] = [];

    // 4. Loop through categories and age groups to expand by 25% (min 2 items if empty)
    for (const category of CATEGORIES) {
      for (const group of AGE_GROUPS) {
        // Find existing pool items in this group
        const existingItems = allPool.filter(
          (t) =>
            t.category.toLowerCase() === category.toLowerCase() &&
            t.age_group.toLowerCase() === group.name.toLowerCase()
        );

        const currentCount = existingItems.length;
        // Target: 25% of current size, or minimum of 2 if empty
        const expansionTarget = currentCount > 0 ? Math.max(1, Math.ceil(currentCount * 0.25)) : 2;

        console.log(
          `[cron-pool-maintenance] Group "${category}" - "${group.name}": active count = ${currentCount}. Generating ${expansionTarget} new items...`
        );

        const groupExclusions = existingItems.map((item) => item.persona);
        const generatedInBatch: string[] = [];

        // Generate the required expansion items
        for (let i = 0; i < expansionTarget; i++) {
          try {
            const excludeList = [...groupExclusions, ...generatedInBatch];
            const trivia = await generateTwoTruthsAndALie(category, group.age, excludeList);

            // Save to database
            await query(
              `INSERT INTO trivia_pool (category, age_group, persona, fact_1, fact_2, fact_3, lie_index)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                category,
                group.name,
                trivia.persona,
                trivia.facts[0],
                trivia.facts[1],
                trivia.facts[2],
                trivia.lieIndex
              ]
            );

            generatedInBatch.push(trivia.persona);
            totalAdded++;
          } catch (genErr) {
            console.error(
              `[cron-pool-maintenance] Failed to generate trivia for "${category}" - "${group.name}" (item ${i + 1}):`,
              genErr
            );
          }
        }

        if (generatedInBatch.length > 0) {
          addedReport.push(`${category}/${group.name}: +${generatedInBatch.length}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pool maintenance complete.`,
      deleted: deletedCount,
      added: totalAdded,
      details: addedReport
    });
  } catch (error) {
    console.error('[cron-pool-maintenance] System error:', error);
    return NextResponse.json(
      { error: 'Internal server error during pool maintenance' },
      { status: 500 }
    );
  }
}
