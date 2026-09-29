import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const {
  Pool
} = pkg;

/* =========================================================
   POSTGRESQL CONNECTION POOL
========================================================= */

let pool = null;

if (
  process.env.DATABASE_URL
) {
  pool = new Pool({
    connectionString:
      process.env.DATABASE_URL,

    ssl: {
      rejectUnauthorized:
        false
    }
  });
}

/* =========================================================
   DATABASE AVAILABILITY
========================================================= */

export const hasDatabase =
  () => {
    return Boolean(
      pool
    );
  };

/* =========================================================
   DATABASE POOL
========================================================= */

export default pool;