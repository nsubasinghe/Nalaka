import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  authenticatedFetch
} from '../api/authenticatedFetch.js';

/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm = {
  partnerid: '',
  description: ''
};

function BusinessPartnerPage() {
  /* =========================================================
     DATA
  ========================================================= */

  const [
    businessPartners,
    setBusinessPartners
  ] = useState([]);

  /* =========================================================
     FORM
  ========================================================= */

  const [
    form,
    setForm
  ] = useState(initialForm);

  const [
    originalForm,
    setOriginalForm
  ] = useState(initialForm);

  const [
    mode,
    setMode
  ] = useState('view');

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    listLoading,
    setListLoading
  ] = useState(true);

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
     DERIVED STATE
  ========================================================= */

  const isCreateMode =
    mode === 'create';

  const isEditMode =
    mode === 'edit';

  const hasUnsavedChanges =
    useMemo(
      () =>
        JSON.stringify(form) !==
        JSON.stringify(originalForm),
      [
        form,
        originalForm
      ]
    );

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
     LOAD BUSINESS PARTNERS
  ========================================================= */

  const loadBusinessPartners =
    async () => {
      setListLoading(true);

      try {
        const response =
          await fetch(
            '/api/business-partners'
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Failed to load Business Partners.'
          );
        }

        const partners =
          result.businessPartners || [];

        setBusinessPartners(
          partners
        );

        return partners;

      } catch (error) {
        showAlert(
          'error',
          'Unable to Load Business Partners',
          error.message ||
            'Failed to load Business Partners.'
        );

        return [];

      } finally {
        setListLoading(false);
      }
    };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadBusinessPartners();
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
          event.key !== 'Escape'
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
     LOAD SELECTED PARTNER
  ========================================================= */

  const loadPartner =
    (partnerId) => {
      const partner =
        businessPartners.find(
          (item) =>
            String(
              item.partnerid
            ) ===
            String(
              partnerId
            )
        );

      if (!partner) {
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
        partnerid:
          partner.partnerid || '',

        description:
          partner.description || ''
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
     PARTNER DROPDOWN
  ========================================================= */

  const handlePartnerSelection =
    (event) => {
      const partnerId =
        event.target.value;

      if (
        partnerId ===
        form.partnerid
      ) {
        return;
      }

      if (hasUnsavedChanges) {
        setConfirmation({
          open: true,
          type: `switch:${partnerId}`
        });

        return;
      }

      if (!partnerId) {
        resetToViewMode();
        return;
      }

      loadPartner(
        partnerId
      );
    };

  /* =========================================================
     NEW PARTNER ID
  ========================================================= */

  const handlePartnerIdChange =
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
            10
          );

      setForm(
        (previous) => ({
          ...previous,
          partnerid:
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
     RESET
  ========================================================= */

  const resetToViewMode =
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
        type: ''
      });
    };

  const startNewPartner =
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
        type: ''
      });
    };

  /* =========================================================
     VALIDATE
  ========================================================= */

  const validateForm =
    () => {
      const partnerid =
        form.partnerid.trim();

      const description =
        form.description.trim();

      if (!partnerid) {
        showAlert(
          'error',
          'Partner ID Required',
          'Partner ID is required.'
        );

        return false;
      }

      if (
        !/^[A-Z0-9]{1,10}$/.test(
          partnerid
        )
      ) {
        showAlert(
          'error',
          'Invalid Partner ID',
          'Partner ID must contain only letters and numbers and cannot exceed 10 characters.'
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
        description.length > 50
      ) {
        showAlert(
          'error',
          'Description Too Long',
          'Description cannot exceed 50 characters.'
        );

        return false;
      }

      if (
        isCreateMode &&
        businessPartners.some(
          (partner) =>
            String(
              partner.partnerid
            ).toUpperCase() ===
            partnerid.toUpperCase()
        )
      ) {
        showAlert(
          'error',
          'Duplicate Partner ID',
          'Partner ID already exists.'
        );

        return false;
      }

      return true;
    };

  /* =========================================================
     CREATE / UPDATE
  ========================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        loading ||
        listLoading ||
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
          'No Business Partner changes have been made.'
        );

        return;
      }

      if (!validateForm()) {
        return;
      }

      setLoading(true);

      try {
        const partnerid =
          form.partnerid.trim();

        const description =
          form.description.trim();

        const response =
          await authenticatedFetch(
            isEditMode
              ? `/api/business-partners/${encodeURIComponent(
                  partnerid
                )}`
              : '/api/business-partners',
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
                JSON.stringify({
                  partnerid,
                  description
                })
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              (
                isEditMode
                  ? 'Failed to update Business Partner.'
                  : 'Failed to save Business Partner.'
              )
          );
        }

        const refreshedPartners =
          await loadBusinessPartners();

        const savedPartner =
          refreshedPartners.find(
            (partner) =>
              String(
                partner.partnerid
              ) ===
              String(
                partnerid
              )
          );

        if (savedPartner) {
          const nextForm = {
            partnerid:
              savedPartner.partnerid,

            description:
              savedPartner.description || ''
          };

          setForm(
            nextForm
          );

          setOriginalForm(
            nextForm
          );

          setMode('edit');
        }

        showAlert(
          'success',
          isEditMode
            ? 'Business Partner Updated'
            : 'Business Partner Saved',
          isEditMode
            ? `Business Partner ${partnerid} was updated successfully.`
            : `Business Partner ${partnerid} was saved successfully.`
        );

      } catch (error) {
        showAlert(
          'error',
          isEditMode
            ? 'Update Failed'
            : 'Save Failed',
          error.message ||
            'Something went wrong.'
        );

      } finally {
        setLoading(false);
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
        type: 'delete'
      });
    };

  const deletePartner =
    async () => {
      const partnerId =
        form.partnerid;

      setConfirmation({
        open: false,
        type: ''
      });

      setLoading(true);

      try {
        const response =
          await authenticatedFetch(
            `/api/business-partners/${encodeURIComponent(
              partnerId
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
              'Failed to delete Business Partner.'
          );
        }

        await loadBusinessPartners();

        resetToViewMode();

        showAlert(
          'success',
          'Business Partner Deleted',
          `Business Partner ${partnerId} was deleted successfully.`
        );

      } catch (error) {
        showAlert(
          'error',
          'Delete Failed',
          error.message ||
            'Failed to delete Business Partner.'
        );

      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     NEW PARTNER
  ========================================================= */

  const handleNewPartner =
    () => {
      if (loading) {
        return;
      }

      if (hasUnsavedChanges) {
        setConfirmation({
          open: true,
          type: 'new'
        });

        return;
      }

      startNewPartner();
    };

  /* =========================================================
     CONFIRM ACTION
  ========================================================= */

  const handleConfirmAction =
    () => {
      if (
        confirmation.type ===
        'delete'
      ) {
        deletePartner();
        return;
      }

      if (
        confirmation.type ===
        'new'
      ) {
        startNewPartner();
        return;
      }

      if (
        confirmation.type.startsWith(
          'switch:'
        )
      ) {
        const partnerId =
          confirmation.type.replace(
            'switch:',
            ''
          );

        setConfirmation({
          open: false,
          type: ''
        });

        if (partnerId) {
          loadPartner(
            partnerId
          );
        } else {
          resetToViewMode();
        }
      }
    };

  /* =========================================================
     CONFIRMATION CONTENT
  ========================================================= */

  const confirmationTitle =
    confirmation.type === 'delete'
      ? 'Delete Business Partner?'
      : confirmation.type === 'new'
        ? 'Start a New Business Partner?'
        : 'Switch Business Partner?';

  const confirmationMessage =
    confirmation.type === 'delete'
      ? `Business Partner ${form.partnerid} will be permanently deleted. This action may be blocked if the partner is already used by a project.`
      : confirmation.type === 'new'
        ? 'You have unsaved Business Partner changes. Starting a new record will discard them.'
        : 'You have unsaved Business Partner changes. Selecting another Partner ID will discard them.';

  const confirmationButton =
    confirmation.type === 'delete'
      ? 'Delete'
      : confirmation.type === 'new'
        ? 'Discard & Start New'
        : 'Discard & Switch';

  /* =========================================================
     ALERT STYLE
  ========================================================= */

  const alertStyle =
    alert.type === 'success'
      ? {
          icon: '✓',
          background:
            '#DCFCE7',
          color:
            '#166534'
        }
      : alert.type === 'error'
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

        <div className="page-heading">
          <div>
            <h1>
              🤝 Business Partner
            </h1>

            <p className="page-description">
              Select an existing Partner ID to view,
              update or delete the Business Partner,
              or create a new Business Partner.
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

            {/* PARTNER ID */}

            <label>
              Partner ID *

              {isCreateMode ? (
                <input
                  name="partnerid"
                  value={
                    form.partnerid
                  }
                  onChange={
                    handlePartnerIdChange
                  }
                  maxLength={10}
                  placeholder="e.g. BP0001"
                  disabled={
                    loading
                  }
                  required
                />
              ) : (
                <select
                  value={
                    form.partnerid
                  }
                  onChange={
                    handlePartnerSelection
                  }
                  disabled={
                    loading ||
                    listLoading
                  }
                >
                  <option value="">
                    {listLoading
                      ? 'Loading Business Partners...'
                      : 'Select Partner ID'}
                  </option>

                  {businessPartners.map(
                    (partner) => (
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
              )}
            </label>

            {/* DESCRIPTION */}

            <label>
              Description *

              <input
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleDescriptionChange
                }
                maxLength={50}
                placeholder="Enter Business Partner description"
                disabled={
                  loading ||
                  mode === 'view'
                }
                required
              />
            </label>
          </div>

          {/* ACTION BUTTONS */}

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
                listLoading ||
                mode === 'view' ||
                (
                  isEditMode &&
                  !hasUnsavedChanges
                )
              }
            >
              {loading
                ? '⏳ Processing...'
                : isEditMode
                  ? '💾 Update Business Partner'
                  : '💾 Save Business Partner'}
            </button>

            {isEditMode && (
              <button
                type="button"
                className="delete-button"
                onClick={
                  requestDelete
                }
                disabled={
                  loading
                }
              >
                🗑 Delete Business Partner
              </button>
            )}

            <button
              type="button"
              className="secondary-button"
              onClick={
                handleNewPartner
              }
              disabled={
                loading
              }
            >
              ➕ New Business Partner
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
                autoFocus
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

export default BusinessPartnerPage;