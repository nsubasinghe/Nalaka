import { useEffect, useState } from 'react';

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
  const [form, setForm] = useState(initialForm);

  const [projectTypes, setProjectTypes] = useState([]);
  const [businessPartners, setBusinessPartners] = useState([]);
  const [currencies, setCurrencies] = useState([]);

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
          throw new Error('Failed to load dropdown data.');
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value
    }));
  };

  const handleProjectCodeChange = (event) => {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    setForm((previousForm) => ({
      ...previousForm,
      projectcode: value
    }));
  };

  const handleVersionChange = (event) => {
    const value = event.target.value
      .replace(/[^0-9]/g, '')
      .slice(0, 2);

    setForm((previousForm) => ({
      ...previousForm,
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
          result.error || 'Failed to save project.'
        );
      }

      setMessageType('success');
      setMessage('✓ Project saved successfully.');

      setForm(initialForm);

      setTimeout(() => {
        setMessage('');
      }, 4000);
    } catch (error) {
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

  return (
    <div className="page-wrap">
      <div className="card">
        <h1>📋 Project Master</h1>

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
                placeholder="e.g. PRJ001"
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
                placeholder="e.g. 01"
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
              <textarea
                name="projectdescription"
                maxLength={500}
                value={form.projectdescription}
                onChange={handleChange}
                placeholder="Enter project description"
                rows={4}
              />
            </label>

            <label>
              Project Type
              <select
                name="projecttype"
                value={form.projecttype}
                onChange={handleChange}
                disabled={dropdownLoading}
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

            <label>
              Business Partner
              <select
                name="partnerid"
                value={form.partnerid}
                onChange={handleChange}
                disabled={dropdownLoading}
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

            <label>
              Currency
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                disabled={dropdownLoading}
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

            <label>
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
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

            <label>
              Location
              <input
                name="location"
                maxLength={20}
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Colombo"
              />
            </label>

            <label>
              Region
              <input
                name="region"
                maxLength={20}
                value={form.region}
                onChange={handleChange}
                placeholder="e.g. APAC"
              />
            </label>

            <label>
              Created By
              <input
                name="createdby"
                maxLength={10}
                value={form.createdby}
                onChange={handleChange}
                placeholder="Created by"
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
          <p
            className={`message message-${messageType}`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProjectMasterPage;