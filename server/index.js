import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import { randomUUID } from 'crypto';

dotenv.config();

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

function requireDatabase(res) {
  if (!pool) {
    res.status(500).json({
      success: false,
      error: 'DATABASE_URL is not configured.'
    });

    return false;
  }

  return true;
}

function sendDatabaseError(res, error, defaultMessage) {
  console.error(defaultMessage, error);

  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'A record with the same key already exists.'
    });
  }

  if (error.code === '23503') {
    return res.status(409).json({
      success: false,
      error:
        'This operation cannot be completed because the record is referenced by another table.'
    });
  }

  if (error.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'One or more values failed a database validation rule.'
    });
  }

  if (error.code === '23502') {
    return res.status(400).json({
      success: false,
      error: 'One or more required values are missing.'
    });
  }

  return res.status(500).json({
    success: false,
    error: error.message || defaultMessage
  });
}

/* =========================================================
   HEALTH
========================================================= */

app.get('/api/health', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query('SELECT NOW() AS server_time;');

    return res.status(200).json({
      success: true,
      status: 'ok',
      database: 'connected',
      serverTime: result.rows[0].server_time
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Database health check failed.'
    );
  }
});

/* =========================================================
   DATABASE TABLE CHECK
========================================================= */

app.get('/api/database/tables', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    return res.status(200).json({
      success: true,
      tables: result.rows.map((row) => row.table_name)
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve database tables.'
    );
  }
});

/* =========================================================
   PROJECT TYPE
========================================================= */

app.get('/api/project-types', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT
        "ProjectType" AS projecttype,
        "Description" AS description
      FROM "ProjectType"
      ORDER BY "ProjectType";
    `);

    return res.status(200).json({
      success: true,
      projectTypes: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve project types.'
    );
  }
});

app.post('/api/project-types', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    let { projecttype, description } = req.body;

    projecttype = projecttype?.trim();
    description = description?.trim();

    if (!projecttype || !description) {
      return res.status(400).json({
        success: false,
        error: 'Project Type and Description are required.'
      });
    }

    const result = await pool.query(
      `
        INSERT INTO "ProjectType" (
          "ProjectType",
          "Description"
        )
        VALUES ($1, $2)
        RETURNING
          "ProjectType" AS projecttype,
          "Description" AS description;
      `,
      [projecttype, description]
    );

    return res.status(201).json({
      success: true,
      projectType: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to create project type.'
    );
  }
});

/* =========================================================
   BUSINESS PARTNER
========================================================= */

app.get('/api/business-partners', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT
        "PartnerId" AS partnerid,
        "Description" AS description
      FROM "BusinessPartner"
      ORDER BY "PartnerId";
    `);

    return res.status(200).json({
      success: true,
      businessPartners: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve business partners.'
    );
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT
        "PartnerId" AS partnerid,
        "Description" AS description
      FROM "BusinessPartner"
      ORDER BY "PartnerId";
    `);

    return res.status(200).json({
      success: true,
      customers: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve customers.'
    );
  }
});

app.post('/api/business-partners', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    let { partnerid, description } = req.body;

    partnerid = partnerid?.trim().toUpperCase();
    description = description?.trim();

    if (!partnerid || !description) {
      return res.status(400).json({
        success: false,
        error: 'Partner ID and Description are required.'
      });
    }

    if (partnerid.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Partner ID cannot exceed 10 characters.'
      });
    }

    if (description.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Description cannot exceed 50 characters.'
      });
    }

    const result = await pool.query(
      `
        INSERT INTO "BusinessPartner" (
          "PartnerId",
          "Description"
        )
        VALUES ($1, $2)
        RETURNING
          "PartnerId" AS partnerid,
          "Description" AS description;
      `,
      [partnerid, description]
    );

    return res.status(201).json({
      success: true,
      message: 'Business Partner saved successfully.',
      businessPartner: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to create Business Partner.'
    );
  }
});

app.put('/api/business-partners/:partnerid', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const partnerid = req.params.partnerid
      ?.trim()
      .toUpperCase();

    const description = req.body.description?.trim();

    if (!partnerid || !description) {
      return res.status(400).json({
        success: false,
        error: 'Partner ID and Description are required.'
      });
    }

    const result = await pool.query(
      `
        UPDATE "BusinessPartner"
        SET "Description" = $1
        WHERE "PartnerId" = $2
        RETURNING
          "PartnerId" AS partnerid,
          "Description" AS description;
      `,
      [description, partnerid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Business Partner was not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Business Partner updated successfully.',
      businessPartner: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to update Business Partner.'
    );
  }
});

app.delete('/api/business-partners/:partnerid', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const partnerid = req.params.partnerid
      ?.trim()
      .toUpperCase();

    const result = await pool.query(
      `
        DELETE FROM "BusinessPartner"
        WHERE "PartnerId" = $1
        RETURNING
          "PartnerId" AS partnerid,
          "Description" AS description;
      `,
      [partnerid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Business Partner was not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Business Partner deleted successfully.',
      businessPartner: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to delete Business Partner.'
    );
  }
});

/* =========================================================
   CURRENCY
========================================================= */

app.get('/api/currencies', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT
        "CurrCode" AS currcode,
        "Description" AS description
      FROM "Currency"
      ORDER BY "CurrCode";
    `);

    return res.status(200).json({
      success: true,
      currencies: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve currencies.'
    );
  }
});

