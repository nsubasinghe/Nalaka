import { useState } from 'react';

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

function App() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save project');
      }

      setMessage('Project saved successfully.');
      setForm(initialForm);
    } catch (error) {
      setMessage(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="card">
        <h1>ProjectMaster</h1>
        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-grid">
            <label>
              Project Code
              <input name="projectcode" maxLength={10} value={form.projectcode} onChange={handleChange} required />
            </label>

            <label>
              Version ID
              <input name="versionid" maxLength={2} value={form.versionid} onChange={handleChange} required />
            </label>

            <label className="full-width">
              Project Name
              <input name="projectname" maxLength={50} value={form.projectname} onChange={handleChange} required />
            </label>

            <label className="full-width">
              Project Description
              <input name="projectdescription" maxLength={50} value={form.projectdescription} onChange={handleChange} />
            </label>

            <label>
              Project Type
              <input name="projecttype" maxLength={2} value={form.projecttype} onChange={handleChange} />
            </label>

            <label>
              Customer ID
              <input name="customerid" maxLength={10} value={form.customerid} onChange={handleChange} />
            </label>

            <label>
              Currency
              <input name="currency" maxLength={4} value={form.currency} onChange={handleChange} />
            </label>

            <label>
              Status
              <input name="status" maxLength={1} value={form.status} onChange={handleChange} />
            </label>

            <label>
              Created By
              <input name="createdby" maxLength={10} value={form.createdby} onChange={handleChange} />
            </label>

            <label>
              Updated By
              <input name="updatedby" maxLength={10} value={form.updatedby} onChange={handleChange} />
            </label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Project'}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default App;
