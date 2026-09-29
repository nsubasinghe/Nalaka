import express from 'express';
import cors from 'cors';

import {
  dirname,
  resolve
} from 'path';

import {
  fileURLToPath
} from 'url';

import apiRouter from './routes/index.js';

/* =========================================================
   APPLICATION CONFIGURATION
========================================================= */

const app = express();

const port =
  process.env.PORT || 5000;

const currentDirectory =
  dirname(
    fileURLToPath(import.meta.url)
  );

/* =========================================================
   GLOBAL MIDDLEWARE
========================================================= */

app.use(cors());

app.use(express.json());

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
   PRODUCTION FRONTEND
========================================================= */

if (
  process.env.NODE_ENV ===
  'production'
) {
  const distDirectory =
    resolve(
      currentDirectory,
      '../dist'
    );

  // Serve the React production build.
  app.use(
    express.static(
      distDirectory
    )
  );

  // Support React client-side routing.
  app.use(
    (req, res, next) => {
      if (
        req.path === '/api' ||
        req.path.startsWith('/api/')
      ) {
        return next();
      }

      return res.sendFile(
        resolve(
          distDirectory,
          'index.html'
        )
      );
    }
  );
}

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