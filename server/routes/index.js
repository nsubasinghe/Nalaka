import express from 'express';

import healthRouter
  from './health.routes.js';

import databaseRouter
  from './database.routes.js';

import projectTypesRouter
  from './projectTypes.routes.js';

import businessPartnersRouter
  from './businessPartners.routes.js';

import currenciesRouter
  from './currencies.routes.js';

import projectPhasesRouter
  from './projectPhases.routes.js';

import projectPhaseAssignmentsRouter
  from './projectPhaseAssignments.routes.js';

import projectVersionPhasesRouter
  from './projectVersionPhases.routes.js';

import projectVersionsRouter
  from './projectVersions.routes.js';

import phaseDatesRouter
  from './phaseDates.routes.js';

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

import projectPlansRouter
  from './projectPlans.routes.js';

const router =
  express.Router();

/* =========================================================
   SYSTEM ROUTES
========================================================= */

router.use(
  '/health',
  healthRouter
);

router.use(
  '/database',
  databaseRouter
);

/* =========================================================
   MASTER DATA ROUTES
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

/* =========================================================
   PROJECT PHASE / VERSION ROUTES
========================================================= */

router.use(
  '/project-phase-assignments',
  projectPhaseAssignmentsRouter
);

router.use(
  '/project-version-phases',
  projectVersionPhasesRouter
);

router.use(
  '/project-versions',
  projectVersionsRouter
);

router.use(
  '/phase-dates',
  phaseDatesRouter
);

/* =========================================================
   PROJECT PLAN ROUTES
========================================================= */

router.use(
  '/',
  projectPlansRouter
);

export default router;