import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  authenticatedFetch
} from '../api/authenticatedFetch.js';

const initialForm = {
  phaseid: '',
  description: ''
};

function ProjectPhasesPage() {
  const [
    phases,
    setPhases
  ] = useState([]);

  const [
    form,
    setForm
  ] = useState(
    initialForm
  );

  const [
    originalForm,
    setOriginalForm
  ] = useState(
    initialForm
  );

  const [
    mode,
    setMode
  ] = useState('view');

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    processing,
    setProcessing
  ] = useState(false);

  const [
    alert,
    setAlert
  ] = useState({
    open: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [
    confirmation,
    setConfirmation
  ] = useState({
    open: false,
    type: '',
    phaseId: ''
  });

  const isCreateMode =
    mode === 'create';

  const isEditMode =
    mode === 'edit';

  const hasUnsavedChanges =
    useMemo(
      () =>
        JSON.stringify(
          form
        ) !==
        JSON.stringify(
          originalForm
        ),
      [
        form,
        originalForm
      ]
    );

  /* =========================================================
     ALERTS
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
     LOAD PHASE MASTER
  ========================================================= */

  const loadPhases =
    async () => {
      setLoading(true);

      try {
        const response =
          await fetch(
            '/api/project-phases'
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Failed to load Project Phases.'
          );
        }

        const loadedPhases =
          (
            result.projectPhases ||
            []
          ).map(
            (phase) => ({
              phaseid:
                phase.phaseid,

              description:
                phase.description ||
                ''
            })
          );

        setPhases(
          loadedPhases
        );

        return loadedPhases;

      } catch (error) {
        showAlert(
          'error',
          'Unable to Load Project Phases',
          error.message ||
            'Failed to load Project Phases.'
        );

        return [];

      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadPhases();
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
          type: '',
          phaseId: ''
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
     LOAD SELECTED PHASE
  ========================================================= */

  const loadSelectedPhase =
    (
      phaseId,
      sourcePhases = phases
    ) => {
      const phase =
        sourcePhases.find(
          (item) =>
            String(
              item.phaseid
            ) ===
            String(
              phaseId
            )
        );

      if (!phase) {
        setForm({
          ...initialForm
        });

        setOriginalForm({
          ...initialForm
        });

        setMode('view');

        return;
      }

      const nextForm = {
        phaseid:
          phase.phaseid,

        description:
          phase.description ||
          ''
      };

      setForm(
        nextForm
      );

      setOriginalForm(
        nextForm
      );

      setMode('edit');
    };

  /* =========================================================
     PHASE SELECTION
  ========================================================= */

  const handlePhaseSelection =
    (event) => {
      const phaseId =
        event.target.value;

      if (
        phaseId ===
        form.phaseid
      ) {
        return;
      }

      if (
        hasUnsavedChanges
      ) {
        setConfirmation({
          open: true,
          type: 'switch',
          phaseId
        });

        return;
      }

      if (!phaseId) {
        resetToView();
        return;
      }

      loadSelectedPhase(
        phaseId
      );
    };

  /* =========================================================
     CREATE MODE PHASE ID
  ========================================================= */

  const handlePhaseIdChange =
    (event) => {
      if (!isCreateMode) {
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
            2
          );

      setForm(
        (previous) => ({
          ...previous,
          phaseid:
            value
        })
      );
    };

  /* =========================================================
     DESCRIPTION
  ========================================================= */

  const handleDescriptionChange =
    (event) => {
      setForm(
        (previous) => ({
          ...previous,
          description:
            event.target.value
        })
      );
    };

  /* =========================================================
     RESET / NEW
  ========================================================= */

  const resetToView =
    () => {
      setForm({
        ...initialForm
      });

      setOriginalForm({
        ...initialForm
      });

      setMode('view');

      setConfirmation({
        open: false,
        type: '',
        phaseId: ''
      });
    };

  const startNewPhase =
    () => {
      setForm({
        ...initialForm
      });

      setOriginalForm({
        ...initialForm
      });

      setMode('create');

      setConfirmation({
        open: false,
        type: '',
        phaseId: ''
      });
    };

  const handleNewPhase =
    () => {
      if (processing) {
        return;
      }

      if (
        hasUnsavedChanges
      ) {
        setConfirmation({
          open: true,
          type: 'new',
          phaseId: ''
        });

        return;
      }

      startNewPhase();
    };

  /* =========================================================
     VALIDATE
  ========================================================= */

  const validateForm =
    () => {
      const phaseId =
        form.phaseid.trim();

      const description =
        form.description.trim();

      if (!phaseId) {
        showAlert(
          'error',
          'Phase ID Required',
          'Phase ID is required.'
        );

        return false;
      }

      if (
        phaseId.length > 2
      ) {
        showAlert(
          'error',
          'Invalid Phase ID',
          'Phase ID cannot exceed 2 characters.'
        );

        return false;
      }

      if (!description) {
        showAlert(
          'error',
          'Description Required',
          'Description is required.'
        );

        return false;
      }

      if (
        isCreateMode &&
        phases.some(
          (phase) =>
            String(
              phase.phaseid
            ).toUpperCase() ===
            phaseId.toUpperCase()
        )
      ) {
        showAlert(
          'error',
          'Duplicate Phase ID',
          `Phase ${phaseId} already exists.`
        );

        return false;
      }

      return true;
    };

  /* =========================================================
     SAVE / UPDATE
  ========================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        processing ||
        loading ||
        mode === 'view'
      ) {
        return;
      }

      if (
        isEditMode &&
        !hasUnsavedChanges
      ) {
        showAlert(
          'info',
          'No Changes',
          'No Project Phase changes have been made.'
        );

        return;
      }

      if (!validateForm()) {
        return;
      }

      const phaseId =
        form.phaseid.trim();

      const description =
        form.description.trim();

      setProcessing(true);

      try {
        const response =
          await authenticatedFetch(
            isEditMode
              ? `/api/project-phases/${encodeURIComponent(
                  phaseId
                )}`
              : '/api/project-phases',
            {
              method:
                isEditMode
                  ? 'PUT'
                  : 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify(
                  isEditMode
                    ? {
                        description
                      }
                    : {
                        phaseid:
                          phaseId,
                        description
                      }
                )
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              (
                isEditMode
                  ? 'Failed to update Project Phase.'
                  : 'Failed to create Project Phase.'
              )
          );
        }

        const refreshedPhases =
          await loadPhases();

        loadSelectedPhase(
          phaseId,
          refreshedPhases
        );

        showAlert(
          'success',
          isEditMode
            ? 'Project Phase Updated'
            : 'Project Phase Created',
          isEditMode
            ? `Phase ${phaseId} was updated successfully.`
            : `Phase ${phaseId} was created successfully.`
        );

      } catch (error) {
        showAlert(
          'error',
          isEditMode
            ? 'Update Failed'
            : 'Create Failed',
          error.message ||
            'Failed to save Project Phase.'
        );

      } finally {
        setProcessing(false);
      }
    };

  /* =========================================================
     DELETE
  ========================================================= */

  const requestDelete =
    () => {
      if (!isEditMode) {
        return;
      }

      setConfirmation({
        open: true,
        type: 'delete',
        phaseId:
          form.phaseid
      });
    };

  const deletePhase =
    async () => {
      const phaseId =
        form.phaseid;

      setConfirmation({
        open: false,
        type: '',
        phaseId: ''
      });

      setProcessing(true);

      try {
        const response =
          await authenticatedFetch(
            `/api/project-phases/${encodeURIComponent(
              phaseId
            )}`,
            {
              method:
                'DELETE'
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Failed to delete Project Phase.'
          );
        }

        await loadPhases();

        resetToView();

        showAlert(
          'success',
          'Project Phase Deleted',
          `Phase ${phaseId} was deleted successfully.`
        );

      } catch (error) {
        showAlert(
          'error',
          'Delete Failed',
          error.message ||
            'Failed to delete Project Phase.'
        );

      } finally {
        setProcessing(false);
      }
    };

  /* =========================================================
     CONFIRMATION ACTION
  ========================================================= */

  const handleConfirmAction =
    () => {
      if (
        confirmation.type ===
        'delete'
      ) {
        deletePhase();
        return;
      }

      if (
        confirmation.type ===
        'new'
      ) {
        startNewPhase();
        return;
      }

      if (
        confirmation.type ===
        'switch'
      ) {
        const phaseId =
          confirmation.phaseId;

        setConfirmation({
          open: false,
          type: '',
          phaseId: ''
        });

        if (phaseId) {
          loadSelectedPhase(
            phaseId
          );
        } else {
          resetToView();
        }
      }
    };

  /* =========================================================
     CONFIRMATION CONTENT
  ========================================================= */

  const confirmationTitle =
    confirmation.type ===
      'delete'
      ? 'Delete Project Phase?'
      : confirmation.type ===
          'new'
        ? 'Start a New Phase?'
        : 'Switch Project Phase?';

  const confirmationMessage =
    confirmation.type ===
      'delete'
      ? `Phase ${form.phaseid} will be permanently deleted. The system will prevent deletion if this phase is already assigned or used by project planning.`
      : confirmation.type ===
          'new'
        ? 'You have unsaved Project Phase changes. Starting a new phase will discard them.'
        : 'You have unsaved Project Phase changes. Selecting another Phase ID will discard them.';

  const confirmationButton =
    confirmation.type ===
      'delete'
      ? 'Delete'
      : confirmation.type ===
          'new'
        ? 'Discard & Start New'
        : 'Discard & Switch';

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

  return (
    <div className="page-wrap">
      <div className="card phase-card">

        <div className="page-heading">
          <div>
            <h1>
              🗂️ Project Phases
            </h1>

            <p className="page-description">
              Maintain the Project Phase Master.
              Select an existing Phase ID to view,
              update or delete it, or create a new phase.
            </p>
          </div>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="project-form"
        >
          <div className="form-grid">

            <label>
              Phase ID *

              {isCreateMode ? (
                <input
                  type="text"
                  value={
                    form.phaseid
                  }
                  onChange={
                    handlePhaseIdChange
                  }
                  maxLength={2}
                  placeholder="e.g. 03"
                  disabled={
                    processing
                  }
                  required
                />
              ) : (
                <select
                  value={
                    form.phaseid
                  }
                  onChange={
                    handlePhaseSelection
                  }
                  disabled={
                    loading ||
                    processing
                  }
                >
                  <option value="">
                    {loading
                      ? 'Loading Phases...'
                      : 'Select Phase ID'}
                  </option>

                  {phases.map(
                    (phase) => (
                      <option
                        key={
                          phase.phaseid
                        }
                        value={
                          phase.phaseid
                        }
                      >
                        {phase.phaseid}
                        {' - '}
                        {phase.description}
                      </option>
                    )
                  )}
                </select>
              )}
            </label>

            <label>
              Description *

              <input
                type="text"
                value={
                  form.description
                }
                onChange={
                  handleDescriptionChange
                }
                placeholder="e.g. Development"
                disabled={
                  processing ||
                  mode === 'view'
                }
                required
              />
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '20px'
            }}
          >
            <button
              type="submit"
              disabled={
                processing ||
                loading ||
                mode === 'view' ||
                (
                  isEditMode &&
                  !hasUnsavedChanges
                )
              }
            >
              {processing
                ? '⏳ Processing...'
                : isEditMode
                  ? '💾 Update Phase'
                  : '💾 Save Phase'}
            </button>

            {isEditMode && (
              <button
                type="button"
                className="delete-button"
                onClick={
                  requestDelete
                }
                disabled={
                  processing
                }
              >
                🗑 Delete Phase
              </button>
            )}

            <button
              type="button"
              className="secondary-button"
              onClick={
                handleNewPhase
              }
              disabled={
                processing
              }
            >
              ➕ New Phase
            </button>
          </div>
        </form>
      </div>

      {/* CONFIRMATION */}

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
                  type: '',
                  phaseId: ''
                });
              }
            }
          }
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
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
              width: '100%',
              maxWidth: '440px',
              padding: '28px',
              borderRadius: '14px',
              boxShadow:
                '0 20px 60px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: '52px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor:
                  '#FEF3C7',
                color:
                  '#B45309',
                fontSize: '26px',
                marginBottom: '18px'
              }}
            >
              ⚠
            </div>

            <h2
              style={{
                fontSize: '21px',
                margin:
                  '0 0 12px'
              }}
            >
              {confirmationTitle}
            </h2>

            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.7,
                opacity: 0.8,
                marginBottom:
                  '24px'
              }}
            >
              {confirmationMessage}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setConfirmation({
                    open: false,
                    type: '',
                    phaseId: ''
                  })
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  confirmation.type ===
                  'delete'
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

      {/* SYSTEM ALERT */}

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
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
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
              width: '100%',
              maxWidth: '440px',
              padding: '28px',
              borderRadius: '14px',
              boxShadow:
                '0 20px 60px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: '52px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor:
                  alertStyle.background,
                color:
                  alertStyle.color,
                fontSize: '26px',
                fontWeight: 700,
                marginBottom: '18px'
              }}
            >
              {alertStyle.icon}
            </div>

            <h2
              style={{
                fontSize: '21px',
                margin:
                  '0 0 12px'
              }}
            >
              {alert.title}
            </h2>

            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.7,
                opacity: 0.8,
                marginBottom:
                  '24px'
              }}
            >
              {alert.message}
            </p>

            <div
              style={{
                display: 'flex',
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

export default ProjectPhasesPage;