import { useEffect, useState } from 'react';

const initialForm = {
  projectcode: '',
  versionid: '',
  projectname: '',
  projectdescription: '',
  projecttype: '',
  customerid: '',
  currency: '',
  status: '',
  createdby: '',
  updatedby: ''
};

function ProjectMasterPage() {
  const [form, setForm] = useState(initialForm);

  const [projectTypes, setProjectTypes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    const loadDropdownData = async () => {
      setDropdownLoading(true);

      try {
        const [
          projectTypesResponse,
          customersResponse,
          currenciesResponse,
          statusesResponse
        ] = await Promise.all([
          fetch('/api/project-types'),
          fetch('/api/customers'),
          fetch('/api/currencies'),
          fetch('/api/statuses')
        ]);

        if (
          !projectTypesResponse.ok ||
          !customersResponse.ok ||
          !currenciesResponse.ok ||
          !statusesResponse.ok
        ) {
          throw new Error('Failed to load dropdown data');
        }

        const projectTypesResult = await projectTypesResponse.json();
        const customersResult = await customersResponse.json();
        const currenciesResult = await currenciesResponse.json();
        const statusesResult = await statusesResponse.json();

        setProjectTypes(projectTypesResult.projectTypes || []);
        setCustomers(customersResult.customers || []);
        setCurrencies(currenciesResult.currencies || []);
        setStatuses(statusesResult.statuses || []);
      } catch (error) {
        setMessageType('error');
        setMessage(
          `✕ ${error.message || 'Failed to load form data'}`
        );
      } finally {
        setDropdownLoading(false);
      }
    };

    loadDropdownData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProjectCodeChange = (event) => {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    setForm((prev) => ({
      ...prev,
      projectcode: value
    }));
  };

  const handleVersionChange = (event) => {
    const value = event.target.value.replace(
      /[^0-9]/g,
      ''
    );

    setForm((prev) => ({
      ...prev,
      versionid: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Failed to save project'
        );
      }

      setMessageType('success');
      setMessage('✓ Project saved successfully!');

      setForm(initialForm);

      setTimeout(() => {
        setMessage('');
      }, 4000);
    } catch (error) {
      setMessageType('error');
      setMessage(
        `✕ ${error.message || 'Something went wrong'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="card">
        <h1>📋 ProjectMaster</h1>

        <form
          onSubmit={handleSubmit}
          className="project-form"
        >
          <div className="form-grid">
            <label>
              Project Code *
              <input
                name="projectcode"
                maxLength={10}
                value={form.projectcode}
                onChange={handleProjectCodeChange}
                placeholder="e.g., PRJ001"
                required
              />
            </label>

            <label>
              Version ID *
              <input
                name="versionid"
                maxLength={2}
                value={form.versionid}
                onChange={handleVersionChange}
                placeholder="e.g., 01"
                required
              />
            </label>

            <label className="full-width">
              Project Name *
              <input
                name="projectname"
                maxLength={50}
                value={form.projectname}
                onChange={handleChange}
                placeholder="Enter project name"
                required
              />
            </label>

            <label className="full-width">
              Project Description
              <input
                name="projectdescription"
                maxLength={50}
                value={form.projectdescription}
                onChange={handleChange}
                placeholder="Brief description of the project"
              />
            </label>

            <label>
              Project Type *
              <select
                name="projecttype"
                value={form.projecttype}
                onChange={handleChange}
                disabled={dropdownLoading}
                required
              >
                <option value="">
                  Select Project Type
                </option>

                {projectTypes.map((type) => (
                  <option
                    key={type.projecttypeid}
                    value={type.projecttypeid}
                  >
                    {type.projecttypeid} - {type.projecttypename}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Customer ID *
              <select
                name="customerid"
                value={form.customerid}
                onChange={handleChange}
                disabled={dropdownLoading}
                required
              >
                <option value="">
                  Select Business Partner
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.partnerid}
                    value={customer.partnerid}
                  >
                    {customer.partnerid} - {customer.description}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Currency *
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                disabled={dropdownLoading}
                required
              >
                <option value="">
                  Select Currency
                </option>

                {currencies.map((currency) => (
                  <option
                    key={currency.currencycode}
                    value={currency.currencycode}
                  >
                    {currency.currencycode} - {currency.currencyname}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Status *
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={dropdownLoading}
                required
              >
                <option value="">
                  Select Status
                </option>

                {statuses.map((status) => (
                  <option
                    key={status.statuscode}
                    value={status.statuscode}
                  >
                    {status.statuscode} - {status.statusname}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Created By
              <input
                name="createdby"
                maxLength={10}
                value={form.createdby}
                onChange={handleChange}
                placeholder="Your name"
              />
            </label>

            <label>
              Updated By
              <input
                name="updatedby"
                maxLength={10}
                value={form.updatedby}
                onChange={handleChange}
                placeholder="Updated by"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || dropdownLoading}
          >
            {loading
              ? '⏳ Saving...'
              : '💾 Save Project'}
          </button>
        </form>

        {message && (
          <p className={`message message-${messageType}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProjectMasterPage;