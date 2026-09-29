function CreateVersionModal({
  show,
  creatingVersion,
  selectedProjectCode,
  activeVersionId,
  newVersionNote,
  createVersionError,
  onClose,
  onVersionNoteChange,
  onCreate
}) {
  if (!show) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          background: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow:
            '0 20px 50px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            gap: '20px',
            marginBottom: '20px'
          }}
        >
          <div>
            <h2
              style={{
                margin:
                  '0 0 8px 0'
              }}
            >
              ➕ Create New Project Version
            </h2>

            <p
              style={{
                margin: 0
              }}
            >
              The complete active project
              baseline will be copied into
              the new version.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={
              creatingVersion
            }
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '12px',
                opacity: 0.7
              }}
            >
              Project
            </div>

            <strong>
              {
                selectedProjectCode
              }
            </strong>
          </div>

          <div>
            <div
              style={{
                fontSize: '12px',
                opacity: 0.7
              }}
            >
              Current Active Version
            </div>

            <strong>
              V
              {
                activeVersionId
              }
            </strong>
          </div>
        </div>

        <label
          style={{
            display: 'block'
          }}
        >
          Version Note *

          <textarea
            value={
              newVersionNote
            }
            onChange={
              onVersionNoteChange
            }
            disabled={
              creatingVersion
            }
            rows={5}
            maxLength={255}
            placeholder="Example: Revised project budget after customer review"
            style={{
              width: '100%',
              marginTop: '8px',
              resize: 'vertical',
              boxSizing:
                'border-box'
            }}
          />
        </label>

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            marginTop: '6px'
          }}
        >
          <div>
            {createVersionError && (
              <span
                style={{
                  color:
                    '#b42318'
                }}
              >
                ✕ {
                  createVersionError
                }
              </span>
            )}
          </div>

          <small>
            {
              newVersionNote.length
            }
            {' / '}
            255
          </small>
        </div>

        <div
          style={{
            marginTop: '24px',
            padding: '14px',
            borderRadius: '8px',
            background:
              'rgba(0, 0, 0, 0.04)'
          }}
        >
          <strong>
            What will be copied?
          </strong>

          <p
            style={{
              margin:
                '8px 0 0 0'
            }}
          >
            All phases, phase dates,
            resource planning rows,
            work locations and weekly
            allocations from Project
            Version V{activeVersionId}
            {' '}
            will be copied to the new
            active Project Version.
          </p>

          <p
            style={{
              margin:
                '8px 0 0 0'
            }}
          >
            V{activeVersionId}
            {' '}
            will then become inactive
            and read-only.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent:
              'flex-end',
            gap: '10px',
            marginTop: '24px'
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={
              creatingVersion
            }
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onCreate}
            disabled={
              creatingVersion ||
              !newVersionNote.trim()
            }
          >
            {creatingVersion
              ? '⏳ Creating...'
              : '➕ Create Project Version'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateVersionModal;