import { useEffect, useState } from 'react';

const initialProjectType = {
  projecttype: '',
  description: ''
};

const initialCurrency = {
  currcode: '',
  description: ''
};

const initialProjectPhase = {
  phaseid: '',
  description: ''
};

const initialResourceType = {
  resourcetype: '',
  description: ''
};

const initialRoleCategory = {
  rolecatid: '',
  description: ''
};

const initialProjectRole = {
  projectroleid: '',
  rolecatid: '',
  description: ''
};

function MasterDataPage() {
  const [activeSection, setActiveSection] = useState('project-types');

  const [projectTypes, setProjectTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [projectPhases, setProjectPhases] = useState([]);
  const [resourceTypes, setResourceTypes] = useState([]);
  const [roleCategories, setRoleCategories] = useState([]);
  const [projectRoles, setProjectRoles] = useState([]);

  const [projectTypeForm, setProjectTypeForm] =
    useState(initialProjectType);

  const [currencyForm, setCurrencyForm] =
    useState(initialCurrency);

  const [projectPhaseForm, setProjectPhaseForm] =
    useState(initialProjectPhase);

  const [resourceTypeForm, setResourceTypeForm] =
    useState(initialResourceType);

  const [roleCategoryForm, setRoleCategoryForm] =
    useState(initialRoleCategory);

  const [projectRoleForm, setProjectRoleForm] =
    useState(initialProjectRole);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const loadMasterData = async ({
    preserveMessage = false
  } = {}) => {
    setLoading(true);

    if (!preserveMessage) {
      setMessage('');
      setMessageType('');
    }

    try {
      const [
        projectTypesResponse,
        currenciesResponse,
        projectPhasesResponse,
        resourceTypesResponse,
        roleCategoriesResponse,
        projectRolesResponse
      ] = await Promise.all([
        fetch('/api/project-types'),
        fetch('/api/currencies'),
        fetch('/api/project-phases'),
        fetch('/api/resource-types'),
        fetch('/api/role-categories'),
        fetch('/api/project-roles')
      ]);

      const [
        projectTypesResult,
        currenciesResult,
        projectPhasesResult,
        resourceTypesResult,
        roleCategoriesResult,
        projectRolesResult
      ] = await Promise.all([
        projectTypesResponse.json(),
        currenciesResponse.json(),
        projectPhasesResponse.json(),
        resourceTypesResponse.json(),
        roleCategoriesResponse.json(),
        projectRolesResponse.json()
      ]);

      if (!projectTypesResponse.ok) {
        throw new Error(
          projectTypesResult.error ||
            'Failed to load project types.'
        );
      }

      if (!currenciesResponse.ok) {
        throw new Error(
          currenciesResult.error ||
            'Failed to load currencies.'
        );
      }

      if (!projectPhasesResponse.ok) {
        throw new Error(
          projectPhasesResult.error ||
            'Failed to load project phases.'
        );
      }

      if (!resourceTypesResponse.ok) {
        throw new Error(
          resourceTypesResult.error ||
            'Failed to load resource types.'
        );
      }

      if (!roleCategoriesResponse.ok) {
        throw new Error(
          roleCategoriesResult.error ||
            'Failed to load role categories.'
        );
      }

      if (!projectRolesResponse.ok) {
        throw new Error(
          projectRolesResult.error ||
            'Failed to load project roles.'
        );
      }

      setProjectTypes(
        projectTypesResult.projectTypes || []
      );

      setCurrencies(
        currenciesResult.currencies || []
      );

      setProjectPhases(
        projectPhasesResult.projectPhases || []
      );

      setResourceTypes(
        resourceTypesResult.resourceTypes || []
      );

      setRoleCategories(
        roleCategoriesResult.roleCategories || []
      );

      setProjectRoles(
        projectRolesResult.projectRoles || []
      );
    } catch (error) {
      setMessageType('error');
      setMessage(
        `✕ ${
          error.message ||
          'Failed to load master data.'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  const showSuccessAndReload = async (text) => {
    await loadMasterData({
      preserveMessage: true
    });

    setMessageType('success');
    setMessage(`✓ ${text}`);
  };

  const saveProjectType = async (event) => {
    event.preventDefault();

    if (
      !projectTypeForm.projecttype ||
      !projectTypeForm.description
    ) {
      setMessageType('error');
      setMessage(
        '✕ Project Type and Description are required.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/project-types',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(projectTypeForm)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to save project type.'
        );
      }

      setProjectTypeForm(initialProjectType);

      await showSuccessAndReload(
        'Project Type saved successfully.'
      );
    } catch (error) {
      setMessageType('error');
      setMessage(`✕ ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveCurrency = async (event) => {
    event.preventDefault();

    if (
      !currencyForm.currcode ||
      !currencyForm.description
    ) {
      setMessageType('error');
      setMessage(
        '✕ Currency Code and Description are required.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/currencies',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(currencyForm)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to save currency.'
        );
      }

      setCurrencyForm(initialCurrency);

      await showSuccessAndReload(
        'Currency saved successfully.'
      );
    } catch (error) {
      setMessageType('error');
      setMessage(`✕ ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveProjectPhase = async (event) => {
    event.preventDefault();

    if (
      !projectPhaseForm.phaseid ||
      !projectPhaseForm.description
    ) {
      setMessageType('error');
      setMessage(
        '✕ Phase ID and Description are required.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/project-phases',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(projectPhaseForm)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to save project phase.'
        );
      }

      setProjectPhaseForm(initialProjectPhase);

      await showSuccessAndReload(
        'Project Phase saved successfully.'
      );
    } catch (error) {
      setMessageType('error');
      setMessage(`✕ ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveResourceType = async (event) => {
    event.preventDefault();

    if (
      !resourceTypeForm.resourcetype ||
      !resourceTypeForm.description
    ) {
      setMessageType('error');
      setMessage(
        '✕ Resource Type and Description are required.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/resource-types',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(resourceTypeForm)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to save resource type.'
        );
      }

      setResourceTypeForm(initialResourceType);

      await showSuccessAndReload(
        'Resource Type saved successfully.'
      );
    } catch (error) {
      setMessageType('error');
      setMessage(`✕ ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveRoleCategory = async (event) => {
    event.preventDefault();

    if (
      !roleCategoryForm.rolecatid ||
      !roleCategoryForm.description
    ) {
      setMessageType('error');
      setMessage(
        '✕ Role Category ID and Description are required.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/role-categories',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(roleCategoryForm)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to save role category.'
        );
      }

      setRoleCategoryForm(initialRoleCategory);

      await showSuccessAndReload(
        'Role Category saved successfully.'
      );
    } catch (error) {
      setMessageType('error');
      setMessage(`✕ ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveProjectRole = async (event) => {
    event.preventDefault();

    if (
      !projectRoleForm.projectroleid ||
      !projectRoleForm.rolecatid ||
      !projectRoleForm.description
    ) {
      setMessageType('error');
      setMessage(
        '✕ Project Role ID, Role Category and Description are required.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/project-roles',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(projectRoleForm)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to save project role.'
        );
      }

      setProjectRoleForm(initialProjectRole);

      await showSuccessAndReload(
        'Project Role saved successfully.'
      );
    } catch (error) {
      setMessageType('error');
      setMessage(`✕ ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const renderProjectTypes = () => (
    <>
      <h2>Project Types</h2>

      <form onSubmit={saveProjectType}>
        <div className="form-grid">
          <label>
            Project Type *
            <input
              maxLength="2"
              value={projectTypeForm.projecttype}
              onChange={(event) =>
                setProjectTypeForm((previous) => ({
                  ...previous,
                  projecttype: event.target.value
                }))
              }
              placeholder="e.g. 06"
            />
          </label>

          <label>
            Description *
            <input
              maxLength="50"
              value={projectTypeForm.description}
              onChange={(event) =>
                setProjectTypeForm((previous) => ({
                  ...previous,
                  description: event.target.value
                }))
              }
              placeholder="Project type description"
            />
          </label>
        </div>

        <div className="phase-form-actions">
          <button type="submit" disabled={saving}>
            💾 Save Project Type
          </button>
        </div>
      </form>

      <div className="project-entry-grid-wrap">
        <table className="project-entry-grid">
          <thead>
            <tr>
              <th>Project Type</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>
            {projectTypes.map((item) => (
              <tr key={item.projecttype}>
                <td>{item.projecttype}</td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderCurrencies = () => (
    <>
      <h2>Currencies</h2>

      <form onSubmit={saveCurrency}>
        <div className="form-grid">
          <label>
            Currency Code *
            <input
              maxLength="3"
              value={currencyForm.currcode}
              onChange={(event) =>
                setCurrencyForm((previous) => ({
                  ...previous,
                  currcode:
                    event.target.value.toUpperCase()
                }))
              }
              placeholder="e.g. USD"
            />
          </label>

          <label>
            Description *
            <input
              maxLength="20"
              value={currencyForm.description}
              onChange={(event) =>
                setCurrencyForm((previous) => ({
                  ...previous,
                  description: event.target.value
                }))
              }
              placeholder="Currency description"
            />
          </label>
        </div>

        <div className="phase-form-actions">
          <button type="submit" disabled={saving}>
            💾 Save Currency
          </button>
        </div>
      </form>

      <div className="project-entry-grid-wrap">
        <table className="project-entry-grid">
          <thead>
            <tr>
              <th>Currency Code</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>
            {currencies.map((item) => (
              <tr key={item.currcode}>
                <td>{item.currcode}</td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderProjectPhases = () => (
    <>
      <h2>Project Phases</h2>

      <form onSubmit={saveProjectPhase}>
        <div className="form-grid">
          <label>
            Phase ID *
            <input
              maxLength="2"
              value={projectPhaseForm.phaseid}
              onChange={(event) =>
                setProjectPhaseForm((previous) => ({
                  ...previous,
                  phaseid: event.target.value
                }))
              }
              placeholder="e.g. 20"
            />
          </label>

          <label>
            Description *
            <input
              maxLength="250"
              value={projectPhaseForm.description}
              onChange={(event) =>
                setProjectPhaseForm((previous) => ({
                  ...previous,
                  description: event.target.value
                }))
              }
              placeholder="Phase description"
            />
          </label>
        </div>

        <div className="phase-form-actions">
          <button type="submit" disabled={saving}>
            💾 Save Project Phase
          </button>
        </div>
      </form>

      <div className="project-entry-grid-wrap">
        <table className="project-entry-grid">
          <thead>
            <tr>
              <th>Phase ID</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>
            {projectPhases.map((item) => (
              <tr key={item.phaseid}>
                <td>{item.phaseid}</td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderResourceTypes = () => (
    <>
      <h2>Resource Types</h2>

      <form onSubmit={saveResourceType}>
        <div className="form-grid">
          <label>
            Resource Type *
            <input
              maxLength="2"
              value={resourceTypeForm.resourcetype}
              onChange={(event) =>
                setResourceTypeForm((previous) => ({
                  ...previous,
                  resourcetype: event.target.value
                }))
              }
              placeholder="e.g. 03"
            />
          </label>

          <label>
            Description *
            <input
              maxLength="15"
              value={resourceTypeForm.description}
              onChange={(event) =>
                setResourceTypeForm((previous) => ({
                  ...previous,
                  description: event.target.value
                }))
              }
              placeholder="Resource type description"
            />
          </label>
        </div>

        <div className="phase-form-actions">
          <button type="submit" disabled={saving}>
            💾 Save Resource Type
          </button>
        </div>
      </form>

      <div className="project-entry-grid-wrap">
        <table className="project-entry-grid">
          <thead>
            <tr>
              <th>Resource Type</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>
            {resourceTypes.map((item) => (
              <tr key={item.resourcetype}>
                <td>{item.resourcetype}</td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderRoleCategories = () => (
    <>
      <h2>Role Categories</h2>

      <form onSubmit={saveRoleCategory}>
        <div className="form-grid">
          <label>
            Role Category ID *
            <input
              maxLength="2"
              value={roleCategoryForm.rolecatid}
              onChange={(event) =>
                setRoleCategoryForm((previous) => ({
                  ...previous,
                  rolecatid: event.target.value
                }))
              }
              placeholder="e.g. 12"
            />
          </label>

          <label>
            Description *
            <input
              maxLength="50"
              value={roleCategoryForm.description}
              onChange={(event) =>
                setRoleCategoryForm((previous) => ({
                  ...previous,
                  description: event.target.value
                }))
              }
              placeholder="Role category description"
            />
          </label>
        </div>

        <div className="phase-form-actions">
          <button type="submit" disabled={saving}>
            💾 Save Role Category
          </button>
        </div>
      </form>

      <div className="project-entry-grid-wrap">
        <table className="project-entry-grid">
          <thead>
            <tr>
              <th>Role Category ID</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>
            {roleCategories.map((item) => (
              <tr key={item.rolecatid}>
                <td>{item.rolecatid}</td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderProjectRoles = () => (
    <>
      <h2>Project Roles</h2>

      <form onSubmit={saveProjectRole}>
        <div className="form-grid">
          <label>
            Project Role ID *
            <input
              maxLength="2"
              value={projectRoleForm.projectroleid}
              onChange={(event) =>
                setProjectRoleForm((previous) => ({
                  ...previous,
                  projectroleid: event.target.value
                }))
              }
              placeholder="e.g. 06"
            />
          </label>

          <label>
            Role Category *
            <select
              value={projectRoleForm.rolecatid}
              onChange={(event) =>
                setProjectRoleForm((previous) => ({
                  ...previous,
                  rolecatid: event.target.value
                }))
              }
            >
              <option value="">
                Select Role Category
              </option>

              {roleCategories.map((category) => (
                <option
                  key={category.rolecatid}
                  value={category.rolecatid}
                >
                  {category.rolecatid}
                  {' - '}
                  {category.description}
                </option>
              ))}
            </select>
          </label>

          <label>
            Description *
            <input
              maxLength="50"
              value={projectRoleForm.description}
              onChange={(event) =>
                setProjectRoleForm((previous) => ({
                  ...previous,
                  description: event.target.value
                }))
              }
              placeholder="Project role description"
            />
          </label>
        </div>

        <div className="phase-form-actions">
          <button type="submit" disabled={saving}>
            💾 Save Project Role
          </button>
        </div>
      </form>

      <div className="project-entry-grid-wrap">
        <table className="project-entry-grid">
          <thead>
            <tr>
              <th>Project Role ID</th>
              <th>Role Category</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>
            {projectRoles.map((item) => (
              <tr key={item.projectroleid}>
                <td>{item.projectroleid}</td>

                <td>
                  {item.rolecatid}
                  {item.rolecategory
                    ? ` - ${item.rolecategory}`
                    : ''}
                </td>

                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'currencies':
        return renderCurrencies();

      case 'project-phases':
        return renderProjectPhases();

      case 'resource-types':
        return renderResourceTypes();

      case 'role-categories':
        return renderRoleCategories();

      case 'project-roles':
        return renderProjectRoles();

      case 'project-types':
      default:
        return renderProjectTypes();
    }
  };

  return (
    <div className="page-wrap">
      <div className="card">
        <div className="page-heading">
          <div>
            <h1>⚙️ Master Data</h1>

            <p className="page-description">
              Maintain the configuration data used
              throughout PPBMA.
            </p>
          </div>
        </div>

        <div className="phase-form-actions">
          <button
            type="button"
            className={
              activeSection === 'project-types'
                ? ''
                : 'secondary-button'
            }
            onClick={() =>
              setActiveSection('project-types')
            }
          >
            Project Types
          </button>

          <button
            type="button"
            className={
              activeSection === 'currencies'
                ? ''
                : 'secondary-button'
            }
            onClick={() =>
              setActiveSection('currencies')
            }
          >
            Currencies
          </button>

          <button
            type="button"
            className={
              activeSection === 'project-phases'
                ? ''
                : 'secondary-button'
            }
            onClick={() =>
              setActiveSection('project-phases')
            }
          >
            Project Phases
          </button>

          <button
            type="button"
            className={
              activeSection === 'resource-types'
                ? ''
                : 'secondary-button'
            }
            onClick={() =>
              setActiveSection('resource-types')
            }
          >
            Resource Types
          </button>

          <button
            type="button"
            className={
              activeSection === 'role-categories'
                ? ''
                : 'secondary-button'
            }
            onClick={() =>
              setActiveSection('role-categories')
            }
          >
            Role Categories
          </button>

          <button
            type="button"
            className={
              activeSection === 'project-roles'
                ? ''
                : 'secondary-button'
            }
            onClick={() =>
              setActiveSection('project-roles')
            }
          >
            Project Roles
          </button>
        </div>

        {message && (
          <p
            className={`message message-${messageType}`}
          >
            {message}
          </p>
        )}

        <div className="project-plan-entry-section">
          {loading ? (
            <p>Loading master data...</p>
          ) : (
            renderSection()
          )}
        </div>
      </div>
    </div>
  );
}

export default MasterDataPage;