app.post('/api/currencies', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    let { currcode, description } = req.body;

    currcode = currcode?.trim().toUpperCase();
    description = description?.trim();

    if (!currcode || !description) {
      return res.status(400).json({
        success: false,
        error: 'Currency Code and Description are required.'
      });
    }

    const result = await pool.query(
      `
        INSERT INTO "Currency" (
          "CurrCode",
          "Description"
        )
        VALUES ($1, $2)
        RETURNING
          "CurrCode" AS currcode,
          "Description" AS description;
      `,
      [currcode, description]
    );

    return res.status(201).json({
      success: true,
      currency: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to create currency.'
    );
  }
});

/* =========================================================
   PROJECT PHASE
========================================================= */

app.get('/api/project-phases', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT
        "PhaseId" AS phaseid,
        "Description" AS description
      FROM "ProjectPhase"
      ORDER BY "PhaseId";
    `);

    return res.status(200).json({
      success: true,
      projectPhases: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve Project Phases.'
    );
  }
});

app.post('/api/project-phases', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const { phaseid, description } = req.body;

    if (!phaseid || !description) {
      return res.status(400).json({
        success: false,
        error: 'Phase ID and Description are required.'
      });
    }

    const result = await pool.query(
      `
        INSERT INTO "ProjectPhase" (
          "PhaseId",
          "Description"
        )
        VALUES ($1, $2)
        RETURNING
          "PhaseId" AS phaseid,
          "Description" AS description;
      `,
      [phaseid.trim(), description.trim()]
    );

    return res.status(201).json({
      success: true,
      projectPhase: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to create Project Phase.'
    );
  }
});

/* =========================================================
   RESOURCE TYPE
========================================================= */

app.get('/api/resource-types', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT
        "ResourceType" AS resourcetype,
        "Description" AS description
      FROM "ResourceType"
      ORDER BY "ResourceType";
    `);

    return res.status(200).json({
      success: true,
      resourceTypes: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve Resource Types.'
    );
  }
});

app.post('/api/resource-types', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const { resourcetype, description } = req.body;

    if (!resourcetype || !description) {
      return res.status(400).json({
        success: false,
        error: 'Resource Type and Description are required.'
      });
    }

    const result = await pool.query(
      `
        INSERT INTO "ResourceType" (
          "ResourceType",
          "Description"
        )
        VALUES ($1, $2)
        RETURNING
          "ResourceType" AS resourcetype,
          "Description" AS description;
      `,
      [resourcetype.trim(), description.trim()]
    );

    return res.status(201).json({
      success: true,
      resourceType: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to create Resource Type.'
    );
  }
});

