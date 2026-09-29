/* =========================================================
   RESPONSE HELPER
========================================================= */

const readJsonResponse = async (
  response,
  fallbackMessage
) => {
  let result = {};

  try {
    result =
      await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result.error ||
        fallbackMessage
    );
  }

  return result;
};

/* =========================================================
   MASTER DATA
========================================================= */

export const fetchProjects =
  async () => {
    const response =
      await fetch(
        '/api/projects'
      );

    const result =
      await readJsonResponse(
        response,
        'Failed to load projects.'
      );

    return (
      result.projects ||
      []
    );
  };

export const fetchProjectRoles =
  async () => {
    const response =
      await fetch(
        '/api/project-roles'
      );

    const result =
      await readJsonResponse(
        response,
        'Failed to load project roles.'
      );

    return (
      result.projectRoles ||
      []
    );
  };

export const fetchResources =
  async () => {
    const response =
      await fetch(
        '/api/resources'
      );

    const result =
      await readJsonResponse(
        response,
        'Failed to load resources.'
      );

    return (
      result.resources ||
      []
    );
  };

/* =========================================================
   PROJECT PHASE ASSIGNMENTS
========================================================= */

export const fetchProjectPhaseAssignments =
  async (
    projectCode
  ) => {
    if (!projectCode) {
      return [];
    }

    const response =
      await fetch(
        `/api/project-phase-assignments/${encodeURIComponent(
          projectCode
        )}`
      );

    const result =
      await readJsonResponse(
        response,
        'Failed to load project phase assignments.'
      );

    return (
      result.phases ||
      []
    );
  };

/* =========================================================
   PROJECT VERSIONS
========================================================= */

export const fetchProjectVersions =
  async (
    projectCode
  ) => {
    if (!projectCode) {
      return [];
    }

    const response =
      await fetch(
        `/api/project-versions/${encodeURIComponent(
          projectCode
        )}`
      );

    const result =
      await readJsonResponse(
        response,
        'Failed to load project versions.'
      );

    return (
      result.versions ||
      []
    );
  };

/* =========================================================
   ACTIVE PROJECT PLAN
========================================================= */

export const fetchActiveProjectPlan =
  async (
    projectCode,
    phaseId
  ) => {
    if (
      !projectCode ||
      !phaseId
    ) {
      return {
        found: false,
        result: null
      };
    }

    const response =
      await fetch(
        `/api/active-project-plan/${encodeURIComponent(
          projectCode
        )}/${encodeURIComponent(
          phaseId
        )}`
      );

    if (
      response.status === 404
    ) {
      return {
        found: false,
        result: null
      };
    }

    const result =
      await readJsonResponse(
        response,
        'Failed to load active Project Plan.'
      );

    return {
      found: true,
      result
    };
  };

/* =========================================================
   SPECIFIC PROJECT VERSION PLAN
========================================================= */

export const fetchProjectVersionPlan =
  async (
    projectCode,
    versionId,
    phaseId
  ) => {
    const response =
      await fetch(
        `/api/project-plans/${encodeURIComponent(
          projectCode
        )}/${encodeURIComponent(
          versionId
        )}/${encodeURIComponent(
          phaseId
        )}`
      );

    return await readJsonResponse(
      response,
      'Failed to load Project Plan version.'
    );
  };

/* =========================================================
   SAVE PROJECT PLAN
========================================================= */

export const saveProjectPlan =
  async (
    payload
  ) => {
    const response =
      await fetch(
        '/api/project-plans',
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    return await readJsonResponse(
      response,
      'Failed to save Project Plan.'
    );
  };

/* =========================================================
   CREATE PROJECT VERSION
========================================================= */

export const createProjectVersion =
  async (
    projectCode,
    versionNote
  ) => {
    const response =
      await fetch(
        `/api/project-versions/${encodeURIComponent(
          projectCode
        )}`,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              versionnote:
                versionNote
            })
        }
      );

    return await readJsonResponse(
      response,
      'Failed to create Project Version.'
    );
  };

/* =========================================================
   ACTIVATE PROJECT VERSION
========================================================= */

export const activateProjectVersion =
  async (
    projectCode,
    versionId
  ) => {
    const response =
      await fetch(
        `/api/project-versions/${encodeURIComponent(
          projectCode
        )}/${encodeURIComponent(
          versionId
        )}/activate`,
        {
          method:
            'POST'
        }
      );

    return await readJsonResponse(
      response,
      'Failed to activate Project Version.'
    );
  };