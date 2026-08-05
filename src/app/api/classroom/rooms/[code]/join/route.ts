import { NextResponse } from 'next/server';
import { joinRoom } from '@/lib/classroomStore';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { nickname, avatar } = await req.json();

    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json({ error: 'Nickname is required' }, { status: 400 });
    }

    const result = joinRoom(code, { nickname: nickname.trim(), avatar: avatar || '🐶' });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[join-room-api] Error:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
