import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const sessionUser = await getUserFromRequest(req);
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { age } = await req.json();

    if (age === undefined || typeof age !== 'number' || age < 1 || age > 120) {
      return NextResponse.json(
        { error: 'Please enter a valid age between 1 and 120' },
        { status: 400 }
      );
    }

    // Update user's age
    await query(
      'UPDATE users SET age = $1 WHERE id = $2',
      [age, sessionUser.userId]
    );

    return NextResponse.json({
      message: 'Age updated successfully',
      age
    });
  } catch (error) {
    console.error('[update-age-api] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
