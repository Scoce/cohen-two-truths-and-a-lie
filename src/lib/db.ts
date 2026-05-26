import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
let pool: Pool | null = null;

if (connectionString) {
  if (process.env.NODE_ENV === 'production') {
    pool = new Pool({ connectionString });
  } else {
    const globalWithPool = global as typeof globalThis & {
      __neonPool?: Pool;
    };
    if (!globalWithPool.__neonPool) {
      globalWithPool.__neonPool = new Pool({ connectionString });
    }
    pool = globalWithPool.__neonPool;
  }
} else {
  console.warn('[db] Warning: DATABASE_URL is not set. Using in-memory fallback database.');
}

// ==========================================
// In-Memory Fallback Database Definitions
// ==========================================

interface MockUser {
  id: number;
  username: string;
  password_hash: string;
  score: number;
  age: number;
  created_at: Date;
}

interface MockGame {
  id: number;
  user_id: number;
  persona: string;
  category: string;
  fact_1: string;
  fact_2: string;
  fact_3: string;
  lie_index: number;
  guessed_index: number | null;
  is_correct: boolean | null;
  created_at: Date;
}

// Seed the default test user with age 8 for kid-friendly testing
const defaultTestUserPasswordHash = bcrypt.hashSync('password123', 10);

const mockUsers: MockUser[] = [
  {
    id: 1,
    username: 'testuser',
    password_hash: defaultTestUserPasswordHash,
    score: 0,
    age: 8,
    created_at: new Date(),
  },
];

const mockGames: MockGame[] = [];

// ==========================================
// Database Query Routing
// ==========================================

export const query = async (text: string, params: any[] = []) => {
  const start = Date.now();

  // 1. If real database is configured
  if (pool) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`[db] Postgres query executed in ${duration}ms (rows: ${res.rowCount || 0})`);
      return res;
    } catch (err) {
      console.error('[db] Postgres query error:', err);
      throw err;
    }
  }

  // 2. In-memory database query simulator
  const queryNormalized = text.trim().replace(/\s+/g, ' ');

  // SELECT * FROM users WHERE username = $1
  if (queryNormalized.includes('SELECT * FROM users WHERE username =')) {
    const username = params[0];
    const rows = mockUsers.filter((u) => u.username.toLowerCase() === username.toLowerCase());
    return { rows, rowCount: rows.length };
  }

  // INSERT INTO users (username, password_hash, age) or INSERT INTO users (username, password_hash)
  if (queryNormalized.includes('INSERT INTO users')) {
    const username = params[0];
    const password_hash = params[1];
    const age = params[2] !== undefined ? params[2] : 10;
    
    if (mockUsers.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      const err = new Error('duplicate key value violates unique constraint');
      (err as any).code = '23505'; // Postgres code for unique violation
      throw err;
    }

    const newUser: MockUser = {
      id: mockUsers.length + 1,
      username,
      password_hash,
      score: 0,
      age: parseInt(age, 10) || 10,
      created_at: new Date(),
    };
    mockUsers.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }

  // UPDATE users SET score = score + 10 WHERE id = $1 RETURNING score
  if (queryNormalized.includes('UPDATE users SET score = score + 10')) {
    const id = params[0];
    const user = mockUsers.find((u) => u.id === id);
    if (user) {
      user.score += 10;
      return { rows: [{ score: user.score }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // UPDATE users SET age = $1 WHERE id = $2
  if (queryNormalized.includes('UPDATE users SET age =')) {
    const age = params[0];
    const id = params[1];
    const user = mockUsers.find((u) => u.id === id);
    if (user) {
      user.age = parseInt(age, 10) || 10;
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // SELECT ... FROM users WHERE id = $1 (generic user finder)
  if (queryNormalized.includes('FROM users WHERE id =')) {
    const id = params[0];
    const user = mockUsers.find((u) => u.id === id);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // INSERT INTO games (user_id, persona, category, fact_1, fact_2, fact_3, lie_index)
  if (queryNormalized.includes('INSERT INTO games')) {
    const [user_id, persona, category, fact_1, fact_2, fact_3, lie_index] = params;
    const newGame: MockGame = {
      id: mockGames.length + 1,
      user_id,
      persona,
      category,
      fact_1,
      fact_2,
      fact_3,
      lie_index,
      guessed_index: null,
      is_correct: null,
      created_at: new Date(),
    };
    mockGames.push(newGame);
    return { rows: [newGame], rowCount: 1 };
  }

  // SELECT * FROM games WHERE id = $1 AND user_id = $2
  if (queryNormalized.includes('SELECT * FROM games WHERE id =')) {
    const [id, user_id] = params;
    const game = mockGames.find((g) => g.id === id && g.user_id === user_id);
    return { rows: game ? [game] : [], rowCount: game ? 1 : 0 };
  }

  // UPDATE games SET guessed_index = $1, is_correct = $2 WHERE id = $3
  if (queryNormalized.includes('UPDATE games SET guessed_index =')) {
    const [guessed_index, is_correct, id] = params;
    const game = mockGames.find((g) => g.id === id);
    if (game) {
      game.guessed_index = guessed_index;
      game.is_correct = is_correct;
      return { rows: [game], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  console.warn('[db] Unhandled query in in-memory simulator:', queryNormalized);
  return { rows: [], rowCount: 0 };
};

export { pool };