/* =========================================================
   ROLE CATEGORY
========================================================= */

app.get('/api/role-categories', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT
        "RoleCatID" AS rolecatid,
        "Description" AS description
      FROM "RoleCategory"
      ORDER BY "RoleCatID";
    `);

    return res.status(200).json({
      success: true,
      roleCategories: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve Role Categories.'
    );
  }
});

app.post('/api/role-categories', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const { rolecatid, description } = req.body;

    if (!rolecatid || !description) {
      return res.status(400).json({
        success: false,
        error: 'Role Category ID and Description are required.'
      });
    }

    const result = await pool.query(
      `
        INSERT INTO "RoleCategory" (
          "RoleCatID",
          "Description"
        )
        VALUES ($1, $2)
        RETURNING
          "RoleCatID" AS rolecatid,
          "Description" AS description;
      `,
      [rolecatid.trim(), description.trim()]
    );

    return res.status(201).json({
      success: true,
      roleCategory: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to create Role Category.'
    );
  }
});

/* =========================================================
   PROJECT ROLE
========================================================= */

app.get('/api/project-roles', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT
        pr."ProjectRoleID" AS projectroleid,
        pr."RoleCatID" AS rolecatid,
        pr."Description" AS description,
        rc."Description" AS rolecategory
      FROM "ProjectRole" pr
      LEFT JOIN "RoleCategory" rc
        ON rc."RoleCatID" = pr."RoleCatID"
      ORDER BY pr."ProjectRoleID";
    `);

    return res.status(200).json({
      success: true,
      projectRoles: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve Project Roles.'
    );
  }
});

app.post('/api/project-roles', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const {
      projectroleid,
      rolecatid,
      description
    } = req.body;

    if (!projectroleid || !rolecatid || !description) {
      return res.status(400).json({
        success: false,
        error:
          'Project Role ID, Role Category ID and Description are required.'
      });
    }

    const result = await pool.query(
      `
        INSERT INTO "ProjectRole" (
          "ProjectRoleID",
          "RoleCatID",
          "Description"
        )
        VALUES ($1, $2, $3)
        RETURNING
          "ProjectRoleID" AS projectroleid,
          "RoleCatID" AS rolecatid,
          "Description" AS description;
      `,
      [
        projectroleid.trim(),
        rolecatid.trim(),
        description.trim()
      ]
    );

    return res.status(201).json({
      success: true,
      projectRole: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to create Project Role.'
    );
  }
});

/* =========================================================
   PROJECT MASTER
========================================================= */

