import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
}

// Get active Project Types
app.get('/api/project-types', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured.'
      });
    }

    const result = await pool.query(
      `SELECT
        projecttypeid,
        projecttypename
      FROM public.project_type_master
      WHERE isactive = TRUE
      ORDER BY projecttypeid;`
    );

    return res.status(200).json({
      success: true,
      projectTypes: result.rows
    });
  } catch (error) {
    console.error('Project type fetch error:', error);

    return res.status(500).json({
      error: 'Failed to retrieve project types.'
    });
  }
});

// Get active Customers
app.get('/api/customers', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured.'
      });
    }

    const result = await pool.query(
      `SELECT
        customerid,
        customername
      FROM public.customer_master
      WHERE isactive = TRUE
      ORDER BY customerid;`
    );

    return res.status(200).json({
      success: true,
      customers: result.rows
    });
  } catch (error) {
    console.error('Customer fetch error:', error);

    return res.status(500).json({
      error: 'Failed to retrieve customers.'
    });
  }
});

// Get active Currencies
app.get('/api/currencies', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured.'
      });
    }

    const result = await pool.query(
      `SELECT
        currencycode,
        currencyname
      FROM public.currency_master
      WHERE isactive = TRUE
      ORDER BY currencycode;`
    );

    return res.status(200).json({
      success: true,
      currencies: result.rows
    });
  } catch (error) {
    console.error('Currency fetch error:', error);

    return res.status(500).json({
      error: 'Failed to retrieve currencies.'
    });
  }
});

// Get active Statuses
app.get('/api/statuses', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured.'
      });
    }

    const result = await pool.query(
      `SELECT
        statuscode,
        statusname
      FROM public.status_master
      WHERE isactive = TRUE
      ORDER BY statuscode;`
    );

    return res.status(200).json({
      success: true,
      statuses: result.rows
    });
  } catch (error) {
    console.error('Status fetch error:', error);

    return res.status(500).json({
      error: 'Failed to retrieve statuses.'
    });
  }
});

// Create Project
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

    if (!pool) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured.'
      });
    }

    if (!projectcode || !versionid || !projectname) {
      return res.status(400).json({
        error: 'projectcode, versionid, and projectname are required.'
      });
    }

    const result = await pool.query(
      `INSERT INTO public.projectmaster (
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
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING *;`,
      [
        projectcode,
        versionid,
        projectname,
        projectdescription || null,
        projecttype || null,
        customerid || null,
        currency || null,
        status || null,
        createdby || null,
        updatedby || null
      ]
    );

    return res.status(201).json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Insert error:', error);

    return res.status(500).json({
      error: error.message || 'Failed to insert data into ProjectMaster'
    });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});