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
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

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

      setMessageType('success');
      setMessage('✓ Project saved successfully!');
      setForm(initialForm);
      
      // Clear message after 4 seconds
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessageType('error');
      setMessage(`✕ ${error.message || 'Something went wrong'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="card">
        <h1>📋 ProjectMaster</h1>
        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-grid">
            <label>
              Project Code *
              <input 
                name="projectcode" 
                maxLength={10} 
                value={form.projectcode} 
                onChange={handleChange} 
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
                onChange={handleChange} 
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
              Project Type
              <input 
                name="projecttype" 
                maxLength={2} 
                value={form.projecttype} 
                onChange={handleChange} 
                placeholder="e.g., IT"
              />
            </label>

            <label>
              Customer ID
              <input 
                name="customerid" 
                maxLength={10} 
                value={form.customerid} 
                onChange={handleChange} 
                placeholder="e.g., CUST001"
              />
            </label>

            <label>
              Currency
              <input 
                name="currency" 
                maxLength={4} 
                value={form.currency} 
                onChange={handleChange} 
                placeholder="e.g., USD"
              />
            </label>

            <label>
              Status
              <input 
                name="status" 
                maxLength={1} 
                value={form.status} 
                onChange={handleChange} 
                placeholder="e.g., A (Active)"
              />
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

          <button type="submit" disabled={loading}>
            {loading ? '⏳ Saving...' : '💾 Save Project'}
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

export default App;
