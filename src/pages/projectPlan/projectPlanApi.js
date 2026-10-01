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
   CSRF TOKEN HELPER
========================================================= */

const fetchCsrfToken = async () => {
  const response =
    await fetch(
      '/api/auth/csrf-token',
      {
        method: 'GET',

        credentials: 'same-origin',

        cache: 'no-store'
      }
    );

  const result =
    await readJsonResponse(
      response,
      'Failed to retrieve CSRF token.'
    );

  if (
    result.success !== true ||
    typeof result.csrfToken !== 'string' ||
    !result.csrfToken
  ) {
    throw new Error(
      'The server did not return a valid CSRF token.'
    );
  }

  return result.csrfToken;
};

/* =========================================================
   AUTHENTICATED POST HELPER

   - Retrieves a session-bound CSRF token.
   - Sends the authentication cookie.
   - Adds the required X-CSRF-Token header.
   - Preserves existing API error handling.
========================================================= */

const authenticatedPost = async (
  url,
  payload,
  fallbackMessage
) => {
  const csrfToken =
    await fetchCsrfToken();

  const headers = {
    'X-CSRF-Token': csrfToken
  };

  const options = {
    method: 'POST',

    credentials: 'same-origin',

    headers
  };

  if (payload !== undefined) {
    headers['Content-Type'] =
      'application/json';

    options.body =
      JSON.stringify(
        payload
      );
  }

  const response =
    await fetch(
      url,
      options
    );

  return await readJsonResponse(
    response,
    fallbackMessage
  );
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
    return await authenticatedPost(
      '/api/project-plans',

      payload,

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
    return await authenticatedPost(
      `/api/project-versions/${encodeURIComponent(
        projectCode
      )}`,

      {
        versionnote:
          versionNote
      },

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
    return await authenticatedPost(
      `/api/project-versions/${encodeURIComponent(
        projectCode
      )}/${encodeURIComponent(
        versionId
      )}/activate`,

      undefined,

      'Failed to activate Project Version.'
    );
  };