import { useEffect, useMemo, useState } from 'react';

const initialForm = {
  projectkey: '',
  budgetamount: '',
  actualcost: '',
  billingamount: '',
  currcode: ''
};

function ProjectFIPage() {
  const [projects, setProjects] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [financialRecords, setFinancialRecords] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const selectedProject = useMemo(() => {
    return projects.find(
      (project) =>
        `${project.projectcode}::${project.versionid}` === form.projectkey
    );
  }, [projects, form.projectkey]);

  const loadPageData = async ({
    preserveMessage = false
  } = {}) => {
    setLoading(true);

    if (!preserveMessage) {
      setMessage('');
      setMessageType('');
    }

    try {
      const [
        projectsResponse,
        currenciesResponse,
        financialResponse
      ] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/currencies'),
        fetch('/api/project-fi')
      ]);

      const [
        projectsResult,
        currenciesResult,
        financialResult
      ] = await Promise.all([
        projectsResponse.json(),
        currenciesResponse.json(),
        financialResponse.json()
      ]);

      if (!projectsResponse.ok) {
        throw new Error(
          projectsResult.error ||
            'Failed to load projects.'
        );
      }

      if (!currenciesResponse.ok) {
        throw new Error(
          currenciesResult.error ||
            'Failed to load currencies.'
        );
      }

      if (!financialResponse.ok) {
        throw new Error(
          financialResult.error ||
            'Failed to load financial information.'
        );
      }

      setProjects(
        projectsResult.projects || []
      );

      setCurrencies(
        currenciesResult.currencies || []
      );

      setFinancialRecords(
  financialResult.projectFinancials || []
);

    } catch (error) {
      setMessageType('error');

      setMessage(
        `✕ ${
          error.message ||
          'Failed to load Project Financial Information.'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setMessage('');
    setMessageType('');
  };

  const handleProjectChange = (event) => {
    const projectkey = event.target.value;

    const project = projects.find(
      (item) =>
        `${item.projectcode}::${item.versionid}` === projectkey
    );

    const existingRecord = financialRecords.find(
      (record) =>
        record.projectcode === project?.projectcode &&
        record.versionid === project?.versionid
    );

    setForm({
      projectkey,
      budgetamount:
        existingRecord?.budgetamount ?? '',
      actualcost:
        existingRecord?.actualcost ?? '',
      billingamount:
        existingRecord?.billingamount ?? '',
      currcode:
        existingRecord?.currcode ||
        project?.currency ||
        ''
    });

    setMessage('');
    setMessageType('');

    if (existingRecord) {
      setMessageType('success');
      setMessage(
        '✓ Existing financial information loaded. You can update the values and save again.'
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');
    setMessageType('');

    if (!selectedProject) {
      setMessageType('error');
      setMessage(
        '✕ Please select a project.'
      );
      return;
    }

    if (!form.currcode) {
      setMessageType('error');
      setMessage(
        '✕ Currency is required.'
      );
      return;
    }

    const budgetAmount =
      form.budgetamount === ''
        ? null
        : Number(form.budgetamount);

    const actualCost =
      form.actualcost === ''
        ? null
        : Number(form.actualcost);

    const billingAmount =
      form.billingamount === ''
        ? null
        : Number(form.billingamount);

    if (
      budgetAmount !== null &&
      Number.isNaN(budgetAmount)
    ) {
      setMessageType('error');
      setMessage(
        '✕ Budget Amount must be a valid number.'
      );
      return;
    }

    if (
      actualCost !== null &&
      Number.isNaN(actualCost)
    ) {
      setMessageType('error');
      setMessage(
        '✕ Actual Cost must be a valid number.'
      );
      return;
    }

    if (
      billingAmount !== null &&
      Number.isNaN(billingAmount)
    ) {
      setMessageType('error');
      setMessage(
        '✕ Billing Amount must be a valid number.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/project-fi',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            projectcode:
              selectedProject.projectcode,
            versionid:
              selectedProject.versionid,
            budgetamount: budgetAmount,
            actualcost: actualCost,
            billingamount: billingAmount,
            currcode: form.currcode
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to save financial information.'
        );
      }

      await loadPageData({
        preserveMessage: true
      });

      setMessageType('success');
      setMessage(
        '✓ Project Financial Information saved successfully.'
      );
    } catch (error) {
      setMessageType('error');

      setMessage(
        `✕ ${
          error.message ||
          'Failed to save financial information.'
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setForm(initialForm);
    setMessage('');
    setMessageType('');
  };

  return (
    <div className="page-wrap">
      <div className="card">
        <div className="page-heading">
          <div>
            <h1>💰 Project Financial Information</h1>

            <p className="page-description">
              Maintain project budget, actual cost,
              billing amount and currency information.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Project *
              <select
                name="projectkey"
                value={form.projectkey}
                onChange={handleProjectChange}
                disabled={loading || saving}
              >
                <option value="">
                  {loading
                    ? 'Loading Projects...'
                    : 'Select Project'}
                </option>

                {projects.map((project) => (
                  <option
                    key={`${project.projectcode}-${project.versionid}`}
                    value={`${project.projectcode}::${project.versionid}`}
                  >
                    {project.projectcode}
                    {' - '}
                    {project.projectname}
                    {' - V'}
                    {project.versionid}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Project Code
              <input
                value={
                  selectedProject?.projectcode || ''
                }
                readOnly
                placeholder="Auto"
              />
            </label>

            <label>
              Version ID
              <input
                value={
                  selectedProject?.versionid || ''
                }
                readOnly
                placeholder="Auto"
              />
            </label>

            <label>
              Budget Amount
              <input
                type="number"
                name="budgetamount"
                min="0"
                step="0.01"
                value={form.budgetamount}
                onChange={handleChange}
                placeholder="0.00"
                disabled={saving}
              />
            </label>

            <label>
              Actual Cost
              <input
                type="number"
                name="actualcost"
                min="0"
                step="0.01"
                value={form.actualcost}
                onChange={handleChange}
                placeholder="0.00"
                disabled={saving}
              />
            </label>

            <label>
              Billing Amount
              <input
                type="number"
                name="billingamount"
                min="0"
                step="0.01"
                value={form.billingamount}
                onChange={handleChange}
                placeholder="0.00"
                disabled={saving}
              />
            </label>

            <label>
              Currency *
              <select
                name="currcode"
                value={form.currcode}
                onChange={handleChange}
                disabled={loading || saving}
              >
                <option value="">
                  Select Currency
                </option>

                {currencies.map((currency) => (
                  <option
                    key={currency.currcode}
                    value={currency.currcode}
                  >
                    {currency.currcode}
                    {' - '}
                    {currency.description}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedProject && (
            <div className="project-summary">
              <div className="summary-item">
                <span>Project</span>
                <strong>
                  {selectedProject.projectname || '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>Location</span>
                <strong>
                  {selectedProject.location || '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>Region</span>
                <strong>
                  {selectedProject.region || '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>Project Currency</span>
                <strong>
                  {selectedProject.currency || '-'}
                </strong>
              </div>
            </div>
          )}

          <div className="phase-form-actions">
            <button
              type="submit"
              disabled={saving || loading}
            >
              {saving
                ? '⏳ Saving...'
                : '💾 Save Financial Information'}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleClear}
              disabled={saving}
            >
              Clear
            </button>
          </div>
        </form>

        {message && (
          <p
            className={`message message-${messageType}`}
          >
            {message}
          </p>
        )}

        <div className="project-plan-entry-section">
          <h2>
            Existing Financial Records
          </h2>

          {loading ? (
            <p>
              Loading financial records...
            </p>
          ) : financialRecords.length === 0 ? (
            <p>
              No financial records found.
            </p>
          ) : (
            <div className="project-entry-grid-wrap">
              <table className="project-entry-grid">
                <thead>
                  <tr>
                    <th>Project Code</th>
                    <th>Version</th>
                    <th>Budget Amount</th>
                    <th>Actual Cost</th>
                    <th>Billing Amount</th>
                    <th>Currency</th>
                  </tr>
                </thead>

                <tbody>
                  {financialRecords.map(
                    (record) => (
                      <tr
                        key={`${record.projectcode}-${record.versionid}`}
                      >
                        <td>
                          {record.projectcode}
                        </td>

                        <td>
                          {record.versionid}
                        </td>

                        <td>
                          {record.budgetamount ?? '-'}
                        </td>

                        <td>
                          {record.actualcost ?? '-'}
                        </td>

                        <td>
                          {record.billingamount ?? '-'}
                        </td>

                        <td>
                          {record.currcode || '-'}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectFIPage;