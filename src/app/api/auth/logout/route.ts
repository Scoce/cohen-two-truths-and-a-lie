import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Clear the cookie by setting Max-Age=0
  response.headers.set(
    'Set-Cookie',
    'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );

  return response;
}
