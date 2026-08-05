import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from '@/lib/rateLimit';
import { getUserFromRequest, signJWT } from '@/lib/auth';

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

    const { username, password, age } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (trimmedUsername.length > 30) {
      return NextResponse.json(
        { error: 'Username must be 30 characters or fewer' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        { error: 'Username may only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (password.length > 72) {
      return NextResponse.json(
        { error: 'Password must be 72 characters or fewer' },
        { status: 400 }
      );
    }

    let userAge = 10;
    if (age !== undefined) {
      userAge = parseInt(age, 10);
      if (isNaN(userAge) || userAge < 1 || userAge > 120) {
        return NextResponse.json(
          { error: 'Please enter a valid age between 1 and 120' },
          { status: 400 }
        );
      }
    }

    // Check if client is currently in a guest session
    const existingGuest = await getUserFromRequest(req);
    const isGuestSession = existingGuest && existingGuest.isGuest;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    try {
      let createdUserId: number;

      if (isGuestSession) {
        // Upgrade existing guest user record to permanent registered user
        const updateRes = await query(
          'UPDATE users SET username = $1, password_hash = $2, age = $3 WHERE id = $4 RETURNING id',
          [trimmedUsername, passwordHash, userAge, existingGuest.userId]
        );
        createdUserId = updateRes.rows[0].id;
      } else {
        // Insert brand new user into database
        const insertRes = await query(
          'INSERT INTO users (username, password_hash, age) VALUES ($1, $2, $3) RETURNING id',
          [trimmedUsername, passwordHash, userAge]
        );
        createdUserId = insertRes.rows[0].id;
      }

      // Automatically sign in the user
      const token = await signJWT({
        userId: createdUserId,
        username: trimmedUsername,
        isGuest: false,
        age: userAge,
      });

      const response = NextResponse.json(
        { message: isGuestSession ? 'Account saved successfully!' : 'User created successfully', userId: createdUserId },
        { status: isGuestSession ? 200 : 201 }
      );

      const isProd = process.env.NODE_ENV === 'production';
      response.headers.set(
        'Set-Cookie',
        `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400;${isProd ? ' Secure;' : ''}`
      );

      return response;
    } catch (dbErr: unknown) {
      const pgError = dbErr as { code?: string };
      if (pgError.code === '23505') {
        return NextResponse.json(
          { error: 'Could not create account. Try a different username.' },
          { status: 400 }
        );
      }
      throw dbErr;
    }
  } catch (error) {
    console.error('[signup-api] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