app.get('/api/projects', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT
        pm."ProjectID" AS projectid,
        pm."ProjectCode" AS projectcode,
        pm."VersionID" AS versionid,
        pm."ProjectName" AS projectname,
        pm."ProjectDescription" AS projectdescription,
        pm."ProjectType" AS projecttype,
        pt."Description" AS projecttypedescription,
        pm."PartnerID" AS partnerid,
        bp."Description" AS partnerdescription,
        pm."Currency" AS currency,
        c."Description" AS currencydescription,
        pm."Location" AS location,
        pm."Region" AS region,
        pm."Status" AS status,
        pm."CreatedBy" AS createdby,
        pm."CreatedDate" AS createddate,
        pm."UpdatedBy" AS updatedby,
        pm."UpdatedDate" AS updateddate
      FROM "ProjectMaster" pm
      LEFT JOIN "ProjectType" pt
        ON pt."ProjectType" = pm."ProjectType"
      LEFT JOIN "BusinessPartner" bp
        ON bp."PartnerId" = pm."PartnerID"
      LEFT JOIN "Currency" c
        ON c."CurrCode" = pm."Currency"
      ORDER BY pm."ProjectCode", pm."VersionID";
    `);

    return res.status(200).json({
      success: true,
      projects: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve projects.'
    );
  }
});

app.get('/api/projects/:projectcode/:versionid', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const { projectcode, versionid } = req.params;

    const result = await pool.query(
      `
        SELECT
          pm."ProjectID" AS projectid,
          pm."ProjectCode" AS projectcode,
          pm."VersionID" AS versionid,
          pm."ProjectName" AS projectname,
          pm."ProjectDescription" AS projectdescription,
          pm."ProjectType" AS projecttype,
          pm."PartnerID" AS partnerid,
          pm."Currency" AS currency,
          pm."Location" AS location,
          pm."Region" AS region,
          pm."Status" AS status,
          pm."CreatedBy" AS createdby,
          pm."CreatedDate" AS createddate,
          pm."UpdatedBy" AS updatedby,
          pm."UpdatedDate" AS updateddate
        FROM "ProjectMaster" pm
        WHERE
          pm."ProjectCode" = $1
          AND pm."VersionID" = $2;
      `,
      [projectcode, versionid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project was not found.'
      });
    }

    return res.status(200).json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve project.'
    );
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const {
      projectcode,
      versionid,
      projectname,
      projectdescription,
      projecttype,
      partnerid,
      customerid,
      currency,
      location,
      region,
      status,
      createdby,
      updatedby
    } = req.body;

    const finalPartnerId = partnerid || customerid || null;

    if (!projectcode || !versionid || !projectname) {
      return res.status(400).json({
        success: false,
        error:
          'Project Code, Version ID and Project Name are required.'
      });
    }

    const projectid = randomUUID();

    const result = await pool.query(
      `
        INSERT INTO "ProjectMaster" (
          "ProjectID",
          "ProjectCode",
          "VersionID",
          "ProjectName",
          "ProjectDescription",
          "ProjectType",
          "PartnerID",
          "Currency",
          "Location",
          "Region",
          "Status",
          "CreatedBy",
          "CreatedDate",
          "UpdatedBy",
          "UpdatedDate"
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          CURRENT_TIMESTAMP,
          $13,
          CURRENT_TIMESTAMP
        )
        RETURNING *;
      `,
      [
        projectid,
        projectcode.trim(),
        versionid.trim(),
        projectname.trim(),
        projectdescription?.trim() || null,
        projecttype || null,
        finalPartnerId,
        currency || null,
        location?.trim() || null,
        region?.trim() || null,
        status || null,
        createdby?.trim() || null,
        updatedby?.trim() || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Project saved successfully.',
      project: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to create Project.'
    );
  }
});

/* =========================================================
   RESOURCE MASTER
========================================================= */

app.get('/api/resources', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT
        rm."ResourceId" AS resourceid,
        rm."FirstName" AS firstname,
        rm."LastName" AS lastname,
        rm."ResourceType" AS resourcetype,
        rt."Description" AS resourcetypedescription,
        rm."InternalRoleID" AS internalroleid,
        pr."Description" AS roledescription,
        rm."Location" AS location,
        rm."BillRate" AS billrate,
        rm."CurrCode" AS currcode,
        c."Description" AS currencydescription,
        rm."Cost2Co" AS cost2co
      FROM "ResourceMaster" rm
      LEFT JOIN "ResourceType" rt
        ON rt."ResourceType" = rm."ResourceType"
      LEFT JOIN "ProjectRole" pr
        ON pr."ProjectRoleID" = rm."InternalRoleID"
      LEFT JOIN "Currency" c
        ON c."CurrCode" = rm."CurrCode"
      ORDER BY rm."ResourceId";
    `);

    return res.status(200).json({
      success: true,
      resources: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve resources.'
    );
  }
});

