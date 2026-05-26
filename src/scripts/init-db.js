const fs = require('fs');
const path = require('path');
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

// Custom zero-dependency .env.local loader
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log(`[init-db] Loading environment from ${envPath}`);
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      // Ignore comments and empty lines
      if (line.trim().startsWith('#') || !line.includes('=')) return;
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove surrounding quotes
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    });
  } else {
    console.warn('[init-db] No .env.local file found. Relying on system environment variables.');
  }
}

async function run() {
  loadEnv();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[init-db] Error: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  console.log('[init-db] Connecting to Neon database...');
  const pool = new Pool({ connectionString });

  try {
    // 1. Create Users Table with Age column
    console.log('[init-db] Creating "users" table with "age" column...');
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

    // Run migration just in case table exists but doesn't have age column
    try {
      console.log('[init-db] Running migration to ensure "age" column exists...');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS age INT DEFAULT 10;');
    } catch (migErr) {
      console.log('[init-db] Age column check completed.');
    }

    // 2. Create Games Table
    console.log('[init-db] Creating "games" table...');
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Seed Test User
    const testUsername = 'testuser';
    const testPassword = 'password123';
    console.log(`[init-db] Checking if test user "${testUsername}" exists...`);
    
    const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [testUsername]);
    
    if (userRes.rowCount === 0) {
      console.log(`[init-db] Generating password hash for "${testUsername}"...`);
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(testPassword, salt);
      
      // Seed testuser with age 8 for kid-friendly testing
      await pool.query(
        'INSERT INTO users (username, password_hash, age) VALUES ($1, $2, 8)',
        [testUsername, passwordHash]
      );
      console.log(`[init-db] Test user "${testUsername}" created successfully with password "${testPassword}" and age 8!`);
    } else {
      console.log(`[init-db] Test user "${testUsername}" already exists.`);
    }

    console.log('[init-db] Database initialization completed successfully!');
  } catch (error) {
    console.error('[init-db] Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
