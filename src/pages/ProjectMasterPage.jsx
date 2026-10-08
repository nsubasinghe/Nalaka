import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  authenticatedFetch
} from '../api/authenticatedFetch.js';

/* =========================================================
   INITIAL PROJECT FORM
========================================================= */

const createInitialForm = (
  username = ''
) => ({
  projectcode: '',
  versionid: '',
  projectname: '',
  projectdescription: '',
  projecttype: '',
  partnerid: '',
  currency: '',
  location: '',
  region: '',
  status: '',
  createdby: username,
  updatedby: username
});

const projectStatuses = [
  {
    code: 'P',
    name: 'Planned'
  },
  {
    code: 'A',
    name: 'Active'
  },
  {
    code: 'C',
    name: 'Completed'
  },
  {
    code: 'X',
    name: 'Cancelled'
  }
];

/* =========================================================
   NORMALIZE PROJECT DATA
========================================================= */

const projectToForm = (
  project
) => ({
  projectcode:
    project?.projectcode || '',

  versionid:
    project?.versionid || '',

  projectname:
    project?.projectname || '',

  projectdescription:
    project?.projectdescription || '',

  projecttype:
    project?.projecttype || '',

  partnerid:
    project?.partnerid || '',

  currency:
    project?.currency || '',

  location:
    project?.location || '',

  region:
    project?.region || '',

  status:
    project?.status || '',

  createdby:
    project?.createdby || '',

  updatedby:
    project?.updatedby || ''
});

/* =========================================================
   VERSION SORTING
========================================================= */

const versionNumber = (
  value
) => {
  const parsed =
    Number.parseInt(
      String(
        value || ''
      ),
      10
    );

  return Number.isNaN(
    parsed
  )
    ? -1
    : parsed;
};

/* =========================================================
   COMPONENT
========================================================= */

