import express from 'express';

/* =========================================================
   SYSTEM ROUTES
========================================================= */

import healthRouter
  from './health.routes.js';

import databaseRouter
  from './database.routes.js';

/* =========================================================
   AUTHENTICATION ROUTES
========================================================= */

import authRouter
  from './auth.routes.js';

import csrfRouter
  from './csrf.routes.js';

import {
  loginRateLimit
} from '../middleware/loginRateLimit.middleware.js';

import {
  requireAuth,
  requireAdmin
} from '../middleware/auth.middleware.js';

import {
  requireCsrf
} from '../middleware/csrf.middleware.js';

import {
  requireProjectRead,
  requireProjectWrite
} from '../middleware/projectAuthorization.middleware.js';

/* =========================================================
   MASTER DATA ROUTES
========================================================= */

import projectTypesRouter
  from './projectTypes.routes.js';

import businessPartnersRouter
  from './businessPartners.routes.js';

import currenciesRouter
  from './currencies.routes.js';

import projectPhasesRouter
  from './projectPhases.routes.js';

import resourceTypesRouter
  from './resourceTypes.routes.js';

import roleCategoriesRouter
  from './roleCategories.routes.js';

import projectRolesRouter
  from './projectRoles.routes.js';

import projectsRouter
  from './projects.routes.js';

import resourcesRouter
  from './resources.routes.js';

import projectFIRouter
  from './projectFI.routes.js';

/* =========================================================
   PROJECT MANAGEMENT ROUTES
========================================================= */

import projectPhaseAssignmentsRouter
  from './projectPhaseAssignments.routes.js';

import projectVersionPhasesRouter
  from './projectVersionPhases.routes.js';

import projectVersionsRouter
  from './projectVersions.routes.js';

import phaseDatesRouter
  from './phaseDates.routes.js';

import projectPlansRouter
  from './projectPlans.routes.js';

/* =========================================================
   EXPRESS ROUTER
========================================================= */

const router = express.Router();

/* =========================================================
   AUTHENTICATION
========================================================= */

router.use(
  '/auth/login',
  loginRateLimit
);

router.use(
  '/auth',
  authRouter
);

router.use(
  '/auth',
  csrfRouter
);

/* =========================================================
   PUBLIC HEALTH CHECK
========================================================= */

router.use(
  '/health',
  healthRouter
);

/* =========================================================
   GLOBAL SECURITY BOUNDARY
========================================================= */

router.use(
  requireAuth
);

/*
  TEMPORARY ADMINISTRATOR-ONLY RESTRICTION

  Keep this enabled until all routes,
  pages and role permissions are fully
  reviewed and tested.
*/

router.use(
  requireAdmin
);

/*
  Protect all state-changing requests
  below this point with CSRF validation.
*/

router.use(
  requireCsrf
);

/* =========================================================
   PROTECTED SYSTEM ROUTES
========================================================= */

router.use(
  '/database',
  databaseRouter
);

/* =========================================================
   PROTECTED MASTER DATA ROUTES
========================================================= */

router.use(
  '/project-types',
  projectTypesRouter
);

router.use(
  '/',
  businessPartnersRouter
);

router.use(
  '/currencies',
  currenciesRouter
);

router.use(
  '/project-phases',
  projectPhasesRouter
);

router.use(
  '/resource-types',
  resourceTypesRouter
);

router.use(
  '/role-categories',
  roleCategoriesRouter
);

router.use(
  '/project-roles',
  projectRolesRouter
);

router.use(
  '/projects',
  projectsRouter
);

router.use(
  '/resources',
  resourcesRouter
);

router.use(
  '/project-fi',
  projectFIRouter
);

/* =========================================================
   PROJECT PHASE ASSIGNMENT AUTHORIZATION
========================================================= */

router.get(
  '/project-phase-assignments/:projectcode',
  requireProjectRead
);

router.post(
  '/project-phase-assignments/:projectcode',
  requireProjectWrite
);

router.put(
  '/project-phase-assignments/:projectcode/:phaseid',
  requireProjectWrite
);

router.delete(
  '/project-phase-assignments/:projectcode/:phaseid',
  requireProjectWrite
);

/* =========================================================
   PROJECT PHASE ASSIGNMENT IMPLEMENTATION
========================================================= */

router.use(
  '/project-phase-assignments',
  projectPhaseAssignmentsRouter
);

/* =========================================================
   PROJECT VERSION PHASE AUTHORIZATION
========================================================= */

router.get(
  '/project-version-phases/:projectcode',
  requireProjectRead
);

router.post(
  '/project-version-phases/:projectcode',
  requireProjectWrite
);

router.put(
  '/project-version-phases/:projectcode/:phaseid',
  requireProjectWrite
);

router.delete(
  '/project-version-phases/:projectcode/:phaseid',
  requireProjectWrite
);

/* =========================================================
   PROJECT VERSION PHASE IMPLEMENTATION
========================================================= */

router.use(
  '/project-version-phases',
  projectVersionPhasesRouter
);

/* =========================================================
   PROJECT VERSION AUTHORIZATION
========================================================= */

router.get(
  '/project-versions/:projectcode/active',
  requireProjectRead
);

router.get(
  '/project-versions/:projectcode/inactive',
  requireProjectRead
);

router.get(
  '/project-versions/:projectcode',
  requireProjectRead
);

router.post(
  '/project-versions/:projectcode/:versionid/activate',
  requireProjectWrite
);

router.post(
  '/project-versions/:projectcode',
  requireProjectWrite
);

/* =========================================================
   PROJECT VERSION IMPLEMENTATION
========================================================= */

router.use(
  '/project-versions',
  projectVersionsRouter
);

/* =========================================================
   PROJECT PHASE DATES
========================================================= */

router.use(
  '/phase-dates',
  phaseDatesRouter
);

/* =========================================================
   PROJECT PLANNING AUTHORIZATION
========================================================= */

router.post(
  '/project-plans',
  requireProjectWrite
);

router.get(
  '/active-project-plan/:projectcode/:phaseid',
  requireProjectRead
);

router.get(
  '/project-plans/:projectcode/:versionid/:phaseid',
  requireProjectRead
);

/* =========================================================
   PROJECT PLANNING IMPLEMENTATION
========================================================= */

router.use(
  '/',
  projectPlansRouter
);

export default router;