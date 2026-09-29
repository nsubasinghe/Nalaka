function ProjectDetailsSection({
  selectedProjectCode,
  displayedVersionId,
  selectedPhaseId,
  uniqueProjects,
  projectVersions,
  projectPhases,
  selectedProject,
  selectedPhase,
  activeVersionId,
  displayedVersionNote,
  viewingInactiveVersion,
  hasUnsavedChanges,
  masterDataLoading,
  versionHistoryLoading,
  planLoading,
  creatingVersion,
  saving,
  activatingVersionId,
  onProjectChange,
  onVersionChange,
  onPhaseChange,
  onOpenCreateVersionModal,
  onBackToActiveVersion
}) {
  const hasActiveVersion =
    Boolean(
      activeVersionId
    );

  return (
    <div className="project-plan-entry-section">

      {/* =================================================
          SECTION TITLE
      ================================================= */}

      <h2>
        Project Details
      </h2>

      {/* =================================================
          MAIN SELECTORS
      ================================================= */}

      <div className="form-grid">

        {/* =================================================
            PROJECT
        ================================================= */}

        <label>
          Project ID *

          <select
            value={
              selectedProjectCode
            }
            onChange={
              onProjectChange
            }
            disabled={
              masterDataLoading ||
              creatingVersion ||
              Boolean(
                activatingVersionId
              )
            }
          >
            <option value="">
              {masterDataLoading
                ? 'Loading Projects...'
                : 'Select Project ID'}
            </option>

            {uniqueProjects.map(
              (project) => (
                <option
                  key={
                    project.projectcode
                  }
                  value={
                    project.projectcode
                  }
                >
                  {
                    project.projectcode
                  }

                  {' - '}

                  {
                    project.projectname
                  }
                </option>
              )
            )}
          </select>
        </label>

        {/* =================================================
            VERSION
        ================================================= */}

        <label>
          Version ID *

          <select
            value={
              displayedVersionId
            }
            onChange={
              onVersionChange
            }
            disabled={
              !selectedProjectCode ||
              versionHistoryLoading ||
              planLoading ||
              creatingVersion ||
              Boolean(
                activatingVersionId
              )
            }
          >
            <option value="">
              {versionHistoryLoading
                ? 'Loading Versions...'
                : 'Select Version ID'}
            </option>

            {projectVersions.map(
              (version) => (
                <option
                  key={
                    version.versionid
                  }
                  value={
                    version.versionid
                  }
                >
                  V
                  {
                    version.versionid
                  }

                  {' - '}

                  {version.status ===
                  'A'
                    ? 'Active'
                    : 'Inactive'}
                </option>
              )
            )}
          </select>
        </label>

        {/* =================================================
            PHASE
        ================================================= */}

        <label>
          Project Phase *

          <select
            value={
              selectedPhaseId
            }
            onChange={
              onPhaseChange
            }
            disabled={
              !selectedProjectCode ||
              masterDataLoading ||
              planLoading ||
              creatingVersion ||
              projectPhases.length ===
                0 ||
              Boolean(
                activatingVersionId
              )
            }
          >
            <option value="">
              {!selectedProjectCode
                ? 'Select Project first'
                : projectPhases.length ===
                    0
                  ? 'No phases assigned to this project'
                  : 'Select Project Phase'}
            </option>

            {projectPhases.map(
              (phase) => (
                <option
                  key={
                    phase.phaseid
                  }
                  value={
                    phase.phaseid
                  }
                >
                  {
                    phase.phaseid
                  }

                  {' - '}

                  {
                    phase.description
                  }
                </option>
              )
            )}
          </select>
        </label>

      </div>

      {/* =================================================
          VERSION ACTIONS
      ================================================= */}

      {selectedProjectCode &&
        hasActiveVersion && (
          <div
            className="phase-form-actions"
            style={{
              marginTop:
                '16px',
              display:
                'flex',
              gap:
                '10px',
              flexWrap:
                'wrap'
            }}
          >

            {!viewingInactiveVersion && (
              <button
                type="button"
                onClick={
                  onOpenCreateVersionModal
                }
                disabled={
                  creatingVersion ||
                  planLoading ||
                  saving ||
                  Boolean(
                    activatingVersionId
                  )
                }
              >
                {creatingVersion
                  ? '⏳ Creating Project Version...'
                  : '➕ Create New Project Version'}
              </button>
            )}

            {viewingInactiveVersion && (
              <button
                type="button"
                onClick={
                  onBackToActiveVersion
                }
                disabled={
                  planLoading ||
                  Boolean(
                    activatingVersionId
                  )
                }
              >
                ↩ Back to Active Project Version
              </button>
            )}

          </div>
        )}

      {/* =================================================
          PROJECT SUMMARY
      ================================================= */}

      {selectedProject && (
        <div className="project-summary">

          <div className="summary-item">
            <span>
              Project ID
            </span>

            <strong>
              {
                selectedProject.projectcode
              }
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Active Project Version
            </span>

            <strong>
              {activeVersionId
                ? `V${activeVersionId}`
                : 'None'}
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Displayed Version
            </span>

            <strong>
              {displayedVersionId
                ? `V${displayedVersionId}`
                : '-'}
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Version Status
            </span>

            <strong>
              {viewingInactiveVersion
                ? '⚪ Inactive / Read Only'
                : activeVersionId
                  ? '🟢 Active'
                  : 'No Active Version'}
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Selected Phase
            </span>

            <strong>
              {selectedPhaseId
                ? `${selectedPhaseId} - ${
                    selectedPhase?.description ||
                    ''
                  }`
                : '-'}
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Save Status
            </span>

            <strong>
              {viewingInactiveVersion
                ? 'Read Only'
                : hasUnsavedChanges
                  ? '🟠 Unsaved Changes'
                  : '🟢 Saved'}
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Version Note
            </span>

            <strong>
              {displayedVersionNote ||
                '-'}
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Project Description
            </span>

            <strong>
              {selectedProject
                .projectdescription ||
                selectedProject
                  .projectname ||
                '-'}
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Business Partner
            </span>

            <strong>
              {selectedProject
                .partnerdescription ||
                selectedProject
                  .partnerid ||
                '-'}
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Project Type
            </span>

            <strong>
              {selectedProject
                .projecttypedescription ||
                selectedProject
                  .projecttype ||
                '-'}
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Currency
            </span>

            <strong>
              {selectedProject.currency ||
                '-'}
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Location
            </span>

            <strong>
              {selectedProject.location ||
                '-'}
            </strong>
          </div>

          <div className="summary-item">
            <span>
              Region
            </span>

            <strong>
              {selectedProject.region ||
                '-'}
            </strong>
          </div>

        </div>
      )}

    </div>
  );
}

export default ProjectDetailsSection;