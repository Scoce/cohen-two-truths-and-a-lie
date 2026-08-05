import { NextResponse } from 'next/server';
import { moderateStudentNickname } from '@/lib/gemini';
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, AUTH_RATE_LIMIT);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { allowed: false, reason: 'Too many nickname attempts. Please slow down.' },
        { status: 429 }
      );
    }

    const { nickname } = await req.json();

    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json(
        { allowed: false, reason: 'Nickname is required.' },
        { status: 400 }
      );
    }

    const moderation = await moderateStudentNickname(nickname);
    return NextResponse.json(moderation);
  } catch (error) {
    console.error('[moderate-nickname-api] Error:', error);
    return NextResponse.json(
      { allowed: true }, // Fail open gracefully if internal error
      { status: 200 }
    );
  }
}