app.post('/api/resources', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const {
      resourceid,
      firstname,
      lastname,
      resourcetype,
      internalroleid,
      location,
      billrate,
      currcode,
      cost2co
    } = req.body;

    if (!resourceid || !firstname || !lastname || !resourcetype) {
      return res.status(400).json({
        success: false,
        error:
          'Resource ID, First Name, Last Name and Resource Type are required.'
      });
    }

    const result = await pool.query(
      `
        INSERT INTO "ResourceMaster" (
          "ResourceId",
          "FirstName",
          "LastName",
          "ResourceType",
          "InternalRoleID",
          "Location",
          "BillRate",
          "CurrCode",
          "Cost2Co"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        RETURNING *;
      `,
      [
        resourceid.trim(),
        firstname.trim(),
        lastname.trim(),
        resourcetype,
        internalroleid || null,
        location?.trim() || null,
        billrate === '' || billrate == null
          ? null
          : Number(billrate),
        currcode || null,
        cost2co === '' || cost2co == null
          ? null
          : Number(cost2co)
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Resource saved successfully.',
      resource: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to create Resource.'
    );
  }
});

/* =========================================================
   PROJECT FINANCIAL INFORMATION
========================================================= */

app.get('/api/project-fi', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const result = await pool.query(`
      SELECT
        fi."ProjectCode" AS projectcode,
        fi."VersionID" AS versionid,
        pm."ProjectName" AS projectname,
        fi."BudgetAmount" AS budgetamount,
        fi."ActualCost" AS actualcost,
        fi."BillingAmount" AS billingamount,
        fi."CurrCode" AS currcode,
        c."Description" AS currencydescription,
        fi."CreatedDate" AS createddate,
        fi."UpdatedDate" AS updateddate
      FROM "ProjectFI" fi
      JOIN "ProjectMaster" pm
        ON pm."ProjectCode" = fi."ProjectCode"
        AND pm."VersionID" = fi."VersionID"
      LEFT JOIN "Currency" c
        ON c."CurrCode" = fi."CurrCode"
      ORDER BY fi."ProjectCode", fi."VersionID";
    `);

    return res.status(200).json({
      success: true,
      projectFinancials: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve Project Financial Information.'
    );
  }
});

app.post('/api/project-fi', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const {
      projectcode,
      versionid,
      budgetamount,
      actualcost,
      billingamount,
      currcode
    } = req.body;

    if (!projectcode || !versionid) {
      return res.status(400).json({
        success: false,
        error: 'Project Code and Version ID are required.'
      });
    }

    const result = await pool.query(
      `
        INSERT INTO "ProjectFI" (
          "ProjectCode",
          "VersionID",
          "BudgetAmount",
          "ActualCost",
          "BillingAmount",
          "CurrCode",
          "CreatedDate",
          "UpdatedDate"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT ("ProjectCode", "VersionID")
        DO UPDATE SET
          "BudgetAmount" = EXCLUDED."BudgetAmount",
          "ActualCost" = EXCLUDED."ActualCost",
          "BillingAmount" = EXCLUDED."BillingAmount",
          "CurrCode" = EXCLUDED."CurrCode",
          "UpdatedDate" = CURRENT_TIMESTAMP
        RETURNING *;
      `,
      [
        projectcode,
        versionid,
        budgetamount === '' || budgetamount == null
          ? null
          : Number(budgetamount),
        actualcost === '' || actualcost == null
          ? null
          : Number(actualcost),
        billingamount === '' || billingamount == null
          ? null
          : Number(billingamount),
        currcode || null
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Project Financial Information saved successfully.',
      projectFinancial: result.rows[0]
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to save Project Financial Information.'
    );
  }
});

/* =========================================================
   PROJECT PLAN HEADER DATA
========================================================= */

