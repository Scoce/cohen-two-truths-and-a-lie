import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
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

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user into database
    try {
      await query(
        'INSERT INTO users (username, password_hash, age) VALUES ($1, $2, $3)',
        [trimmedUsername, passwordHash, userAge]
      );
      return NextResponse.json(
        { message: 'User created successfully' },
        { status: 201 }
      );
    } catch (dbErr: any) {
      // Check for unique violation error (Postgres error 23505)
      if (dbErr.code === '23505') {
        return NextResponse.json(
          { error: 'Username is already taken' },
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
