import express from 'express';
import cors from 'cors';

import apiRouter from './routes/index.js';

const app =
  express();

const port =
  process.env.PORT ||
  5000;

/* =========================================================
   GLOBAL MIDDLEWARE
========================================================= */

app.use(
  cors()
);

app.use(
  express.json()
);

/* =========================================================
   API ROUTES
========================================================= */

app.use(
  '/api',
  apiRouter
);

/* =========================================================
   API 404
========================================================= */

app.use(
  '/api',
  (req, res) => {
    return res
      .status(404)
      .json({
        success: false,
        error:
          `API route not found: ${req.method} ${req.originalUrl}`
      });
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  port,
  () => {
    console.log(
      `Server running on http://localhost:${port}`
    );
  }
);