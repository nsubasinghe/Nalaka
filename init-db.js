import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initializeDatabase() {
  try {
    const sqlFilePath = path.join(process.cwd(), 'sql', 'ProjectMaster.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Connecting to Neon database...');
    const client = await pool.connect();

    console.log('Creating ProjectMaster table...');
    await client.query(sqlContent);

    console.log('✅ Database initialized successfully!');
    await client.release();
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
