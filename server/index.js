import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/neon-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

app.post('/api/projects', async (req, res) => {
  try {
    const {
      projectcode,
      versionid,
      projectname,
      projectdescription,
      projecttype,
      customerid,
      currency,
      status,
      createdby,
      updatedby
    } = req.body;

    if (!sql) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured.'
      });
    }

    if (!projectcode || !versionid || !projectname) {
      return res.status(400).json({
        error: 'projectcode, versionid, and projectname are required.'
      });
    }

    const [project] = await sql`
      INSERT INTO projectmaster (
        projectcode,
        versionid,
        projectname,
        projectdescription,
        projecttype,
        customerid,
        currency,
        status,
        createdby,
        updatedby
      ) VALUES (
        ${projectcode},
        ${versionid},
        ${projectname},
        ${projectdescription || null},
        ${projecttype || null},
        ${customerid || null},
        ${currency || null},
        ${status || null},
        ${createdby || null},
        ${updatedby || null}
      )
      RETURNING *;
    `;

    return res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Insert error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to insert data into ProjectMaster'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