function ProjectMasterPage() {
  /* =========================================================
     MASTER DATA
  ========================================================= */

  const [
    projects,
    setProjects
  ] = useState([]);

  const [
    projectTypes,
    setProjectTypes
  ] = useState([]);

  const [
    businessPartners,
    setBusinessPartners
  ] = useState([]);

  const [
    currencies,
    setCurrencies
  ] = useState([]);

  const [
    currentUsername,
    setCurrentUsername
  ] = useState('');

  /* =========================================================
     FORM STATE
  ========================================================= */

  const [
    form,
    setForm
  ] = useState(
    createInitialForm()
  );

  const [
    originalForm,
    setOriginalForm
  ] = useState(
    createInitialForm()
  );

  const [
    selectedProjectId,
    setSelectedProjectId
  ] = useState('');

  const [
    mode,
    setMode
  ] = useState('view');

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    dropdownLoading,
    setDropdownLoading
  ] = useState(true);

  /* =========================================================
     CUSTOM ALERT
  ========================================================= */

  const [
    alert,
    setAlert
  ] = useState({
    open: false,
    type: 'success',
    title: '',
    message: ''
  });

  /* =========================================================
     CUSTOM CONFIRMATION
  ========================================================= */

  const [
    confirmation,
    setConfirmation
  ] = useState({
    open: false,
    type: '',
    projectCode: ''
  });

  /* =========================================================
     DERIVED STATE
  ========================================================= */

  const isCreateMode =
    mode === 'create';

  const isExistingProject =
    mode === 'edit';

  const editableFormData =
    useMemo(
      () => ({
        projectcode:
          form.projectcode,

        versionid:
          form.versionid,

        projectname:
          form.projectname,

        projectdescription:
          form.projectdescription,

        projecttype:
          form.projecttype,

        partnerid:
          form.partnerid,

        currency:
          form.currency,

        location:
          form.location,

        region:
          form.region,

        status:
          form.status
      }),
      [
        form
      ]
    );

  const originalEditableFormData =
    useMemo(
      () => ({
        projectcode:
          originalForm.projectcode,

        versionid:
          originalForm.versionid,

        projectname:
          originalForm.projectname,

        projectdescription:
          originalForm.projectdescription,

        projecttype:
          originalForm.projecttype,

        partnerid:
          originalForm.partnerid,

        currency:
          originalForm.currency,

        location:
          originalForm.location,

        region:
          originalForm.region,

        status:
          originalForm.status
      }),
      [
        originalForm
      ]
    );

  /*
   * Audit fields are intentionally excluded from
   * unsaved-change detection because they are
   * controlled automatically by the server.
   */

  const hasUnsavedChanges =
    useMemo(
      () =>
        JSON.stringify(
          editableFormData
        ) !==
        JSON.stringify(
          originalEditableFormData
        ),
      [
        editableFormData,
        originalEditableFormData
      ]
    );

  /* =========================================================
     UNIQUE PROJECT CODES
  ========================================================= */

  const projectCodes =
    useMemo(() => {
      return [
        ...new Set(
          projects
            .map(
              (project) =>
                project.projectcode
            )
            .filter(
              Boolean
            )
        )
      ].sort(
        (a, b) =>
          String(
            a
          ).localeCompare(
            String(
              b
            )
          )
      );
    }, [
      projects
    ]);

  /* =========================================================
     ALERT HELPERS
  ========================================================= */

  const showAlert = (
    type,
    title,
    message
  ) => {
    setAlert({
      open: true,
      type,
      title,
      message
    });
  };

  const closeAlert = () => {
    setAlert({
      open: false,
      type: 'success',
      title: '',
      message: ''
    });
  };

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadAllData =
    async () => {
      setDropdownLoading(
        true
      );

      try {
        const [
          projectsResponse,
          projectTypesResponse,
          businessPartnersResponse,
          currenciesResponse,
          authResponse
        ] = await Promise.all([
          fetch(
            '/api/projects'
          ),

          fetch(
            '/api/project-types'
          ),

          fetch(
            '/api/business-partners'
          ),

          fetch(
            '/api/currencies'
          ),

          fetch(
            '/api/auth/me',
            {
              credentials:
                'same-origin',
              cache:
                'no-store'
            }
          )
        ]);

        if (
          !projectsResponse.ok ||
          !projectTypesResponse.ok ||
          !businessPartnersResponse.ok ||
          !currenciesResponse.ok ||
          !authResponse.ok
        ) {
          throw new Error(
            'Failed to load Project Master data.'
          );
        }

        const [
          projectsResult,
          projectTypesResult,
          businessPartnersResult,
          currenciesResult,
          authResult
        ] = await Promise.all([
          projectsResponse.json(),
          projectTypesResponse.json(),
          businessPartnersResponse.json(),
          currenciesResponse.json(),
          authResponse.json()
        ]);

        const loadedProjects =
          projectsResult.projects ||
          [];

        const username =
          authResult.user
            ?.username ||
          '';

        setProjects(
          loadedProjects
        );

        setProjectTypes(
          projectTypesResult
            .projectTypes ||
          []
        );

        setBusinessPartners(
          businessPartnersResult
            .businessPartners ||
          []
        );

        setCurrencies(
          currenciesResult
            .currencies ||
          []
        );

        setCurrentUsername(
          username
        );

        return {
          projects:
            loadedProjects,

          username
        };

      } catch (
        error
      ) {
        showAlert(
          'error',
          'Unable to Load Projects',
          error.message ||
            'Failed to load Project Master data.'
        );

        return {
          projects: [],
          username: ''
        };

      } finally {
        setDropdownLoading(
          false
        );
      }
    };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadAllData();
  }, []);

  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  useEffect(() => {
    if (
      !confirmation.open &&
      !alert.open
    ) {
      return;
    }

    const handleKeyDown =
      (
        event
      ) => {
        if (
          event.key !==
          'Escape'
        ) {
          return;
        }

        if (
          alert.open
        ) {
          closeAlert();
          return;
        }

        setConfirmation({
          open: false,
          type: '',
          projectCode: ''
        });
      };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    confirmation.open,
    alert.open
  ]);

  /* =========================================================
     GET PREFERRED PROJECT VERSION
  ========================================================= */

  const getProjectForCode =
    (
      projectCode,
      sourceProjects = projects
    ) => {
      const matchingProjects =
        sourceProjects.filter(
          (project) =>
            String(
              project.projectcode
            ) ===
            String(
              projectCode
            )
        );

      if (
        matchingProjects.length ===
        0
      ) {
        return null;
      }

      const activeProject =
        matchingProjects.find(
          (project) =>
            project.versionstatus ===
            'A'
        );

      if (
        activeProject
      ) {
        return activeProject;
      }

      return [
        ...matchingProjects
      ].sort(
        (
          a,
          b
        ) =>
          versionNumber(
            b.versionid
          ) -
          versionNumber(
            a.versionid
          )
      )[0];
    };

  /* =========================================================
     LOAD EXISTING PROJECT
  ========================================================= */

  const loadExistingProject =
    (
      projectCode,
      sourceProjects = projects
    ) => {
      const project =
        getProjectForCode(
          projectCode,
          sourceProjects
        );

      if (
        !project
      ) {
        showAlert(
          'error',
          'Project Not Found',
          'The selected project could not be loaded.'
        );

        return;
      }

      const nextForm =
        projectToForm(
          project
        );

      setSelectedProjectId(
        project.projectid
      );

      setMode(
        'edit'
      );

      setForm(
        nextForm
      );

      setOriginalForm(
        nextForm
      );
    };

  /* =========================================================
     PROJECT CODE SELECTION
  ========================================================= */

  const handleProjectCodeSelection =
    (
      event
    ) => {
      const projectCode =
        event.target.value;

      if (
        projectCode ===
        form.projectcode
      ) {
        return;
      }

      if (
        !projectCode
      ) {
        if (
          hasUnsavedChanges
        ) {
          setConfirmation({
            open: true,
            type: 'clear',
            projectCode: ''
          });

          return;
        }

        clearProjectForm();

        return;
      }

      if (
        hasUnsavedChanges
      ) {
        setConfirmation({
          open: true,
          type: 'switch',
          projectCode
        });

        return;
      }

      loadExistingProject(
        projectCode
      );
    };

  /* =========================================================
     STANDARD FIELD CHANGE
  ========================================================= */

  const handleChange =
    (
      event
    ) => {
      const {
        name,
        value
      } =
        event.target;

      setForm(
        (
          previousForm
        ) => ({
          ...previousForm,
          [name]:
            value
        })
      );
    };

  /* =========================================================
     NEW PROJECT CODE
  ========================================================= */

  const handleNewProjectCodeChange =
    (
      event
    ) => {
      if (
        !isCreateMode
      ) {
        return;
      }

      const value =
        event.target
          .value
          .toUpperCase()
          .replace(
            /[^A-Z0-9]/g,
            ''
          )
          .slice(
            0,
            10
          );

      setForm(
        (
          previousForm
        ) => ({
          ...previousForm,

          projectcode:
            value
        })
      );
    };

  /* =========================================================
     VERSION ID
  ========================================================= */

  const handleVersionChange =
    (
      event
    ) => {
      if (
        !isCreateMode
      ) {
        return;
      }

      const value =
        event.target
          .value
          .replace(
            /[^0-9]/g,
            ''
          )
          .slice(
            0,
            2
          );

      setForm(
        (
          previousForm
        ) => ({
          ...previousForm,

          versionid:
            value
        })
      );
    };

  /* =========================================================
     API PAYLOAD

     CreatedBy and UpdatedBy are intentionally excluded.
     The backend gets them from req.auth.username.
  ========================================================= */

  const createProjectPayload =
    () => ({
      projectcode:
        form.projectcode.trim(),

      versionid:
        form.versionid.trim(),

      projectname:
        form.projectname.trim(),

      projectdescription:
        form.projectdescription,

      projecttype:
        form.projecttype,

      partnerid:
        form.partnerid,

      currency:
        form.currency,

      location:
        form.location,

      region:
        form.region,

      status:
        form.status
    });

  /* =========================================================
     CREATE PROJECT
  ========================================================= */

  const createProject =
    async () => {
      const response =
        await authenticatedFetch(
          '/api/projects',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify(
                createProjectPayload()
              )
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            'Failed to save project.'
        );
      }

      const refreshedData =
        await loadAllData();

      const savedProject =
        getProjectForCode(
          form.projectcode,
          refreshedData.projects
        );

      if (
        savedProject
      ) {
        const savedForm =
          projectToForm(
            savedProject
          );

        setSelectedProjectId(
          savedProject.projectid
        );

        setMode(
          'edit'
        );

        setForm(
          savedForm
        );

        setOriginalForm(
          savedForm
        );
      }

      showAlert(
        'success',
        'Project Saved',
        `Project ${form.projectcode} (Version ${form.versionid}) was saved successfully.`
      );
    };

  /* =========================================================
     UPDATE PROJECT
  ========================================================= */

  const updateProject =
    async () => {
      if (
        !selectedProjectId
      ) {
        throw new Error(
          'Please select a Project Code.'
        );
      }

      const response =
        await authenticatedFetch(
          `/api/projects/${encodeURIComponent(
            selectedProjectId
          )}`,
          {
            method:
              'PUT',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify(
                createProjectPayload()
              )
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            'Failed to update project.'
        );
      }

      const updatedProject =
        result.project;

      const updatedForm =
        projectToForm(
          updatedProject
        );

      setForm(
        updatedForm
      );

      setOriginalForm(
        updatedForm
      );

      setProjects(
        (
          currentProjects
        ) =>
          currentProjects.map(
            (
              project
            ) =>
              String(
                project.projectid
              ) ===
              String(
                selectedProjectId
              )
                ? {
                    ...project,
                    ...updatedProject
                  }
                : project
          )
      );

      showAlert(
        'success',
        'Project Updated',
        `Project ${updatedProject.projectcode} (Version ${updatedProject.versionid}) was updated successfully.`
      );
    };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        loading ||
        dropdownLoading
      ) {
        return;
      }

      if (
        isExistingProject &&
        !hasUnsavedChanges
      ) {
        showAlert(
          'info',
          'No Changes',
          'No project changes have been made.'
        );

        return;
      }

      setLoading(
        true
      );

      try {
        if (
          isCreateMode
        ) {
          await createProject();

        } else {
          await updateProject();
        }

      } catch (
        error
      ) {
        showAlert(
          'error',

          isCreateMode
            ? 'Project Save Failed'
            : 'Project Update Failed',

          error.message ||
            'Something went wrong while saving the project.'
        );

      } finally {
        setLoading(
          false
        );
      }
    };

  /* =========================================================
     CLEAR FORM
  ========================================================= */

  const clearProjectForm =
    () => {
      const emptyForm =
        createInitialForm();

      setSelectedProjectId(
        ''
      );

      setMode(
        'view'
      );

      setForm(
        emptyForm
      );

      setOriginalForm(
        emptyForm
      );

      setConfirmation({
        open: false,
        type: '',
        projectCode: ''
      });
    };

  /* =========================================================
     START NEW PROJECT
  ========================================================= */

  const startNewProject =
    () => {
      const newForm =
        createInitialForm(
          currentUsername
        );

      setSelectedProjectId(
        ''
      );

      setMode(
        'create'
      );

      setForm(
        newForm
      );

      setOriginalForm(
        newForm
      );

      setConfirmation({
        open: false,
        type: '',
        projectCode: ''
      });
    };

  /* =========================================================
     NEW PROJECT BUTTON
  ========================================================= */

  const handleNewProject =
    () => {
      if (
        loading
      ) {
        return;
      }

      if (
        hasUnsavedChanges
      ) {
        setConfirmation({
          open: true,
          type: 'new',
          projectCode: ''
        });

        return;
      }

      startNewProject();
    };

  /* =========================================================
     CANCEL CONFIRMATION
  ========================================================= */

  const handleCancelConfirmation =
    () => {
      setConfirmation({
        open: false,
        type: '',
        projectCode: ''
      });
    };

  /* =========================================================
     CONFIRM ACTION
  ========================================================= */

  const handleConfirmAction =
    () => {
      if (
        confirmation.type ===
        'switch'
      ) {
        const nextProjectCode =
          confirmation.projectCode;

        setConfirmation({
          open: false,
          type: '',
          projectCode: ''
        });

        loadExistingProject(
          nextProjectCode
        );

        return;
      }

      if (
        confirmation.type ===
        'new'
      ) {
        startNewProject();

        return;
      }

      clearProjectForm();
    };

  /* =========================================================
     CONFIRMATION CONTENT
  ========================================================= */

  const confirmationTitle =
    confirmation.type ===
    'switch'
      ? 'Switch Project?'
      : confirmation.type ===
        'new'
        ? 'Start a New Project?'
        : 'Clear Project?';

  const confirmationDescription =
    confirmation.type ===
    'switch'
      ? 'You have unsaved changes. Selecting another Project Code will discard those changes.'
      : confirmation.type ===
        'new'
        ? 'You have unsaved project information. Starting a new project will discard those changes.'
        : 'You have unsaved project information. Clearing the selection will discard those changes.';

  const confirmationButtonText =
    confirmation.type ===
    'switch'
      ? 'Discard & Switch'
      : confirmation.type ===
        'new'
        ? 'Discard & Start New'
        : 'Discard & Clear';

  /* =========================================================
     ALERT STYLES
  ========================================================= */

  const alertStyle =
    alert.type ===
    'success'
      ? {
          icon: '✓',
          background:
            '#DCFCE7',
          color:
            '#166534'
        }
      : alert.type ===
        'error'
        ? {
            icon: '✕',
            background:
              '#FEE2E2',
            color:
              '#B91C1C'
          }
        : {
            icon: 'ℹ',
            background:
              '#DBEAFE',
            color:
              '#1D4ED8'
          };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="page-wrap">
      <div className="card">

        {/* =================================================
            HEADING
        ================================================= */}

        <div className="page-heading">
          <div>
            <h1>
              📋 Project Master
            </h1>

            <p className="page-description">
              Select an existing Project Code to view
              or update its details, or create a new project.
            </p>
          </div>
        </div>

        {/* =================================================
            PROJECT FORM
        ================================================= */}

        <form
          onSubmit={
            handleSubmit
          }
          className="project-form"
        >
          <div className="form-grid">

            {/* PROJECT CODE */}

            <label>
              Project Code *

              {isCreateMode ? (
                <input
                  name="projectcode"
                  maxLength={10}
                  value={
                    form.projectcode
                  }
                  onChange={
                    handleNewProjectCodeChange
                  }
                  placeholder="Enter new Project Code"
                  disabled={
                    loading
                  }
                  required
                />
              ) : (
                <select
                  value={
                    form.projectcode
                  }
                  onChange={
                    handleProjectCodeSelection
                  }
                  disabled={
                    loading ||
                    dropdownLoading
                  }
                >
                  <option value="">
                    {dropdownLoading
                      ? 'Loading Projects...'
                      : 'Select Project Code'}
                  </option>

                  {projectCodes.map(
                    (
                      projectCode
                    ) => (
                      <option
                        key={
                          projectCode
                        }
                        value={
                          projectCode
                        }
                      >
                        {projectCode}
                      </option>
                    )
                  )}
                </select>
              )}
            </label>

            {/* VERSION ID */}

            <label>
              Version ID *

              <input
                name="versionid"
                maxLength={2}
                value={
                  form.versionid
                }
                onChange={
                  handleVersionChange
                }
                placeholder="e.g. 01"
                disabled={
                  loading ||
                  isExistingProject ||
                  mode ===
                    'view'
                }
                required
              />
            </label>

            {/* PROJECT NAME */}

            <label className="full-width">
              Project Name *

              <input
                name="projectname"
                maxLength={50}
                value={
                  form.projectname
                }
                onChange={
                  handleChange
                }
                placeholder="Enter project name"
                disabled={
                  loading ||
                  mode ===
                    'view'
                }
                required
              />
            </label>

            {/* PROJECT DESCRIPTION */}

            <label className="full-width">
              Project Description

              <textarea
                name="projectdescription"
                maxLength={500}
                value={
                  form.projectdescription
                }
                onChange={
                  handleChange
                }
                placeholder="Enter project description"
                rows={4}
                disabled={
                  loading ||
                  mode ===
                    'view'
                }
              />
            </label>

            {/* PROJECT TYPE */}

            <label>
              Project Type

              <select
                name="projecttype"
                value={
                  form.projecttype
                }
                onChange={
                  handleChange
                }
                disabled={
                  loading ||
                  dropdownLoading ||
                  mode ===
                    'view'
                }
              >
                <option value="">
                  Select Project Type
                </option>

                {projectTypes.map(
                  (
                    type
                  ) => (
                    <option
                      key={
                        type.projecttype
                      }
                      value={
                        type.projecttype
                      }
                    >
                      {type.projecttype}
                      {' - '}
                      {type.description}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* BUSINESS PARTNER */}

            <label>
              Business Partner

              <select
                name="partnerid"
                value={
                  form.partnerid
                }
                onChange={
                  handleChange
                }
                disabled={
                  loading ||
                  dropdownLoading ||
                  mode ===
                    'view'
                }
              >
                <option value="">
                  Select Business Partner
                </option>

                {businessPartners.map(
                  (
                    partner
                  ) => (
                    <option
                      key={
                        partner.partnerid
                      }
                      value={
                        partner.partnerid
                      }
                    >
                      {partner.partnerid}
                      {' - '}
                      {partner.description}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* CURRENCY */}

            <label>
              Currency

              <select
                name="currency"
                value={
                  form.currency
                }
                onChange={
                  handleChange
                }
                disabled={
                  loading ||
                  dropdownLoading ||
                  mode ===
                    'view'
                }
              >
                <option value="">
                  Select Currency
                </option>

                {currencies.map(
                  (
                    currency
                  ) => (
                    <option
                      key={
                        currency.currcode
                      }
                      value={
                        currency.currcode
                      }
                    >
                      {currency.currcode}
                      {' - '}
                      {currency.description}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* STATUS */}

            <label>
              Status

              <select
                name="status"
                value={
                  form.status
                }
                onChange={
                  handleChange
                }
                disabled={
                  loading ||
                  mode ===
                    'view'
                }
              >
                <option value="">
                  Select Status
                </option>

                {projectStatuses.map(
                  (
                    status
                  ) => (
                    <option
                      key={
                        status.code
                      }
                      value={
                        status.code
                      }
                    >
                      {status.code}
                      {' - '}
                      {status.name}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* LOCATION */}

            <label>
              Location

              <input
                name="location"
                maxLength={20}
                value={
                  form.location
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. Colombo"
                disabled={
                  loading ||
                  mode ===
                    'view'
                }
              />
            </label>

            {/* REGION */}

            <label>
              Region

              <input
                name="region"
                maxLength={20}
                value={
                  form.region
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. APAC"
                disabled={
                  loading ||
                  mode ===
                    'view'
                }
              />
            </label>

            {/* CREATED BY */}

            <label>
              Created By

              <input
                name="createdby"
                value={
                  form.createdby
                }
                placeholder={
                  isCreateMode
                    ? 'Automatically set from login'
                    : 'Created by'
                }
                readOnly
                disabled={
                  mode ===
                  'view'
                }
                title="Automatically controlled by the signed-in user"
              />
            </label>

            {/* UPDATED BY */}

            <label>
              Updated By

              <input
                name="updatedby"
                value={
                  form.updatedby
                }
                placeholder={
                  isCreateMode
                    ? 'Automatically set from login'
                    : 'Updated by'
                }
                readOnly
                disabled={
                  mode ===
                  'view'
                }
                title="Automatically controlled by the signed-in user"
              />
            </label>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap:
                '12px',
              flexWrap:
                'wrap',
              marginTop:
                '20px'
            }}
          >
            <button
              type="submit"
              disabled={
                loading ||
                dropdownLoading ||
                mode ===
                  'view' ||
                (
                  isExistingProject &&
                  !hasUnsavedChanges
                )
              }
            >
              {loading
                ? (
                    isExistingProject
                      ? '⏳ Updating...'
                      : '⏳ Saving...'
                  )
                : (
                    isExistingProject
                      ? '💾 Update Project'
                      : '💾 Save Project'
                  )}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={
                handleNewProject
              }
              disabled={
                loading
              }
            >
              ➕ New Project
            </button>
          </div>
        </form>

        {/* =================================================
            GUIDANCE
        ================================================= */}

        {isExistingProject && (
          <p
            className="page-description"
            style={{
              marginTop:
                '12px'
            }}
          >
            Project Code, Version ID, Created By and
            Created Date are protected fields. Updated By
            is automatically set to the signed-in user
            whenever the project is updated.
          </p>
        )}

        {isCreateMode && (
          <p
            className="page-description"
            style={{
              marginTop:
                '12px'
            }}
          >
            Created By and Updated By are automatically
            assigned using the signed-in username.
          </p>
        )}
      </div>

      {/* =====================================================
          CONFIRMATION MODAL
      ===================================================== */}

      {confirmation.open && (
        <div
          role="presentation"
          onMouseDown={
            (
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                handleCancelConfirmation();
              }
            }
          }
          style={{
            position:
              'fixed',
            inset:
              0,
            zIndex:
              9999,
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding:
              '20px',
            backgroundColor:
              'rgba(15, 23, 42, 0.60)',
            backdropFilter:
              'blur(3px)'
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="card"
            style={{
              width:
                '100%',
              maxWidth:
                '440px',
              padding:
                '28px',
              borderRadius:
                '14px',
              boxShadow:
                '0 20px 60px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width:
                  '52px',
                height:
                  '52px',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                borderRadius:
                  '50%',
                backgroundColor:
                  '#FEF3C7',
                color:
                  '#B45309',
                fontSize:
                  '26px',
                marginBottom:
                  '18px'
              }}
            >
              ⚠
            </div>

            <h2
              style={{
                fontSize:
                  '21px',
                fontWeight:
                  700,
                margin:
                  '0 0 12px'
              }}
            >
              {confirmationTitle}
            </h2>

            <p
              style={{
                fontSize:
                  '14px',
                lineHeight:
                  1.7,
                opacity:
                  0.8,
                marginBottom:
                  '24px'
              }}
            >
              {confirmationDescription}
            </p>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'flex-end',
                gap:
                  '12px',
                flexWrap:
                  'wrap'
              }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleCancelConfirmation
                }
                autoFocus
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleConfirmAction
                }
              >
                {confirmationButtonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SYSTEM ALERT MODAL
      ===================================================== */}

      {alert.open && (
        <div
          role="presentation"
          onMouseDown={
            (
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeAlert();
              }
            }
          }
          style={{
            position:
              'fixed',
            inset:
              0,
            zIndex:
              10000,
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding:
              '20px',
            backgroundColor:
              'rgba(15, 23, 42, 0.60)',
            backdropFilter:
              'blur(3px)'
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="card"
            style={{
              width:
                '100%',
              maxWidth:
                '440px',
              padding:
                '28px',
              borderRadius:
                '14px',
              boxShadow:
                '0 20px 60px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width:
                  '52px',
                height:
                  '52px',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                borderRadius:
                  '50%',
                backgroundColor:
                  alertStyle.background,
                color:
                  alertStyle.color,
                fontSize:
                  '26px',
                fontWeight:
                  700,
                marginBottom:
                  '18px'
              }}
            >
              {alertStyle.icon}
            </div>

            <h2
              style={{
                fontSize:
                  '21px',
                fontWeight:
                  700,
                margin:
                  '0 0 12px'
              }}
            >
              {alert.title}
            </h2>

            <p
              style={{
                fontSize:
                  '14px',
                lineHeight:
                  1.7,
                opacity:
                  0.8,
                marginBottom:
                  '24px'
              }}
            >
              {alert.message}
            </p>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'flex-end'
              }}
            >
              <button
                type="button"
                onClick={
                  closeAlert
                }
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectMasterPage;