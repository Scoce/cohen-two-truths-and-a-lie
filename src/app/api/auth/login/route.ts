import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, AUTH_RATE_LIMIT);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length > 30 || password.length > 72) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Query user
    const res = await query('SELECT * FROM users WHERE username = $1', [trimmedUsername]);
    if (res.rowCount === 0) {
      console.warn(`[security] Failed login attempt for user "${trimmedUsername}" from IP ${ip}`);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.warn(`[security] Failed login attempt for user "${trimmedUsername}" from IP ${ip}`);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Reset user score to 0 on successful login
    await query('UPDATE users SET score = 0 WHERE id = $1', [user.id]);

    // Sign JWT
    const token = await signJWT({
      userId: user.id,
      username: user.username,
    });

    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        score: 0,
      },
    });

    // Set cookie
    const isProd = process.env.NODE_ENV === 'production';
    response.headers.set(
      'Set-Cookie',
      `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400;${isProd ? ' Secure;' : ''}`
    );

    return response;
  } catch (error) {
    console.error('[login-api] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
