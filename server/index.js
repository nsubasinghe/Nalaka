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

// Get Business Partners for ProjectMaster dropdown
app.get('/api/customers', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured.'
      });
    }

    const result = await pool.query(
      `SELECT
        partnerid,
        description
      FROM public.business_partner
      ORDER BY partnerid;`
    );

    return res.status(200).json({
      success: true,
      customers: result.rows
    });
  } catch (error) {
    console.error('Business partner fetch error:', error);

    return res.status(500).json({
      error: 'Failed to retrieve business partners.'
    });
  }
});

// Get all Business Partners for management page
app.get('/api/business-partners', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured.'
      });
    }

    const result = await pool.query(
      `SELECT
        partnerid,
        description
      FROM public.business_partner
      ORDER BY partnerid;`
    );

    return res.status(200).json({
      success: true,
      businessPartners: result.rows
    });
  } catch (error) {
    console.error('Business Partner list error:', error);

    return res.status(500).json({
      error: 'Failed to retrieve Business Partners.'
    });
  }
});

// Create Business Partner
app.post('/api/business-partners', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured.'
      });
    }

    let {
      partnerid,
      description
    } = req.body;

    partnerid = partnerid?.trim().toUpperCase();
    description = description?.trim();

    if (!partnerid || !description) {
      return res.status(400).json({
        error: 'Partner ID and Description are required.'
      });
    }

    if (!/^[A-Z0-9]{1,10}$/.test(partnerid)) {
      return res.status(400).json({
        error:
          'Partner ID must contain only letters and numbers and cannot exceed 10 characters.'
      });
    }

    if (description.length > 50) {
      return res.status(400).json({
        error: 'Description cannot exceed 50 characters.'
      });
    }

    const result = await pool.query(
      `INSERT INTO public.business_partner (
        partnerid,
        description
      )
      VALUES ($1, $2)
      RETURNING
        partnerid,
        description;`,
      [
        partnerid,
        description
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Business Partner saved successfully.',
      businessPartner: result.rows[0]
    });
  } catch (error) {
    console.error('Business Partner insert error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'This Partner ID already exists.'
      });
    }

    if (error.code === '23514') {
      return res.status(400).json({
        error: 'The Business Partner data is invalid.'
      });
    }

    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Partner ID and Description are required.'
      });
    }

    return res.status(500).json({
      error: 'Failed to save Business Partner. Please try again.'
    });
  }
});

// Update Business Partner
app.put('/api/business-partners/:partnerid', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured.'
      });
    }

    const partnerid = req.params.partnerid
      ?.trim()
      .toUpperCase();

    const description = req.body.description
      ?.trim();

    if (!partnerid || !description) {
      return res.status(400).json({
        error: 'Partner ID and Description are required.'
      });
    }

    if (!/^[A-Z0-9]{1,10}$/.test(partnerid)) {
      return res.status(400).json({
        error: 'Invalid Partner ID.'
      });
    }

    if (description.length > 50) {
      return res.status(400).json({
        error: 'Description cannot exceed 50 characters.'
      });
    }

    const result = await pool.query(
      `UPDATE public.business_partner
      SET description = $1
      WHERE partnerid = $2
      RETURNING
        partnerid,
        description;`,
      [
        description,
        partnerid
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Business Partner was not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Business Partner updated successfully.',
      businessPartner: result.rows[0]
    });
  } catch (error) {
    console.error('Business Partner update error:', error);

    if (error.code === '23514') {
      return res.status(400).json({
        error: 'The Business Partner data is invalid.'
      });
    }

    return res.status(500).json({
      error: 'Failed to update Business Partner. Please try again.'
    });
  }
});

// Delete Business Partner
app.delete('/api/business-partners/:partnerid', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        error: 'DATABASE_URL is not configured.'
      });
    }

    const partnerid = req.params.partnerid
      ?.trim()
      .toUpperCase();

    if (!partnerid) {
      return res.status(400).json({
        error: 'Partner ID is required.'
      });
    }

    // Check whether ProjectMaster is using this partner
    const usageResult = await pool.query(
      `SELECT COUNT(*)::int AS usage_count
      FROM public.projectmaster
      WHERE customerid = $1;`,
      [partnerid]
    );

    if (usageResult.rows[0].usage_count > 0) {
      return res.status(409).json({
        error:
          'This Business Partner cannot be deleted because it is already used in ProjectMaster.'
      });
    }

    const result = await pool.query(
      `DELETE FROM public.business_partner
      WHERE partnerid = $1
      RETURNING
        partnerid,
        description;`,
      [partnerid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Business Partner was not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Business Partner deleted successfully.',
      businessPartner: result.rows[0]
    });
  } catch (error) {
    console.error('Business Partner delete error:', error);

    // Database FK protection as a second safety layer
    if (error.code === '23503') {
      return res.status(409).json({
        error:
          'This Business Partner cannot be deleted because it is being used by another record.'
      });
    }

    return res.status(500).json({
      error: 'Failed to delete Business Partner. Please try again.'
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