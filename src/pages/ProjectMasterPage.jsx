import { useEffect, useState } from 'react';

import { authenticatedFetch } from '../api/authenticatedFetch.js';

/* =========================================================
   INITIAL PROJECT FORM
========================================================= */

const initialForm = {
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
  createdby: '',
  updatedby: ''
};

const projectStatuses = [
  { code: 'P', name: 'Planned' },
  { code: 'A', name: 'Active' },
  { code: 'C', name: 'Completed' },
  { code: 'X', name: 'Cancelled' }
];

function ProjectMasterPage() {
  /* =========================================================
     FORM STATE
  ========================================================= */

  const [form, setForm] = useState(initialForm);

  const [projectTypes, setProjectTypes] = useState([]);
  const [businessPartners, setBusinessPartners] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [projectSaved, setProjectSaved] = useState(false);

  /* =========================================================
     CUSTOM CONFIRMATION DIALOG STATE
  ========================================================= */

  const [
    showNewProjectConfirmation,
    setShowNewProjectConfirmation
  ] = useState(false);

  const formLocked = loading || projectSaved;

  /* =========================================================
     LOAD DROPDOWN DATA
  ========================================================= */

  useEffect(() => {
    const loadDropdownData = async () => {
      setDropdownLoading(true);

      try {
        const [
          projectTypesResponse,
          businessPartnersResponse,
          currenciesResponse
        ] = await Promise.all([
          fetch('/api/project-types'),
          fetch('/api/business-partners'),
          fetch('/api/currencies')
        ]);

        if (
          !projectTypesResponse.ok ||
          !businessPartnersResponse.ok ||
          !currenciesResponse.ok
        ) {
          throw new Error(
            'Failed to load dropdown data.'
          );
        }

        const projectTypesResult =
          await projectTypesResponse.json();

        const businessPartnersResult =
          await businessPartnersResponse.json();

        const currenciesResult =
          await currenciesResponse.json();

        setProjectTypes(
          projectTypesResult.projectTypes || []
        );

        setBusinessPartners(
          businessPartnersResult.businessPartners || []
        );

        setCurrencies(
          currenciesResult.currencies || []
        );
      } catch (error) {
        setMessageType('error');

        setMessage(
          `✕ ${
            error.message ||
            'Failed to load Project Master data.'
          }`
        );
      } finally {
        setDropdownLoading(false);
      }
    };

    loadDropdownData();
  }, []);

  /* =========================================================
     CLOSE CONFIRMATION DIALOG USING ESCAPE
  ========================================================= */

  useEffect(() => {
    if (!showNewProjectConfirmation) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNewProjectConfirmation(false);
      }
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
  }, [showNewProjectConfirmation]);

  /* =========================================================
     STANDARD FIELD CHANGES
  ========================================================= */

  const handleChange = (event) => {
    if (formLocked) {
      return;
    }

    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value
    }));

    setMessage('');
    setMessageType('');
  };

  /* =========================================================
     PROJECT CODE
  ========================================================= */

  const handleProjectCodeChange = (event) => {
    if (formLocked) {
      return;
    }

    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);

    setForm((previousForm) => ({
      ...previousForm,
      projectcode: value
    }));

    setMessage('');
    setMessageType('');
  };

  /* =========================================================
     VERSION ID
  ========================================================= */

  const handleVersionChange = (event) => {
    if (formLocked) {
      return;
    }

    const value = event.target.value
      .replace(/[^0-9]/g, '')
      .slice(0, 2);

    setForm((previousForm) => ({
      ...previousForm,
      versionid: value
    }));

    setMessage('');
    setMessageType('');
  };

  /* =========================================================
     SAVE PROJECT
     AUTHENTICATED + CSRF PROTECTED
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      loading ||
      projectSaved ||
      dropdownLoading
    ) {
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await authenticatedFetch(
        '/api/projects',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(form)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          'Failed to save project.'
        );
      }

      /*
       * Retain saved values.
       * Prevent duplicate submissions.
       */

      setProjectSaved(true);

      setMessageType('success');

      setMessage(
        `✓ Project ${form.projectcode} (Version ${form.versionid}) saved successfully.`
      );
    } catch (error) {
      /*
       * Retain all entered data on error.
       */

      setMessageType('error');

      setMessage(
        `✕ ${
          error.message ||
          'Something went wrong while saving.'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CLEAR PROJECT FORM
  ========================================================= */

  const clearProjectForm = () => {
    setForm({
      ...initialForm
    });

    setProjectSaved(false);

    setMessage('');
    setMessageType('');

    setShowNewProjectConfirmation(false);
  };

  /* =========================================================
     NEW PROJECT BUTTON
  ========================================================= */

  const handleNewProject = () => {
    if (loading) {
      return;
    }

    /*
     * A saved project can be cleared without a
     * warning because its data is already stored.
     */

    if (projectSaved) {
      clearProjectForm();
      return;
    }

    /*
     * Check whether the user has entered
     * any unsaved information.
     */

    const hasEnteredData = Object.values(
      form
    ).some(
      (value) =>
        String(value).trim() !== ''
    );

    /*
     * An empty form does not need confirmation.
     */

    if (!hasEnteredData) {
      clearProjectForm();
      return;
    }

    /*
     * Display the custom PPBMA confirmation modal.
     */

    setShowNewProjectConfirmation(true);
  };

  /* =========================================================
     CANCEL NEW PROJECT
  ========================================================= */

  const handleCancelNewProject = () => {
    setShowNewProjectConfirmation(false);
  };

  /* =========================================================
     CONFIRM NEW PROJECT
  ========================================================= */

  const handleConfirmNewProject = () => {
    clearProjectForm();
  };

  /* =========================================================
     USER INTERFACE
  ========================================================= */

  return (
    <div className="page-wrap">
      <div className="card">
        <h1>📋 Project Master</h1>

        {/* =================================================
            SAVED PROJECT INFORMATION
        ================================================= */}

        {projectSaved && (
          <div
            className="project-summary"
            style={{
              marginBottom: '20px'
            }}
          >
            <div className="summary-item">
              <span>
                Project Code
              </span>

              <strong>
                {form.projectcode}
              </strong>
            </div>

            <div className="summary-item">
              <span>
                Version ID
              </span>

              <strong>
                {form.versionid}
              </strong>
            </div>

            <div className="summary-item">
              <span>
                Project Name
              </span>

              <strong>
                {form.projectname}
              </strong>
            </div>

            <div className="summary-item">
              <span>
                Save Status
              </span>

              <strong>
                ✓ Saved
              </strong>
            </div>
          </div>
        )}

        {/* =================================================
            PROJECT FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="project-form"
        >
          <div className="form-grid">

            {/* PROJECT CODE */}

            <label>
              Project Code *

              <input
                name="projectcode"
                maxLength={10}
                value={form.projectcode}
                onChange={handleProjectCodeChange}
                placeholder="e.g. PRJ001"
                disabled={formLocked}
                required
              />
            </label>

            {/* VERSION ID */}

            <label>
              Version ID *

              <input
                name="versionid"
                maxLength={2}
                value={form.versionid}
                onChange={handleVersionChange}
                placeholder="e.g. 01"
                disabled={formLocked}
                required
              />
            </label>

            {/* PROJECT NAME */}

            <label className="full-width">
              Project Name *

              <input
                name="projectname"
                maxLength={50}
                value={form.projectname}
                onChange={handleChange}
                placeholder="Enter project name"
                disabled={formLocked}
                required
              />
            </label>

            {/* PROJECT DESCRIPTION */}

            <label className="full-width">
              Project Description

              <textarea
                name="projectdescription"
                maxLength={500}
                value={form.projectdescription}
                onChange={handleChange}
                placeholder="Enter project description"
                rows={4}
                disabled={formLocked}
              />
            </label>

            {/* PROJECT TYPE */}

            <label>
              Project Type

              <select
                name="projecttype"
                value={form.projecttype}
                onChange={handleChange}
                disabled={
                  dropdownLoading ||
                  formLocked
                }
              >
                <option value="">
                  Select Project Type
                </option>

                {projectTypes.map((type) => (
                  <option
                    key={type.projecttype}
                    value={type.projecttype}
                  >
                    {type.projecttype} - {type.description}
                  </option>
                ))}
              </select>
            </label>

            {/* BUSINESS PARTNER */}

            <label>
              Business Partner

              <select
                name="partnerid"
                value={form.partnerid}
                onChange={handleChange}
                disabled={
                  dropdownLoading ||
                  formLocked
                }
              >
                <option value="">
                  Select Business Partner
                </option>

                {businessPartners.map((partner) => (
                  <option
                    key={partner.partnerid}
                    value={partner.partnerid}
                  >
                    {partner.partnerid} - {partner.description}
                  </option>
                ))}
              </select>
            </label>

            {/* CURRENCY */}

            <label>
              Currency

              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                disabled={
                  dropdownLoading ||
                  formLocked
                }
              >
                <option value="">
                  Select Currency
                </option>

                {currencies.map((currency) => (
                  <option
                    key={currency.currcode}
                    value={currency.currcode}
                  >
                    {currency.currcode} - {currency.description}
                  </option>
                ))}
              </select>
            </label>

            {/* STATUS */}

            <label>
              Status

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={formLocked}
              >
                <option value="">
                  Select Status
                </option>

                {projectStatuses.map((status) => (
                  <option
                    key={status.code}
                    value={status.code}
                  >
                    {status.code} - {status.name}
                  </option>
                ))}
              </select>
            </label>

            {/* LOCATION */}

            <label>
              Location

              <input
                name="location"
                maxLength={20}
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Colombo"
                disabled={formLocked}
              />
            </label>

            {/* REGION */}

            <label>
              Region

              <input
                name="region"
                maxLength={20}
                value={form.region}
                onChange={handleChange}
                placeholder="e.g. APAC"
                disabled={formLocked}
              />
            </label>

            {/* CREATED BY */}

            <label>
              Created By

              <input
                name="createdby"
                maxLength={10}
                value={form.createdby}
                onChange={handleChange}
                placeholder="Created by"
                disabled={formLocked}
              />
            </label>

            {/* UPDATED BY */}

            <label>
              Updated By

              <input
                name="updatedby"
                maxLength={10}
                value={form.updatedby}
                onChange={handleChange}
                placeholder="Updated by"
                disabled={formLocked}
              />
            </label>
          </div>

          {/* =================================================
              FORM ACTIONS
          ================================================= */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '20px'
            }}
          >
            <button
              type="submit"
              disabled={
                loading ||
                dropdownLoading ||
                projectSaved
              }
            >
              {loading
                ? '⏳ Saving...'
                : projectSaved
                  ? '✓ Project Saved'
                  : '💾 Save Project'}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleNewProject}
              disabled={loading}
            >
              ➕ New Project
            </button>
          </div>
        </form>

        {/* =================================================
            SUCCESS OR ERROR MESSAGE
        ================================================= */}

        {message && (
          <p
            className={`message message-${messageType}`}
          >
            {message}
          </p>
        )}

        {/* =================================================
            SAVED PROJECT GUIDANCE
        ================================================= */}

        {projectSaved && (
          <p
            className="page-description"
            style={{
              marginTop: '12px'
            }}
          >
            The project details have been saved.
            Click New Project to create another project.
          </p>
        )}
      </div>

      {/* =====================================================
          CUSTOM NEW PROJECT CONFIRMATION MODAL
      ===================================================== */}

      {showNewProjectConfirmation && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              handleCancelNewProject();
            }
          }}
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
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-dialog-title"
            aria-describedby="new-project-dialog-description"
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
            {/* WARNING ICON */}

            <div
              aria-hidden="true"
              style={{
                width: '52px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                fontSize: '26px',
                marginBottom: '18px'
              }}
            >
              ⚠
            </div>

            {/* DIALOG TITLE */}

            <h2
              id="new-project-dialog-title"
              style={{
                fontSize: '21px',
                fontWeight: 700,
                margin: '0 0 12px'
              }}
            >
              Start a New Project?
            </h2>

            {/* DIALOG DESCRIPTION */}

            <p
              id="new-project-dialog-description"
              style={{
                fontSize: '14px',
                lineHeight: 1.7,
                opacity: 0.8,
                marginBottom: '24px'
              }}
            >
              You have unsaved project information.
              Starting a new project will clear all
              the information currently entered
              in this form.
            </p>

            {/* DIALOG ACTION BUTTONS */}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={handleCancelNewProject}
                autoFocus
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmNewProject}
              >
                Clear &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectMasterPage;