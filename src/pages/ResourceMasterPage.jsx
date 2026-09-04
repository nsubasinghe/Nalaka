import { useEffect, useState } from 'react';

const initialForm = {
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
  const [form, setForm] = useState(initialForm);

  const [resourceTypes, setResourceTypes] =
    useState([]);

  const [projectRoles, setProjectRoles] =
    useState([]);

  const [currencies, setCurrencies] =
    useState([]);

  const [resources, setResources] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [messageType, setMessageType] =
    useState('');

  const loadPageData = async () => {
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const [
        resourceTypesResponse,
        projectRolesResponse,
        currenciesResponse,
        resourcesResponse
      ] = await Promise.all([
        fetch('/api/resource-types'),
        fetch('/api/project-roles'),
        fetch('/api/currencies'),
        fetch('/api/resources')
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

      if (!resourceTypesResponse.ok) {
        throw new Error(
          resourceTypesResult.error ||
            'Failed to load resource types.'
        );
      }

      if (!projectRolesResponse.ok) {
        throw new Error(
          projectRolesResult.error ||
            'Failed to load project roles.'
        );
      }

      if (!currenciesResponse.ok) {
        throw new Error(
          currenciesResult.error ||
            'Failed to load currencies.'
        );
      }

      if (!resourcesResponse.ok) {
        throw new Error(
          resourcesResult.error ||
            'Failed to load resources.'
        );
      }

      setResourceTypes(
        resourceTypesResult.resourceTypes || []
      );

      setProjectRoles(
        projectRolesResult.projectRoles || []
      );

      setCurrencies(
        currenciesResult.currencies || []
      );

      setResources(
        resourcesResult.resources || []
      );
    } catch (error) {
      setMessageType('error');

      setMessage(
        `✕ ${
          error.message ||
          'Failed to load Resource Master data.'
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
    const {
      name,
      value
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setMessage('');
    setMessageType('');
  };

  const resetForm = () => {
    setForm(initialForm);
    setMessage('');
    setMessageType('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');
    setMessageType('');

    if (!form.resourceid.trim()) {
      setMessageType('error');
      setMessage(
        '✕ Resource ID is required.'
      );
      return;
    }

    if (!form.firstname.trim()) {
      setMessageType('error');
      setMessage(
        '✕ First Name is required.'
      );
      return;
    }

    if (!form.resourcetype) {
      setMessageType('error');
      setMessage(
        '✕ Resource Type is required.'
      );
      return;
    }

    if (!form.internalroleid) {
      setMessageType('error');
      setMessage(
        '✕ Internal Role is required.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/resources',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            resourceid:
              form.resourceid.trim(),

            firstname:
              form.firstname.trim(),

            lastname:
              form.lastname.trim(),

            resourcetype:
              form.resourcetype,

            internalroleid:
              form.internalroleid,

            location:
              form.location.trim(),

            billrate:
              form.billrate === ''
                ? null
                : Number(form.billrate),

            currcode:
              form.currcode || null,

            cost2co:
              form.cost2co === ''
                ? null
                : Number(form.cost2co)
          })
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to save resource.'
        );
      }

      setMessageType('success');

      setMessage(
        '✓ Resource saved successfully.'
      );

      setForm(initialForm);

      await loadPageData();
    } catch (error) {
      setMessageType('error');

      setMessage(
        `✕ ${
          error.message ||
          'Failed to save resource.'
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="card">
        <div className="page-heading">
          <div>
            <h1>
              👤 Resource Master
            </h1>

            <p className="page-description">
              Maintain project resources,
              roles, rates and resource
              information.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          <div className="form-grid">
            <label>
              Resource ID *
              <input
                name="resourceid"
                value={form.resourceid}
                onChange={handleChange}
                maxLength="10"
                placeholder="e.g. 0000002"
              />
            </label>

            <label>
              First Name *
              <input
                name="firstname"
                value={form.firstname}
                onChange={handleChange}
                maxLength="20"
                placeholder="First Name"
              />
            </label>

            <label>
              Last Name
              <input
                name="lastname"
                value={form.lastname}
                onChange={handleChange}
                maxLength="20"
                placeholder="Last Name"
              />
            </label>

            <label>
              Resource Type *
              <select
                name="resourcetype"
                value={form.resourcetype}
                onChange={handleChange}
                disabled={loading}
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
                      {
                        type.resourcetype
                      }
                      {' - '}
                      {
                        type.description
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Internal Role *
              <select
                name="internalroleid"
                value={form.internalroleid}
                onChange={handleChange}
                disabled={loading}
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
                      {
                        role.projectroleid
                      }
                      {' - '}
                      {
                        role.description
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Location
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                maxLength="20"
                placeholder="e.g. Sri Lanka"
              />
            </label>

            <label>
              Bill Rate
              <input
                type="number"
                name="billrate"
                min="0"
                step="0.01"
                value={form.billrate}
                onChange={handleChange}
                placeholder="0.00"
              />
            </label>

            <label>
              Currency
              <select
                name="currcode"
                value={form.currcode}
                onChange={handleChange}
                disabled={loading}
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
                      {
                        currency.currcode
                      }
                      {' - '}
                      {
                        currency.description
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Cost to Company
              <input
                type="number"
                name="cost2co"
                min="0"
                step="0.01"
                value={form.cost2co}
                onChange={handleChange}
                placeholder="0.00"
              />
            </label>
          </div>

          <div className="phase-form-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? '⏳ Saving...'
                : '💾 Save Resource'}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={resetForm}
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
            Existing Resources
          </h2>

          {loading ? (
            <p>
              Loading resources...
            </p>
          ) : resources.length === 0 ? (
            <p>
              No resources found.
            </p>
          ) : (
            <div className="project-entry-grid-wrap">
              <table className="project-entry-grid">
                <thead>
                  <tr>
                    <th>
                      Resource ID
                    </th>

                    <th>
                      Name
                    </th>

                    <th>
                      Resource Type
                    </th>

                    <th>
                      Internal Role
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Bill Rate
                    </th>

                    <th>
                      Currency
                    </th>

                    <th>
                      Cost to Company
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {resources.map(
                    (resource) => (
                      <tr
                        key={
                          resource.resourceid
                        }
                      >
                        <td>
                          {
                            resource.resourceid
                          }
                        </td>

                        <td>
                          {
                            resource.firstname
                          }{' '}
                          {
                            resource.lastname
                          }
                        </td>

                        <td>
                          {
                            resource.resourcetypedescription ||
                            resource.resourcetype ||
                            '-'
                          }
                        </td>

                        <td>
                          {
                            resource.roledescription ||
                            resource.internalroleid ||
                            '-'
                          }
                        </td>

                        <td>
                          {
                            resource.location ||
                            '-'
                          }
                        </td>

                        <td>
                          {
                            resource.billrate ??
                            '-'
                          }
                        </td>

                        <td>
                          {
                            resource.currcode ||
                            '-'
                          }
                        </td>

                        <td>
                          {
                            resource.cost2co ??
                            '-'
                          }
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

export default ResourceMasterPage;