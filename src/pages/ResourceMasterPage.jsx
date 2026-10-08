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
          resourcesResponse
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
          )
        ]);

        const [
          resourceTypesResult,
          projectRolesResult,
          currenciesResult,
          resourcesResult
        ] = await Promise.all([
          resourceTypesResponse.json(),
          projectRolesResponse.json(),
          currenciesResponse.json(),
          resourcesResponse.json()
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

        const loadedResources =
          resourcesResult.resources ||
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

        return {
          resources:
            loadedResources
        };

      } catch (error) {
        showAlert(
          'error',
          'Unable to Load Resource Data',
          error.message ||
            'Failed to load Resource Master data.'
        );

        return {
          resources: []
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
     ESCAPE KEY
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

        if (
          alert.open
        ) {
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

      if (
        !resource
      ) {
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
        resourceId ===
        resourceForm.resourceid
      ) {
        return;
      }

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

      if (
        !resourceId
      ) {
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
      } =
        event.target;

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

      if (
        resourceForm.billrate !==
          '' &&
        (
          Number.isNaN(
            Number(
              resourceForm.billrate
            )
          ) ||
          Number(
            resourceForm.billrate
          ) < 0
        )
      ) {
        showAlert(
          'error',
          'Invalid Bill Rate',
          'Bill Rate must be a valid non-negative number.'
        );

        return false;
      }

      if (
        resourceForm.cost2co !==
          '' &&
        (
          Number.isNaN(
            Number(
              resourceForm.cost2co
            )
          ) ||
          Number(
            resourceForm.cost2co
          ) < 0
        )
      ) {
        showAlert(
          'error',
          'Invalid Cost to Company',
          'Cost to Company must be a valid non-negative number.'
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

        if (
          resourceId
        ) {
          loadResourceIntoForm(
            resourceId
          );

        } else {
          resetResourceToView();
        }
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
      <div className="card">

        {/* =====================================================
            RESOURCE MASTER
        ===================================================== */}

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
                    (
                      resource
                    ) => (
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
                  (
                    type
                  ) => (
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
                  (
                    role
                  ) => (
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

          {/* =====================================================
              RESOURCE ACTIONS
          ===================================================== */}

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

export default ResourceMasterPage;