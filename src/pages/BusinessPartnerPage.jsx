import { useEffect, useState } from 'react';

const initialForm = {
  partnerid: '',
  description: ''
};

function BusinessPartnerPage() {
  const [form, setForm] = useState(initialForm);
  const [businessPartners, setBusinessPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [editingPartnerId, setEditingPartnerId] = useState('');
  const [duplicatePartnerId, setDuplicatePartnerId] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const loadBusinessPartners = async () => {
    setListLoading(true);

    try {
      const response = await fetch('/api/business-partners');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Failed to load Business Partners.'
        );
      }

      setBusinessPartners(result.businessPartners || []);
    } catch (error) {
      setMessageType('error');
      setMessage(
        `✕ ${error.message || 'Failed to load Business Partners.'}`
      );
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadBusinessPartners();
  }, []);

  const handlePartnerIdChange = (event) => {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    setForm((prev) => ({
      ...prev,
      partnerid: value
    }));

    const exists = businessPartners.some(
      (partner) =>
        partner.partnerid.toUpperCase() === value &&
        partner.partnerid !== editingPartnerId
    );

    setDuplicatePartnerId(exists);

    if (exists) {
      setMessageType('error');
      setMessage('✕ Partner ID already exists.');
    } else {
      setMessage('');
      setMessageType('');
    }
  };

  const handleDescriptionChange = (event) => {
    setForm((prev) => ({
      ...prev,
      description: event.target.value
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingPartnerId('');
    setDuplicatePartnerId(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');
    setMessageType('');

    const partnerid = form.partnerid.trim();
    const description = form.description.trim();

    if (!partnerid) {
      setMessageType('error');
      setMessage('✕ Partner ID is required.');
      return;
    }

    if (duplicatePartnerId && !editingPartnerId) {
      setMessageType('error');
      setMessage('✕ Partner ID already exists.');
      return;
    }

    if (!description) {
      setMessageType('error');
      setMessage('✕ Description is required.');
      return;
    }

    if (!/^[A-Z0-9]{1,10}$/.test(partnerid)) {
      setMessageType('error');
      setMessage(
        '✕ Partner ID must contain only letters and numbers and cannot exceed 10 characters.'
      );
      return;
    }

    if (description.length > 50) {
      setMessageType('error');
      setMessage('✕ Description cannot exceed 50 characters.');
      return;
    }

    setLoading(true);

    try {
      const isEditing = Boolean(editingPartnerId);

      const url = isEditing
        ? `/api/business-partners/${editingPartnerId}`
        : '/api/business-partners';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partnerid,
          description
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            (isEditing
              ? 'Failed to update Business Partner.'
              : 'Failed to save Business Partner.')
        );
      }

      setMessageType('success');
      setMessage(
        isEditing
          ? '✓ Business Partner updated successfully!'
          : '✓ Business Partner saved successfully!'
      );

      resetForm();
      await loadBusinessPartners();
    } catch (error) {
      setMessageType('error');
      setMessage(
        `✕ ${error.message || 'Something went wrong.'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (partner) => {
    setEditingPartnerId(partner.partnerid);

    setForm({
      partnerid: partner.partnerid,
      description: partner.description
    });

    setDuplicatePartnerId(false);
    setMessage('');
    setMessageType('');
  };

  const handleDelete = async (partnerid) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Business Partner ${partnerid}?`
    );

    if (!confirmed) {
      return;
    }

    setMessage('');
    setMessageType('');

    try {
      const response = await fetch(
        `/api/business-partners/${partnerid}`,
        {
          method: 'DELETE'
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Failed to delete Business Partner.'
        );
      }

      setMessageType('success');
      setMessage('✓ Business Partner deleted successfully!');

      if (editingPartnerId === partnerid) {
        resetForm();
      }

      await loadBusinessPartners();
    } catch (error) {
      setMessageType('error');
      setMessage(
        `✕ ${error.message || 'Something went wrong.'}`
      );
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setMessage('');
    setMessageType('');
  };

  return (
    <div className="page-wrap">
      <div className="card">
        <h1>🤝 Business Partner</h1>

        <form
          onSubmit={handleSubmit}
          className="project-form"
        >
          <div className="form-grid">
            <label>
              Partner ID *
              <input
                name="partnerid"
                value={form.partnerid}
                onChange={handlePartnerIdChange}
                maxLength={10}
                placeholder="e.g., BP0001"
                required
                disabled={Boolean(editingPartnerId)}
              />

              {duplicatePartnerId && !editingPartnerId && (
                <span className="field-error">
                  Partner ID already exists.
                </span>
              )}
            </label>

            <label>
              Description *
              <input
                name="description"
                value={form.description}
                onChange={handleDescriptionChange}
                maxLength={50}
                placeholder="Enter business partner description"
                required
              />
            </label>
          </div>

          <div className="button-row">
            <button
              type="submit"
              disabled={
                loading ||
                (duplicatePartnerId && !editingPartnerId)
              }
            >
              {loading
                ? '⏳ Saving...'
                : editingPartnerId
                  ? '✏️ Update Business Partner'
                  : '💾 Save Business Partner'}
            </button>

            {editingPartnerId && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {message && (
          <p className={`message message-${messageType}`}>
            {message}
          </p>
        )}

        <div className="partner-list-section">
          <h2>Business Partners</h2>

          {listLoading ? (
            <p>Loading Business Partners...</p>
          ) : businessPartners.length === 0 ? (
            <p>No Business Partners found.</p>
          ) : (
            <div className="table-wrap">
              <table className="partner-table">
                <thead>
                  <tr>
                    <th>Partner ID</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {businessPartners.map((partner) => (
                    <tr key={partner.partnerid}>
                      <td>{partner.partnerid}</td>
                      <td>{partner.description}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => handleEdit(partner)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              handleDelete(partner.partnerid)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BusinessPartnerPage;