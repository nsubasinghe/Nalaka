import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  authenticatedFetch
} from '../api/authenticatedFetch.js';

/* =========================================================
   INITIAL RESOURCE FORM
========================================================= */

const initialResourceForm = {
  resourceid: '',
  firstname: '',
  lastname: '',
  resourcetype: '',
  internalroleid: '',
  location: '',
  billrate: '',
  currcode: '',
  cost2co: ''
};

/* =========================================================
   INITIAL FINANCIAL FORM
========================================================= */

const initialFinancialForm = {
  projectkey: '',
  budgetamount: '',
  actualcost: '',
  billingamount: '',
  currcode: ''
};

function ResourceMasterPage() {
  /* =========================================================
     MASTER DATA
  ========================================================= */

  const [
    resourceTypes,
    setResourceTypes
  ] = useState([]);

  const [
    projectRoles,
    setProjectRoles
  ] = useState([]);

  const [
    currencies,
    setCurrencies
  ] = useState([]);

  const [
    resources,
    setResources
  ] = useState([]);

  const [
    projects,
    setProjects
  ] = useState([]);

  const [
    financialRecords,
    setFinancialRecords
  ] = useState([]);

  /* =========================================================
     RESOURCE STATE
  ========================================================= */

  const [
    resourceForm,
    setResourceForm
  ] = useState(
    initialResourceForm
  );

  const [
    originalResourceForm,
    setOriginalResourceForm
  ] = useState(
    initialResourceForm
  );

  const [
    resourceMode,
    setResourceMode
  ] = useState('view');

  /* =========================================================
     FINANCIAL STATE
  ========================================================= */

  const [
    financialForm,
    setFinancialForm
  ] = useState(
    initialFinancialForm
  );

  const [
    originalFinancialForm,
    setOriginalFinancialForm
  ] = useState(
    initialFinancialForm
  );

  const [
    financialRecordExists,
    setFinancialRecordExists
  ] = useState(false);

  /* =========================================================
     LOADING
  ========================================================= */

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    resourceProcessing,
    setResourceProcessing
  ] = useState(false);

  const [
    financialProcessing,
    setFinancialProcessing
  ] = useState(false);

  /* =========================================================
     ALERT
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
     CONFIRMATION
  ========================================================= */

  const [
    confirmation,
    setConfirmation
  ] = useState({
    open: false,
    type: ''
  });

  /* =========================================================
     DERIVED RESOURCE STATE
  ========================================================= */

  const isResourceCreateMode =
    resourceMode === 'create';

  const isResourceEditMode =
    resourceMode === 'edit';

  const resourceHasChanges =
    useMemo(() => {
      return (
        JSON.stringify(
          resourceForm
        ) !==
        JSON.stringify(
          originalResourceForm
        )
      );
    }, [
      resourceForm,
      originalResourceForm
    ]);

  /* =========================================================
     DERIVED FINANCIAL STATE
  ========================================================= */

  const financialHasChanges =
    useMemo(() => {
      return (
        JSON.stringify(
          financialForm
        ) !==
        JSON.stringify(
          originalFinancialForm
        )
      );
    }, [
      financialForm,
      originalFinancialForm
    ]);

  const selectedFinancialProject =
    useMemo(() => {
      return projects.find(
        (project) =>
          `${project.projectcode}::${project.versionid}` ===
          financialForm.projectkey
      );
    }, [
      projects,
      financialForm.projectkey
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
     LOAD PAGE DATA
  ========================================================= */

  const loadPageData =
    async () => {
      setLoading(true);

      try {
        const [
          resourceTypesResponse,
          projectRolesResponse,
          currenciesResponse,
          resourcesResponse,
          projectsResponse,
          financialResponse
        ] = await Promise.all([
          fetch(
            '/api/resource-types'
          ),
          fetch(
            '/api/project-roles'
          ),
          fetch(
            '/api/currencies'
          ),
          fetch(
            '/api/resources'
          ),
          fetch(
            '/api/projects'
          ),
          fetch(
            '/api/project-fi'
          )
        ]);

        const [
          resourceTypesResult,
          projectRolesResult,
          currenciesResult,
          resourcesResult,
          projectsResult,
          financialResult
        ] = await Promise.all([
          resourceTypesResponse.json(),
          projectRolesResponse.json(),
          currenciesResponse.json(),
          resourcesResponse.json(),
          projectsResponse.json(),
          financialResponse.json()
        ]);

        if (
          !resourceTypesResponse.ok
        ) {
          throw new Error(
            resourceTypesResult.error ||
              'Failed to load Resource Types.'
          );
        }

        if (
          !projectRolesResponse.ok
        ) {
          throw new Error(
            projectRolesResult.error ||
              'Failed to load Project Roles.'
          );
        }

        if (
          !currenciesResponse.ok
        ) {
          throw new Error(
            currenciesResult.error ||
              'Failed to load Currencies.'
          );
        }

        if (
          !resourcesResponse.ok
        ) {
          throw new Error(
            resourcesResult.error ||
              'Failed to load Resources.'
          );
        }

        if (
          !projectsResponse.ok
        ) {
          throw new Error(
            projectsResult.error ||
              'Failed to load Projects.'
          );
        }

        if (
          !financialResponse.ok
        ) {
          throw new Error(
            financialResult.error ||
              'Failed to load Project Financial Information.'
          );
        }

        const loadedResources =
          resourcesResult.resources ||
          [];

        const loadedFinancialRecords =
          financialResult.projectFinancials ||
          [];

        setResourceTypes(
          resourceTypesResult.resourceTypes ||
          []
        );

        setProjectRoles(
          projectRolesResult.projectRoles ||
          []
        );

        setCurrencies(
          currenciesResult.currencies ||
          []
        );

        setResources(
          loadedResources
        );

        setProjects(
          projectsResult.projects ||
          []
        );

        setFinancialRecords(
          loadedFinancialRecords
        );

        return {
          resources:
            loadedResources,

          financialRecords:
            loadedFinancialRecords
        };

      } catch (error) {
        showAlert(
          'error',
          'Unable to Load Data',
          error.message ||
            'Failed to load Resource and Financial data.'
        );

        return {
          resources: [],
          financialRecords: []
        };

      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadPageData();
  }, []);

  /* =========================================================
     ESCAPE
  ========================================================= */

  useEffect(() => {
    if (
      !alert.open &&
      !confirmation.open
    ) {
      return;
    }

    const handleKeyDown =
      (event) => {
        if (
          event.key !==
          'Escape'
        ) {
          return;
        }

        if (alert.open) {
          closeAlert();
          return;
        }

        setConfirmation({
          open: false,
          type: ''
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
    alert.open,
    confirmation.open
  ]);

  /* =========================================================
     RESOURCE LOAD
  ========================================================= */

  const loadResourceIntoForm =
    (
      resourceId,
      sourceResources = resources
    ) => {
      const resource =
        sourceResources.find(
          (item) =>
            String(
              item.resourceid
            ) ===
            String(
              resourceId
            )
        );

      if (!resource) {
        setResourceForm({
          ...initialResourceForm
        });

        setOriginalResourceForm({
          ...initialResourceForm
        });

        setResourceMode(
          'view'
        );

        return;
      }

      const nextForm = {
        resourceid:
          resource.resourceid ||
          '',

        firstname:
          resource.firstname ||
          '',

        lastname:
          resource.lastname ||
          '',

        resourcetype:
          resource.resourcetype ||
          '',

        internalroleid:
          resource.internalroleid ||
          '',

        location:
          resource.location ||
          '',

        billrate:
          resource.billrate ??
          '',

        currcode:
          resource.currcode ||
          '',

        cost2co:
          resource.cost2co ??
          ''
      };

      setResourceForm(
        nextForm
      );

      setOriginalResourceForm(
        nextForm
      );

      setResourceMode(
        'edit'
      );
    };

  /* =========================================================
     RESOURCE SELECT
  ========================================================= */

  const handleResourceSelection =
    (event) => {
      const resourceId =
        event.target.value;

      if (
        resourceHasChanges
      ) {
        setConfirmation({
          open: true,
          type:
            `resource-switch:${resourceId}`
        });

        return;
      }

      if (!resourceId) {
        resetResourceToView();
        return;
      }

      loadResourceIntoForm(
        resourceId
      );
    };

  /* =========================================================
     RESOURCE CHANGE
  ========================================================= */

  const handleResourceChange =
    (event) => {
      const {
        name,
        value
      } = event.target;

      setResourceForm(
        (previous) => ({
          ...previous,
          [name]:
            value
        })
      );
    };

  /* =========================================================
     NEW RESOURCE ID
  ========================================================= */

  const handleResourceIdChange =
    (event) => {
      if (
        !isResourceCreateMode
      ) {
        return;
      }

      const value =
        event.target.value
          .toUpperCase()
          .replace(
            /[^A-Z0-9]/g,
            ''
          )
          .slice(
            0,
            10
          );

      setResourceForm(
        (previous) => ({
          ...previous,
          resourceid:
            value
        })
      );
    };

  /* =========================================================
     RESOURCE RESET / NEW
  ========================================================= */

  const resetResourceToView =
    () => {
      setResourceForm({
        ...initialResourceForm
      });

      setOriginalResourceForm({
        ...initialResourceForm
      });

      setResourceMode(
        'view'
      );

      setConfirmation({
        open: false,
        type: ''
      });
    };

  const startNewResource =
    () => {
      setResourceForm({
        ...initialResourceForm
      });

      setOriginalResourceForm({
        ...initialResourceForm
      });

      setResourceMode(
        'create'
      );

      setConfirmation({
        open: false,
        type: ''
      });
    };

  const handleNewResource =
    () => {
      if (
        resourceProcessing
      ) {
        return;
      }

      if (
        resourceHasChanges
      ) {
        setConfirmation({
          open: true,
          type:
            'resource-new'
        });

        return;
      }

      startNewResource();
    };

  /* =========================================================
     RESOURCE VALIDATION
  ========================================================= */

  const validateResource =
    () => {
      if (
        !resourceForm.resourceid.trim()
      ) {
        showAlert(
          'error',
          'Resource ID Required',
          'Resource ID is required.'
        );

        return false;
      }

      if (
        !resourceForm.firstname.trim()
      ) {
        showAlert(
          'error',
          'First Name Required',
          'First Name is required.'
        );

        return false;
      }

      if (
        !resourceForm.resourcetype
      ) {
        showAlert(
          'error',
          'Resource Type Required',
          'Resource Type is required.'
        );

        return false;
      }

      if (
        !resourceForm.internalroleid
      ) {
        showAlert(
          'error',
          'Internal Role Required',
          'Internal Role is required.'
        );

        return false;
      }

      return true;
    };

  /* =========================================================
     RESOURCE SAVE / UPDATE
  ========================================================= */

  const handleResourceSubmit =
    async (event) => {
      event.preventDefault();

      if (
        resourceProcessing ||
        loading ||
        resourceMode ===
          'view'
      ) {
        return;
      }

      if (
        isResourceEditMode &&
        !resourceHasChanges
      ) {
        showAlert(
          'info',
          'No Changes',
          'No Resource changes have been made.'
        );

        return;
      }

      if (
        !validateResource()
      ) {
        return;
      }

      const resourceId =
        resourceForm.resourceid.trim();

      setResourceProcessing(
        true
      );

      try {
        const response =
          await authenticatedFetch(
            isResourceEditMode
              ? `/api/resources/${encodeURIComponent(
                  resourceId
                )}`
              : '/api/resources',
            {
              method:
                isResourceEditMode
                  ? 'PUT'
                  : 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  resourceid:
                    resourceId,

                  firstname:
                    resourceForm.firstname.trim(),

                  lastname:
                    resourceForm.lastname.trim(),

                  resourcetype:
                    resourceForm.resourcetype,

                  internalroleid:
                    resourceForm.internalroleid,

                  location:
                    resourceForm.location.trim(),

                  billrate:
                    resourceForm.billrate ===
                    ''
                      ? null
                      : Number(
                          resourceForm.billrate
                        ),

                  currcode:
                    resourceForm.currcode ||
                    null,

                  cost2co:
                    resourceForm.cost2co ===
                    ''
                      ? null
                      : Number(
                          resourceForm.cost2co
                        )
                })
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              'Failed to save Resource.'
          );
        }

        const refreshed =
          await loadPageData();

        loadResourceIntoForm(
          resourceId,
          refreshed.resources
        );

        showAlert(
          'success',
          isResourceEditMode
            ? 'Resource Updated'
            : 'Resource Saved',
          isResourceEditMode
            ? `Resource ${resourceId} was updated successfully.`
            : `Resource ${resourceId} was saved successfully.`
        );

      } catch (error) {
        showAlert(
          'error',
          isResourceEditMode
            ? 'Resource Update Failed'
            : 'Resource Save Failed',
          error.message ||
            'Failed to save Resource.'
        );

      } finally {
        setResourceProcessing(
          false
        );
      }
    };

  /* =========================================================
     RESOURCE DELETE
  ========================================================= */

  const requestResourceDelete =
    () => {
      if (
        !isResourceEditMode
      ) {
        return;
      }

      setConfirmation({
        open: true,
        type:
          'resource-delete'
      });
    };

  const deleteResource =
    async () => {
      const resourceId =
        resourceForm.resourceid;

      setConfirmation({
        open: false,
        type: ''
      });

      setResourceProcessing(
        true
      );

      try {
        const response =
          await authenticatedFetch(
            `/api/resources/${encodeURIComponent(
              resourceId
            )}`,
            {
              method:
                'DELETE'
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              'Failed to delete Resource.'
          );
        }

        await loadPageData();

        resetResourceToView();

        showAlert(
          'success',
          'Resource Deleted',
          `Resource ${resourceId} was deleted successfully.`
        );

      } catch (error) {
        showAlert(
          'error',
          'Resource Delete Failed',
          error.message ||
            'Failed to delete Resource.'
        );

      } finally {
        setResourceProcessing(
          false
        );
      }
    };

  /* =========================================================
     FINANCIAL PROJECT CHANGE
  ========================================================= */

  const handleFinancialProjectChange =
    (event) => {
      const projectkey =
        event.target.value;

      const project =
        projects.find(
          (item) =>
            `${item.projectcode}::${item.versionid}` ===
            projectkey
        );

      const existingRecord =
        financialRecords.find(
          (record) =>
            record.projectcode ===
              project?.projectcode &&
            record.versionid ===
              project?.versionid
        );

      const nextForm = {
        projectkey,

        budgetamount:
          existingRecord
            ?.budgetamount ??
          '',

        actualcost:
          existingRecord
            ?.actualcost ??
          '',

        billingamount:
          existingRecord
            ?.billingamount ??
          '',

        currcode:
          existingRecord
            ?.currcode ||
          project?.currency ||
          ''
      };

      setFinancialForm(
        nextForm
      );

      setOriginalFinancialForm(
        nextForm
      );

      setFinancialRecordExists(
        Boolean(
          existingRecord
        )
      );
    };

  /* =========================================================
     FINANCIAL FIELD CHANGE
  ========================================================= */

  const handleFinancialChange =
    (event) => {
      const {
        name,
        value
      } = event.target;

      setFinancialForm(
        (previous) => ({
          ...previous,
          [name]:
            value
        })
      );
    };

  /* =========================================================
     FINANCIAL SAVE / UPDATE
  ========================================================= */

  const handleFinancialSubmit =
    async (event) => {
      event.preventDefault();

      if (
        loading ||
        financialProcessing
      ) {
        return;
      }

      if (
        !selectedFinancialProject
      ) {
        showAlert(
          'error',
          'Project Required',
          'Please select a Project and Version.'
        );

        return;
      }

      if (
        !financialForm.currcode
      ) {
        showAlert(
          'error',
          'Currency Required',
          'Currency is required.'
        );

        return;
      }

      if (
        financialRecordExists &&
        !financialHasChanges
      ) {
        showAlert(
          'info',
          'No Changes',
          'No Project Financial changes have been made.'
        );

        return;
      }

      setFinancialProcessing(
        true
      );

      try {
        const response =
          await authenticatedFetch(
            '/api/project-fi',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  projectcode:
                    selectedFinancialProject.projectcode,

                  versionid:
                    selectedFinancialProject.versionid,

                  budgetamount:
                    financialForm.budgetamount ===
                    ''
                      ? null
                      : Number(
                          financialForm.budgetamount
                        ),

                  actualcost:
                    financialForm.actualcost ===
                    ''
                      ? null
                      : Number(
                          financialForm.actualcost
                        ),

                  billingamount:
                    financialForm.billingamount ===
                    ''
                      ? null
                      : Number(
                          financialForm.billingamount
                        ),

                  currcode:
                    financialForm.currcode
                })
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              'Failed to save Project Financial Information.'
          );
        }

        const projectkey =
          financialForm.projectkey;

        const refreshed =
          await loadPageData();

        const refreshedProject =
          projects.find(
            (project) =>
              `${project.projectcode}::${project.versionid}` ===
              projectkey
          );

        const refreshedRecord =
          refreshed.financialRecords.find(
            (record) =>
              record.projectcode ===
                refreshedProject
                  ?.projectcode &&
              record.versionid ===
                refreshedProject
                  ?.versionid
          );

        const nextForm = {
          projectkey,

          budgetamount:
            refreshedRecord
              ?.budgetamount ??
            financialForm.budgetamount,

          actualcost:
            refreshedRecord
              ?.actualcost ??
            financialForm.actualcost,

          billingamount:
            refreshedRecord
              ?.billingamount ??
            financialForm.billingamount,

          currcode:
            refreshedRecord
              ?.currcode ||
            financialForm.currcode
        };

        setFinancialForm(
          nextForm
        );

        setOriginalFinancialForm(
          nextForm
        );

        setFinancialRecordExists(
          true
        );

        showAlert(
          'success',
          financialRecordExists
            ? 'Financial Information Updated'
            : 'Financial Information Saved',
          `Project ${selectedFinancialProject.projectcode} Version ${selectedFinancialProject.versionid} financial information was saved successfully.`
        );

      } catch (error) {
        showAlert(
          'error',
          'Financial Save Failed',
          error.message ||
            'Failed to save Project Financial Information.'
        );

      } finally {
        setFinancialProcessing(
          false
        );
      }
    };

  /* =========================================================
     FINANCIAL CLEAR
  ========================================================= */

  const clearFinancialForm =
    () => {
      setFinancialForm({
        ...initialFinancialForm
      });

      setOriginalFinancialForm({
        ...initialFinancialForm
      });

      setFinancialRecordExists(
        false
      );

      setConfirmation({
        open: false,
        type: ''
      });
    };

  const handleFinancialClear =
    () => {
      if (
        financialHasChanges
      ) {
        setConfirmation({
          open: true,
          type:
            'financial-clear'
        });

        return;
      }

      clearFinancialForm();
    };

  /* =========================================================
     FINANCIAL DELETE
  ========================================================= */

  const requestFinancialDelete =
    () => {
      if (
        !financialRecordExists ||
        !selectedFinancialProject
      ) {
        return;
      }

      setConfirmation({
        open: true,
        type:
          'financial-delete'
      });
    };

  const deleteFinancialRecord =
    async () => {
      if (
        !selectedFinancialProject
      ) {
        return;
      }

      const {
        projectcode,
        versionid
      } =
        selectedFinancialProject;

      setConfirmation({
        open: false,
        type: ''
      });

      setFinancialProcessing(
        true
      );

      try {
        const response =
          await authenticatedFetch(
            `/api/project-fi/${encodeURIComponent(
              projectcode
            )}/${encodeURIComponent(
              versionid
            )}`,
            {
              method:
                'DELETE'
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              'Failed to delete Project Financial Information.'
          );
        }

        await loadPageData();

        clearFinancialForm();

        showAlert(
          'success',
          'Financial Information Deleted',
          `Project ${projectcode} Version ${versionid} financial information was deleted successfully.`
        );

      } catch (error) {
        showAlert(
          'error',
          'Financial Delete Failed',
          error.message ||
            'Failed to delete Project Financial Information.'
        );

      } finally {
        setFinancialProcessing(
          false
        );
      }
    };

  /* =========================================================
     CONFIRM ACTION
  ========================================================= */

  const handleConfirmAction =
    () => {
      if (
        confirmation.type ===
        'resource-delete'
      ) {
        deleteResource();
        return;
      }

      if (
        confirmation.type ===
        'resource-new'
      ) {
        startNewResource();
        return;
      }

      if (
        confirmation.type.startsWith(
          'resource-switch:'
        )
      ) {
        const resourceId =
          confirmation.type.replace(
            'resource-switch:',
            ''
          );

        setConfirmation({
          open: false,
          type: ''
        });

        if (resourceId) {
          loadResourceIntoForm(
            resourceId
          );
        } else {
          resetResourceToView();
        }

        return;
      }

      if (
        confirmation.type ===
        'financial-delete'
      ) {
        deleteFinancialRecord();
        return;
      }

      if (
        confirmation.type ===
        'financial-clear'
      ) {
        clearFinancialForm();
      }
    };

  /* =========================================================
     CONFIRMATION CONTENT
  ========================================================= */

  let confirmationTitle =
    'Confirm Action';

  let confirmationMessage =
    '';

  let confirmationButton =
    'Continue';

  let confirmationIsDelete =
    false;

  if (
    confirmation.type ===
    'resource-delete'
  ) {
    confirmationTitle =
      'Delete Resource?';

    confirmationMessage =
      `Resource ${resourceForm.resourceid} will be permanently deleted. The system will prevent deletion if this Resource is already used in Project Planning.`;

    confirmationButton =
      'Delete Resource';

    confirmationIsDelete =
      true;
  } else if (
    confirmation.type ===
    'resource-new'
  ) {
    confirmationTitle =
      'Start a New Resource?';

    confirmationMessage =
      'You have unsaved Resource changes. Starting a new Resource will discard them.';

    confirmationButton =
      'Discard & Start New';

  } else if (
    confirmation.type.startsWith(
      'resource-switch:'
    )
  ) {
    confirmationTitle =
      'Switch Resource?';

    confirmationMessage =
      'You have unsaved Resource changes. Selecting another Resource ID will discard them.';

    confirmationButton =
      'Discard & Switch';

  } else if (
    confirmation.type ===
    'financial-delete'
  ) {
    confirmationTitle =
      'Delete Financial Information?';

    confirmationMessage =
      selectedFinancialProject
        ? `Financial information for Project ${selectedFinancialProject.projectcode} Version ${selectedFinancialProject.versionid} will be permanently deleted.`
        : 'The selected Financial Information will be deleted.';

    confirmationButton =
      'Delete Financial Information';

    confirmationIsDelete =
      true;

  } else if (
    confirmation.type ===
    'financial-clear'
  ) {
    confirmationTitle =
      'Clear Financial Changes?';

    confirmationMessage =
      'You have unsaved Project Financial changes. Clearing the form will discard them.';

    confirmationButton =
      'Discard & Clear';
  }

  /* =========================================================
     ALERT STYLE
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
      {/* =====================================================
          RESOURCE MASTER
      ===================================================== */}

      <div className="card">
        <div className="page-heading">
          <div>
            <h1>
              👤 Resource Master
            </h1>

            <p className="page-description">
              Select an existing Resource ID to view,
              update or delete its details, or create
              a new Resource.
            </p>
          </div>
        </div>

        <form
          onSubmit={
            handleResourceSubmit
          }
        >
          <div className="form-grid">

            {/* RESOURCE ID */}

            <label>
              Resource ID *

              {isResourceCreateMode ? (
                <input
                  name="resourceid"
                  value={
                    resourceForm.resourceid
                  }
                  onChange={
                    handleResourceIdChange
                  }
                  maxLength={10}
                  placeholder="Enter Resource ID"
                  disabled={
                    resourceProcessing
                  }
                  required
                />
              ) : (
                <select
                  value={
                    resourceForm.resourceid
                  }
                  onChange={
                    handleResourceSelection
                  }
                  disabled={
                    loading ||
                    resourceProcessing
                  }
                >
                  <option value="">
                    {loading
                      ? 'Loading Resources...'
                      : 'Select Resource ID'}
                  </option>

                  {resources.map(
                    (resource) => (
                      <option
                        key={
                          resource.resourceid
                        }
                        value={
                          resource.resourceid
                        }
                      >
                        {resource.resourceid}
                        {' - '}
                        {resource.firstname}
                        {' '}
                        {resource.lastname ||
                          ''}
                      </option>
                    )
                  )}
                </select>
              )}
            </label>

            {/* FIRST NAME */}

            <label>
              First Name *

              <input
                name="firstname"
                value={
                  resourceForm.firstname
                }
                onChange={
                  handleResourceChange
                }
                maxLength={20}
                placeholder="First Name"
                disabled={
                  resourceProcessing ||
                  resourceMode ===
                    'view'
                }
                required
              />
            </label>

            {/* LAST NAME */}

            <label>
              Last Name

              <input
                name="lastname"
                value={
                  resourceForm.lastname
                }
                onChange={
                  handleResourceChange
                }
                maxLength={20}
                placeholder="Last Name"
                disabled={
                  resourceProcessing ||
                  resourceMode ===
                    'view'
                }
              />
            </label>

            {/* RESOURCE TYPE */}

            <label>
              Resource Type *

              <select
                name="resourcetype"
                value={
                  resourceForm.resourcetype
                }
                onChange={
                  handleResourceChange
                }
                disabled={
                  loading ||
                  resourceProcessing ||
                  resourceMode ===
                    'view'
                }
              >
                <option value="">
                  Select Resource Type
                </option>

                {resourceTypes.map(
                  (type) => (
                    <option
                      key={
                        type.resourcetype
                      }
                      value={
                        type.resourcetype
                      }
                    >
                      {type.resourcetype}
                      {' - '}
                      {type.description}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* INTERNAL ROLE */}

            <label>
              Internal Role *

              <select
                name="internalroleid"
                value={
                  resourceForm.internalroleid
                }
                onChange={
                  handleResourceChange
                }
                disabled={
                  loading ||
                  resourceProcessing ||
                  resourceMode ===
                    'view'
                }
              >
                <option value="">
                  Select Internal Role
                </option>

                {projectRoles.map(
                  (role) => (
                    <option
                      key={
                        role.projectroleid
                      }
                      value={
                        role.projectroleid
                      }
                    >
                      {role.projectroleid}
                      {' - '}
                      {role.description}
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
                value={
                  resourceForm.location
                }
                onChange={
                  handleResourceChange
                }
                maxLength={20}
                placeholder="Location"
                disabled={
                  resourceProcessing ||
                  resourceMode ===
                    'view'
                }
              />
            </label>

            {/* BILL RATE */}

            <label>
              Bill Rate

              <input
                type="number"
                name="billrate"
                min="0"
                step="0.01"
                value={
                  resourceForm.billrate
                }
                onChange={
                  handleResourceChange
                }
                placeholder="0.00"
                disabled={
                  resourceProcessing ||
                  resourceMode ===
                    'view'
                }
              />
            </label>

            {/* CURRENCY */}

            <label>
              Currency

              <select
                name="currcode"
                value={
                  resourceForm.currcode
                }
                onChange={
                  handleResourceChange
                }
                disabled={
                  loading ||
                  resourceProcessing ||
                  resourceMode ===
                    'view'
                }
              >
                <option value="">
                  Select Currency
                </option>

                {currencies.map(
                  (currency) => (
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

            {/* COST TO COMPANY */}

            <label>
              Cost to Company

              <input
                type="number"
                name="cost2co"
                min="0"
                step="0.01"
                value={
                  resourceForm.cost2co
                }
                onChange={
                  handleResourceChange
                }
                placeholder="0.00"
                disabled={
                  resourceProcessing ||
                  resourceMode ===
                    'view'
                }
              />
            </label>
          </div>

          <div
            style={{
              display:
                'flex',
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
                resourceProcessing ||
                resourceMode ===
                  'view' ||
                (
                  isResourceEditMode &&
                  !resourceHasChanges
                )
              }
            >
              {resourceProcessing
                ? '⏳ Processing...'
                : isResourceEditMode
                  ? '💾 Update Resource'
                  : '💾 Save Resource'}
            </button>

            {isResourceEditMode && (
              <button
                type="button"
                className="delete-button"
                onClick={
                  requestResourceDelete
                }
                disabled={
                  resourceProcessing
                }
              >
                🗑 Delete Resource
              </button>
            )}

            <button
              type="button"
              className="secondary-button"
              onClick={
                handleNewResource
              }
              disabled={
                resourceProcessing
              }
            >
              ➕ New Resource
            </button>
          </div>
        </form>
      </div>

      {/* =====================================================
          PROJECT FINANCIALS
      ===================================================== */}

      <div
        className="card"
        style={{
          marginTop:
            '24px'
        }}
      >
        <div className="page-heading">
          <div>
            <h1>
              💰 Project Financials
            </h1>

            <p className="page-description">
              Select a Project and Version to create,
              view, update or delete Project Financial
              Information.
            </p>
          </div>
        </div>

        <form
          onSubmit={
            handleFinancialSubmit
          }
        >
          <div className="form-grid">

            {/* PROJECT */}

            <label>
              Project / Version *

              <select
                name="projectkey"
                value={
                  financialForm.projectkey
                }
                onChange={
                  handleFinancialProjectChange
                }
                disabled={
                  loading ||
                  financialProcessing
                }
              >
                <option value="">
                  {loading
                    ? 'Loading Projects...'
                    : 'Select Project / Version'}
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={
                        `${project.projectcode}-${project.versionid}`
                      }
                      value={
                        `${project.projectcode}::${project.versionid}`
                      }
                    >
                      {project.projectcode}
                      {' - '}
                      {project.projectname}
                      {' - V'}
                      {project.versionid}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* PROJECT CODE */}

            <label>
              Project Code

              <input
                value={
                  selectedFinancialProject
                    ?.projectcode ||
                  ''
                }
                readOnly
                placeholder="Auto"
              />
            </label>

            {/* VERSION ID */}

            <label>
              Version ID

              <input
                value={
                  selectedFinancialProject
                    ?.versionid ||
                  ''
                }
                readOnly
                placeholder="Auto"
              />
            </label>

            {/* BUDGET */}

            <label>
              Budget Amount

              <input
                type="number"
                name="budgetamount"
                min="0"
                step="0.01"
                value={
                  financialForm.budgetamount
                }
                onChange={
                  handleFinancialChange
                }
                placeholder="0.00"
                disabled={
                  financialProcessing ||
                  !selectedFinancialProject
                }
              />
            </label>

            {/* ACTUAL COST */}

            <label>
              Actual Cost

              <input
                type="number"
                name="actualcost"
                min="0"
                step="0.01"
                value={
                  financialForm.actualcost
                }
                onChange={
                  handleFinancialChange
                }
                placeholder="0.00"
                disabled={
                  financialProcessing ||
                  !selectedFinancialProject
                }
              />
            </label>

            {/* BILLING */}

            <label>
              Billing Amount

              <input
                type="number"
                name="billingamount"
                min="0"
                step="0.01"
                value={
                  financialForm.billingamount
                }
                onChange={
                  handleFinancialChange
                }
                placeholder="0.00"
                disabled={
                  financialProcessing ||
                  !selectedFinancialProject
                }
              />
            </label>

            {/* CURRENCY */}

            <label>
              Currency *

              <select
                name="currcode"
                value={
                  financialForm.currcode
                }
                onChange={
                  handleFinancialChange
                }
                disabled={
                  loading ||
                  financialProcessing ||
                  !selectedFinancialProject
                }
              >
                <option value="">
                  Select Currency
                </option>

                {currencies.map(
                  (currency) => (
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
          </div>

          {selectedFinancialProject && (
            <div
              className="project-summary"
              style={{
                marginTop:
                  '20px'
              }}
            >
              <div className="summary-item">
                <span>
                  Project Name
                </span>

                <strong>
                  {selectedFinancialProject.projectname ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Location
                </span>

                <strong>
                  {selectedFinancialProject.location ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Region
                </span>

                <strong>
                  {selectedFinancialProject.region ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Financial Record
                </span>

                <strong>
                  {financialRecordExists
                    ? 'Existing'
                    : 'New'}
                </strong>
              </div>
            </div>
          )}

          <div
            style={{
              display:
                'flex',
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
                financialProcessing ||
                !selectedFinancialProject ||
                (
                  financialRecordExists &&
                  !financialHasChanges
                )
              }
            >
              {financialProcessing
                ? '⏳ Processing...'
                : financialRecordExists
                  ? '💾 Update Financial Information'
                  : '💾 Save Financial Information'}
            </button>

            {financialRecordExists && (
              <button
                type="button"
                className="delete-button"
                onClick={
                  requestFinancialDelete
                }
                disabled={
                  financialProcessing
                }
              >
                🗑 Delete Financial Information
              </button>
            )}

            <button
              type="button"
              className="secondary-button"
              onClick={
                handleFinancialClear
              }
              disabled={
                financialProcessing
              }
            >
              Clear Selection
            </button>
          </div>
        </form>
      </div>

      {/* =====================================================
          CONFIRMATION MODAL
      ===================================================== */}

      {confirmation.open && (
        <div
          role="presentation"
          onMouseDown={
            (event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setConfirmation({
                  open: false,
                  type: ''
                });
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
              {confirmationMessage}
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
                onClick={() =>
                  setConfirmation({
                    open: false,
                    type: ''
                  })
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  confirmationIsDelete
                    ? 'delete-button'
                    : ''
                }
                onClick={
                  handleConfirmAction
                }
              >
                {confirmationButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SYSTEM ALERT
      ===================================================== */}

      {alert.open && (
        <div
          role="presentation"
          onMouseDown={
            (event) => {
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

export default ResourceMasterPage;