app.get('/api/project-plan-headers', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const {
      projectcode,
      versionid,
      phaseid
    } = req.query;

    const values = [];
    const conditions = [];

    if (projectcode) {
      values.push(projectcode);
      conditions.push(
        `"ProjectCode" = $${values.length}`
      );
    }

    if (versionid) {
      values.push(versionid);
      conditions.push(
        `"VersionID" = $${values.length}`
      );
    }

    if (phaseid) {
      values.push(phaseid);
      conditions.push(
        `"PhaseId" = $${values.length}`
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const result = await pool.query(
      `
        SELECT
          h."ProjectCode" AS projectcode,
          h."VersionID" AS versionid,
          h."PhaseId" AS phaseid,
          pp."Description" AS phasedescription,
          h."StartDate" AS startdate,
          h."EndDate" AS enddate,
          h."LineId" AS lineid,
          h."PrjUUID" AS prjuuid,
          h."ProjectRoleID" AS projectroleid,
          pr."Description" AS projectroledescription,
          h."ResourceId" AS resourceid,
          rm."FirstName" AS firstname,
          rm."LastName" AS lastname,
          h."Allocation" AS allocation
        FROM "PrjHeaderData" h
        LEFT JOIN "ProjectPhase" pp
          ON pp."PhaseId" = h."PhaseId"
        LEFT JOIN "ProjectRole" pr
          ON pr."ProjectRoleID" = h."ProjectRoleID"
        LEFT JOIN "ResourceMaster" rm
          ON rm."ResourceId" = h."ResourceId"
        ${whereClause}
        ORDER BY
          h."ProjectCode",
          h."VersionID",
          h."PhaseId",
          h."LineId";
      `,
      values
    );

    return res.status(200).json({
      success: true,
      projectPlanHeaders: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve project plan headers.'
    );
  }
});

/* =========================================================
   PROJECT PLAN ITEM DATA
========================================================= */

app.get('/api/project-plan-items/:prjuuid/:lineid', async (req, res) => {
  try {
    if (!requireDatabase(res)) {
      return;
    }

    const { prjuuid, lineid } = req.params;

    const result = await pool.query(
      `
        SELECT
          "PrjUUID" AS prjuuid,
          "LineId" AS lineid,
          "Year" AS year,
          "WeekNo" AS weekno,
          "Allocation" AS allocation
        FROM "PrjItemData"
        WHERE
          "PrjUUID" = $1
          AND "LineId" = $2
        ORDER BY "Year", "WeekNo";
      `,
      [prjuuid, lineid]
    );

    return res.status(200).json({
      success: true,
      projectPlanItems: result.rows
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      'Failed to retrieve weekly project plan items.'
    );
  }
});

/* =========================================================
   SAVE COMPLETE PROJECT PLAN
   PrjHeaderData + PrjItemData
========================================================= */

app.post('/api/project-plans', async (req, res) => {
  const client = await pool?.connect();

  try {
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'DATABASE_URL is not configured.'
      });
    }

    const {
      projectcode,
      versionid,
      phaseid,
      startdate,
      enddate,
      rows
    } = req.body;

    if (
      !projectcode ||
      !versionid ||
      !phaseid ||
      !startdate ||
      !enddate
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Project Code, Version ID, Phase, Start Date and End Date are required.'
      });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one project planning row is required.'
      });
    }

    await client.query('BEGIN');

    const oldHeaders = await client.query(
      `
        SELECT
          "PrjUUID",
          "LineId"
        FROM "PrjHeaderData"
        WHERE
          "ProjectCode" = $1
          AND "VersionID" = $2
          AND "PhaseId" = $3;
      `,
      [projectcode, versionid, phaseid]
    );

    for (const oldHeader of oldHeaders.rows) {
      await client.query(
        `
          DELETE FROM "PrjItemData"
          WHERE
            "PrjUUID" = $1
            AND "LineId" = $2;
        `,
        [
          oldHeader.PrjUUID,
          oldHeader.LineId
        ]
      );
    }

    await client.query(
      `
        DELETE FROM "PrjHeaderData"
        WHERE
          "ProjectCode" = $1
          AND "VersionID" = $2
          AND "PhaseId" = $3;
      `,
      [projectcode, versionid, phaseid]
    );

    const savedRows = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];

      const lineid = String(index + 1).padStart(3, '0');

      const prjuuid = randomUUID()
        .replaceAll('-', '')
        .slice(0, 16);

      const headerResult = await client.query(
        `
          INSERT INTO "PrjHeaderData" (
            "ProjectCode",
            "VersionID",
            "PhaseId",
            "StartDate",
            "EndDate",
            "LineId",
            "PrjUUID",
            "ProjectRoleID",
            "ResourceId",
            "Allocation"
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10
          )
          RETURNING *;
        `,
        [
          projectcode,
          versionid,
          phaseid,
          startdate,
          enddate,
          lineid,
          prjuuid,
          row.projectroleid || null,
          row.resourceid || null,
          row.allocation == null ||
          row.allocation === ''
            ? null
            : Number(row.allocation)
        ]
      );

      if (Array.isArray(row.weeks)) {
        for (const week of row.weeks) {
          if (
            week.allocation === '' ||
            week.allocation == null
          ) {
            continue;
          }

          await client.query(
            `
              INSERT INTO "PrjItemData" (
                "PrjUUID",
                "LineId",
                "Year",
                "WeekNo",
                "Allocation"
              )
              VALUES ($1, $2, $3, $4, $5);
            `,
            [
              prjuuid,
              lineid,
              String(week.year),
              String(week.weekno).padStart(2, '0'),
              Number(week.allocation)
            ]
          );
        }
      }

      savedRows.push(headerResult.rows[0]);
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Project Plan saved successfully.',
      rows: savedRows
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }

    return sendDatabaseError(
      res,
      error,
      'Failed to save Project Plan.'
    );
  } finally {
    if (client) {
      client.release();
    }
  }
});

/* =========================================================
   COMPLETE PROJECT PLAN READ
========================================================= */

app.get(
  '/api/project-plans/:projectcode/:versionid/:phaseid',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const {
        projectcode,
        versionid,
        phaseid
      } = req.params;

      const headerResult = await pool.query(
        `
          SELECT
            h."ProjectCode" AS projectcode,
            h."VersionID" AS versionid,
            h."PhaseId" AS phaseid,
            h."StartDate" AS startdate,
            h."EndDate" AS enddate,
            h."LineId" AS lineid,
            h."PrjUUID" AS prjuuid,
            h."ProjectRoleID" AS projectroleid,
            pr."Description" AS projectroledescription,
            h."ResourceId" AS resourceid,
            rm."FirstName" AS firstname,
            rm."LastName" AS lastname,
            rm."ResourceType" AS resourcetype,
            rm."Location" AS resourcelocation,
            h."Allocation" AS allocation
          FROM "PrjHeaderData" h
          LEFT JOIN "ProjectRole" pr
            ON pr."ProjectRoleID" = h."ProjectRoleID"
          LEFT JOIN "ResourceMaster" rm
            ON rm."ResourceId" = h."ResourceId"
          WHERE
            h."ProjectCode" = $1
            AND h."VersionID" = $2
            AND h."PhaseId" = $3
          ORDER BY h."LineId";
        `,
        [projectcode, versionid, phaseid]
      );

      const rows = [];

      for (const header of headerResult.rows) {
        const itemResult = await pool.query(
          `
            SELECT
              "Year" AS year,
              "WeekNo" AS weekno,
              "Allocation" AS allocation
            FROM "PrjItemData"
            WHERE
              "PrjUUID" = $1
              AND "LineId" = $2
            ORDER BY "Year", "WeekNo";
          `,
          [
            header.prjuuid,
            header.lineid
          ]
        );

        rows.push({
          ...header,
          weeks: itemResult.rows
        });
      }

      return res.status(200).json({
        success: true,
        rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve Project Plan.'
      );
    }
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});