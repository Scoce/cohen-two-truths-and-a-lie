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

interface MockSession {
  id: number;
  user_id: number;
  category: string;
  question_count: number;
  score: number;
  completed: boolean;
  hints_used: number;
  current_streak: number;
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
  session_id: number | null;
  created_at: Date;
}

interface MockLeaderboard {
  id: number;
  user_id: number;
  player_name: string;
  score: number;
  category: string;
  age_group: string;
  session_id: number | null;
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

const mockSessions: MockSession[] = [];
const mockGames: MockGame[] = [];
const mockLeaderboards: MockLeaderboard[] = [];

let dbInitialized = false;
let dbInitializing = false;

async function ensureTables() {
  if (dbInitialized || dbInitializing || !pool) return;
  dbInitializing = true;
  try {
    console.log('[db] Verifying database schema on Neon...');
    
    // 1. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        score INT DEFAULT 0,
        age INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure age column exists
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS age INT DEFAULT 10;');
    } catch (migErr) {
      // Ignore
    }

    // 2. Create Sessions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        question_count INT DEFAULT 0,
        score INT DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        hints_used INT DEFAULT 0,
        current_streak INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure sessions columns exist
    try {
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS hints_used INT DEFAULT 0;');
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;');
    } catch (migErr) {
      // Ignore
    }

    // 3. Create Games Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        persona VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        fact_1 TEXT NOT NULL,
        fact_2 TEXT NOT NULL,
        fact_3 TEXT NOT NULL,
        lie_index INT NOT NULL,
        guessed_index INT,
        is_correct BOOLEAN,
        session_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure session_id column exists
    try {
      await pool.query('ALTER TABLE games ADD COLUMN IF NOT EXISTS session_id INT REFERENCES sessions(id) ON DELETE SET NULL;');
    } catch (migErr) {
      // Ignore
    }

    // 4. Create Leaderboards Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leaderboards (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        player_name VARCHAR(50) NOT NULL,
        score INT NOT NULL,
        category VARCHAR(50) NOT NULL,
        age_group VARCHAR(20) NOT NULL,
        session_id INT REFERENCES sessions(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure session_id column exists on leaderboards table
    try {
      await pool.query('ALTER TABLE leaderboards ADD COLUMN IF NOT EXISTS session_id INT REFERENCES sessions(id) ON DELETE SET NULL;');
    } catch (migErr) {
      // Ignore
    }

    // Ensure default test user exists
    const userCheck = await pool.query("SELECT id FROM users WHERE username = 'testuser'");
    if (userCheck.rows.length === 0) {
      console.log('[db] Seeding testuser into Neon database...');
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync('password123', salt);
      await pool.query(
        "INSERT INTO users (username, password_hash, age) VALUES ('testuser', $1, 8)",
        [passwordHash]
      );
      console.log('[db] Seeded testuser successfully.');
    }

    dbInitialized = true;
  } catch (err) {
    console.error('[db] Database auto-initialization/migration failed:', err);
  } finally {
    dbInitializing = false;
  }
}

// ==========================================
// Database Query Routing
// ==========================================

export const query = async (text: string, params: any[] = []) => {
  const start = Date.now();

  // 1. If real database is configured
  if (pool) {
    if (!dbInitialized) {
      await ensureTables();
    }
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

  // INSERT INTO users
  if (queryNormalized.includes('INSERT INTO users')) {
    const username = params[0];
    const password_hash = params[1];
    const age = params[2] !== undefined ? params[2] : 10;
    
    if (mockUsers.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      const err = new Error('duplicate key value violates unique constraint');
      (err as any).code = '23505';
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

  // UPDATE users SET score =
  if (queryNormalized.includes('UPDATE users SET score =')) {
    if (queryNormalized.includes('score = 0')) {
      const id = params[0];
      const user = mockUsers.find((u) => u.id === id);
      if (user) {
        user.score = 0;
        return { rows: [{ score: 0 }], rowCount: 1 };
      }
    } else {
      const points = params[0];
      const id = params[1];
      const user = mockUsers.find((u) => u.id === id);
      if (user) {
        user.score += points;
        return { rows: [{ score: user.score }], rowCount: 1 };
      }
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

  // SELECT ... FROM users WHERE id = $1
  if (queryNormalized.includes('FROM users WHERE id =')) {
    const id = params[0];
    const user = mockUsers.find((u) => u.id === id);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // SELECT * FROM sessions WHERE user_id = $1 AND completed = FALSE
  if (queryNormalized.includes('FROM sessions') && queryNormalized.includes('completed = FALSE')) {
    const user_id = params[0];
    const session = mockSessions.find((s) => s.user_id === user_id && !s.completed);
    return { rows: session ? [session] : [], rowCount: session ? 1 : 0 };
  }

  // INSERT INTO sessions
  if (queryNormalized.includes('INSERT INTO sessions')) {
    const [user_id, category, score, question_count, completed] = params;
    const newSession: MockSession = {
      id: mockSessions.length + 1,
      user_id,
      category,
      question_count: question_count || 0,
      score: score || 0,
      completed: completed || false,
      hints_used: 0,
      current_streak: 0,
      created_at: new Date(),
    };
    mockSessions.push(newSession);
    return { rows: [newSession], rowCount: 1 };
  }

  // UPDATE sessions SET
  if (queryNormalized.includes('UPDATE sessions SET')) {
    const id = params[params.length - 1];
    const session = mockSessions.find((s) => s.id === id);
    if (session) {
      if (queryNormalized.includes('hints_used = hints_used + 1')) {
        session.hints_used += 1;
      } else if (queryNormalized.includes('question_count =')) {
        const [question_count] = params;
        session.question_count = question_count;
      } else if (queryNormalized.includes('score =') && queryNormalized.includes('current_streak =') && queryNormalized.includes('category =')) {
        const [score, completed, current_streak, category] = params;
        session.score = score;
        session.completed = completed;
        session.current_streak = current_streak;
        session.category = category;
      } else if (queryNormalized.includes('score =') && queryNormalized.includes('completed =') && queryNormalized.includes('category =')) {
        const [score, completed, category] = params;
        session.score = score;
        session.completed = completed;
        session.category = category;
      } else if (queryNormalized.includes('score =') && queryNormalized.includes('completed =')) {
        const [score, completed] = params;
        session.score = score;
        session.completed = completed;
      } else if (queryNormalized.includes('completed =')) {
        const [completed] = params;
        session.completed = completed;
      }
      return { rows: [session], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // INSERT INTO games
  if (queryNormalized.includes('INSERT INTO games')) {
    const [user_id, persona, category, fact_1, fact_2, fact_3, lie_index, session_id] = params;
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
      session_id: session_id || null,
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

  // SELECT COUNT(*) as correct_count FROM games WHERE session_id = $1 AND is_correct = TRUE
  if (queryNormalized.includes('COUNT(*)') && queryNormalized.includes('FROM games WHERE session_id =')) {
    const session_id = params[0];
    const correctCount = mockGames.filter((g) => g.session_id === session_id && g.is_correct === true).length;
    return { rows: [{ correct_count: correctCount }], rowCount: 1 };
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

  // INSERT INTO leaderboards
  if (queryNormalized.includes('INSERT INTO leaderboards')) {
    const [user_id, player_name, score, category, age_group, session_id] = params;
    const newRecord: MockLeaderboard = {
      id: mockLeaderboards.length + 1,
      user_id,
      player_name,
      score,
      category,
      age_group,
      session_id: session_id || null,
      created_at: new Date(),
    };
    mockLeaderboards.push(newRecord);
    return { rows: [newRecord], rowCount: 1 };
  }

  // SELECT ... FROM leaderboards WHERE session_id = $1
  if (queryNormalized.includes('FROM leaderboards WHERE session_id =')) {
    const session_id = params[0];
    const record = mockLeaderboards.find((l) => l.session_id === session_id);
    return { rows: record ? [record] : [], rowCount: record ? 1 : 0 };
  }

  // SELECT ... FROM leaderboards
  if (queryNormalized.includes('FROM leaderboards')) {
    const now = new Date();
    const filtered = mockLeaderboards
      .filter((l) => l.created_at.getMonth() === now.getMonth() && l.created_at.getFullYear() === now.getFullYear())
      .sort((a, b) => b.score - a.score || a.created_at.getTime() - b.created_at.getTime())
      .slice(0, 10);
    return { rows: filtered, rowCount: filtered.length };
  }

  console.warn('[db] Unhandled query in in-memory simulator:', queryNormalized);
  return { rows: [], rowCount: 0 };
};

export { pool };
