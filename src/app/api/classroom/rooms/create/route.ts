import { NextResponse } from 'next/server';
import { createRoom } from '@/lib/classroomStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomCode, category, difficulty, ageGroup, totalRounds } = body;

    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    const room = createRoom({
      roomCode: String(roomCode),
      category: category || 'sports',
      difficulty: difficulty || 'Medium',
      ageGroup: ageGroup || 10,
      totalRounds: totalRounds || 5,
    });

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('[create-room-api] Error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
