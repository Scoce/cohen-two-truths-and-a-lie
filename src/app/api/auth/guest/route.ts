import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, AUTH_RATE_LIMIT);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }

    let age = 10;
    try {
      const body = await req.json();
      if (body && typeof body.age === 'number' && body.age > 0 && body.age < 120) {
        age = body.age;
      }
    } catch {
      // Body optional
    }

    // Generate unique guest username & insert temporary guest record
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const guestUsername = `Guest_${randomSuffix}`;

    const res = await query(
      `INSERT INTO users (username, password_hash, age) 
       VALUES ($1, $2, $3) 
       RETURNING id, username, age, score`,
      [guestUsername, '', age]
    );

    const user = res.rows[0];

    // Sign JWT with guest claims
    const token = await signJWT({
      userId: user.id,
      username: user.username,
      isGuest: true,
      age: user.age,
    });

    const response = NextResponse.json({
      message: 'Guest session initialized',
      user: {
        id: user.id,
        username: user.username,
        score: user.score,
        age: user.age,
        isGuest: true,
      },
    });

    const isProd = process.env.NODE_ENV === 'production';
    response.headers.set(
      'Set-Cookie',
      `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400;${isProd ? ' Secure;' : ''}`
    );

    return response;
  } catch (error) {
    console.error('[guest-api] Error initializing guest session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
