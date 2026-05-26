import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Query user
    const res = await query('SELECT * FROM users WHERE username = $1', [username.trim()]);
    if (res.rowCount === 0) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

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
        score: user.score,
      },
    });

    // Set cookie
    const isProd = process.env.NODE_ENV === 'production';
    response.headers.set(
      'Set-Cookie',
      `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800;${isProd ? ' Secure;' : ''}`
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
