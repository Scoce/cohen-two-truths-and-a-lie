import { NextResponse } from 'next/server';
import { getRoom, updateRoomStatus } from '@/lib/classroomStore';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = getRoom(code);

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('[get-room-api] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch room status' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { status, currentGameId } = await req.json();

    updateRoomStatus(code, status, currentGameId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[update-room-api] Error:', error);
    return NextResponse.json({ error: 'Failed to update room status' }, { status: 500 });
  }
}
