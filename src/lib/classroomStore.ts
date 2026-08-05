export interface ConnectedStudent {
  id: string;
  nickname: string;
  avatar: string;
  joinedAt: number;
}

export interface StudentSubmission {
  studentName: string;
  avatar: string;
  guessedIndex: number;
  secondsTaken: number;
  isCorrect: boolean;
  score: number;
}

export interface ClassroomRoom {
  roomCode: string;
  status: 'lobby' | 'in_progress' | 'completed';
  category: string;
  difficulty: string;
  ageGroup: number;
  totalRounds: number;
  currentRound: number;
  currentGameId?: number;
  persona?: string;
  createdAt: number;
  students: ConnectedStudent[];
  submissions: StudentSubmission[];
}

// Global in-memory room storage map (keyed by roomCode)
const globalRooms = new Map<string, ClassroomRoom>();

export function createRoom(config: {
  roomCode: string;
  category: string;
  difficulty: string;
  ageGroup: number;
  totalRounds: number;
}): ClassroomRoom {
  const existing = globalRooms.get(config.roomCode);
  if (existing) {
    existing.category = config.category;
    existing.difficulty = config.difficulty;
    existing.ageGroup = config.ageGroup;
    existing.totalRounds = config.totalRounds;
    return existing;
  }

  const room: ClassroomRoom = {
    roomCode: config.roomCode,
    status: 'lobby',
    category: config.category,
    difficulty: config.difficulty,
    ageGroup: config.ageGroup,
    totalRounds: config.totalRounds,
    currentRound: 1,
    createdAt: Date.now(),
    students: [],
    submissions: [],
  };

  globalRooms.set(config.roomCode, room);
  return room;
}

export function getRoom(roomCode: string): ClassroomRoom | undefined {
  return globalRooms.get(roomCode);
}

export function joinRoom(roomCode: string, student: { nickname: string; avatar: string }): { success: boolean; studentId?: string; error?: string } {
  let room = globalRooms.get(roomCode);

  // If room doesn't exist yet in memory (e.g. server restart), initialize fallback room
  if (!room) {
    room = createRoom({
      roomCode,
      category: 'sports',
      difficulty: 'Medium',
      ageGroup: 10,
      totalRounds: 5,
    });
  }

  // Check if student with same nickname already joined
  const existingIndex = room.students.findIndex(s => s.nickname.toLowerCase() === student.nickname.toLowerCase());
  if (existingIndex !== -1) {
    // Update avatar if rejoining
    room.students[existingIndex].avatar = student.avatar;
    return { success: true, studentId: room.students[existingIndex].id };
  }

  const newStudent: ConnectedStudent = {
    id: Math.random().toString(36).substring(2, 9),
    nickname: student.nickname.trim(),
    avatar: student.avatar || '🐶',
    joinedAt: Date.now(),
  };

  room.students.push(newStudent);
  return { success: true, studentId: newStudent.id };
}

export function updateRoomStatus(
  roomCode: string,
  status: 'lobby' | 'in_progress' | 'completed',
  currentGameId?: number,
  persona?: string
) {
  const room = globalRooms.get(roomCode);
  if (room) {
    room.status = status;
    if (currentGameId) {
      room.currentGameId = currentGameId;
    }
    if (persona) {
      room.persona = persona;
    }
    if (status === 'in_progress') {
      room.submissions = []; // Clear submissions for new round
    }
  }
}

export function addSubmission(roomCode: string, sub: { studentName: string; avatar: string; guessedIndex: number; secondsTaken: number; isCorrect: boolean; score: number }) {
  const room = globalRooms.get(roomCode);
  if (room) {
    // Replace existing submission if student resubmits in same round
    const idx = room.submissions.findIndex(s => s.studentName.toLowerCase() === sub.studentName.toLowerCase());
    if (idx !== -1) {
      room.submissions[idx] = sub;
    } else {
      room.submissions.push(sub);
    }
    // Sort submissions by score descending
    room.submissions.sort((a, b) => b.score - a.score);
  }
}
