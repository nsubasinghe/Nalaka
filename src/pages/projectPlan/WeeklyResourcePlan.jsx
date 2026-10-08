import {
  formatDate,
  workLocations
} from './projectPlanUtils';

/* =========================================================
   WEEK PERIOD LABEL
========================================================= */

const getPeriodLabel = (
  week
) => {
  if (
    !week?.startDate ||
    !week?.endDate
  ) {
    return {
      start: '',
      end: ''
    };
  }

  return {
    start:
      formatDate(
        week.startDate
      ),

    end:
      formatDate(
        week.endDate
      )
  };
};

/* =========================================================
   RESOURCE ROW
========================================================= */

function ResourceRow({
  row,
  generatedWeeks,
  projectRoles,
  resources,
  editable,
  onRemoveResourceRow,
  onResourceFieldChange,
  onWeekValueChange,
  onApplyWeekValueToAll
}) {
  return (
    <tr>

      {/* =====================================================
          PROJECT ROLE
      ===================================================== */}

      <td>
        <select
          value={
            row.projectRoleId
          }
          onChange={(
            event
          ) =>
            onResourceFieldChange(
              row.id,
              'projectRoleId',
              event.target.value
            )
          }
          disabled={
            !editable
          }
        >
          <option value="">
            Select Role
          </option>

          {projectRoles.map(
            (
              role
            ) => (
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
      </td>

      {/* =====================================================
          SKILL
      ===================================================== */}

      <td>
        <input
          value={
            row.skill ||
            ''
          }
          readOnly
          placeholder="Auto"
        />
      </td>

      {/* =====================================================
          PLANNED RESOURCE
      ===================================================== */}

      <td>
        <select
          value={
            row.resourceId
          }
          onChange={(
            event
          ) =>
            onResourceFieldChange(
              row.id,
              'resourceId',
              event.target.value
            )
          }
          disabled={
            !editable
          }
        >
          <option value="">
            Select Resource
          </option>

          {resources.map(
            (
              resource
            ) => (
              <option
                key={
                  resource.resourceid
                }
                value={
                  resource.resourceid
                }
              >
                {
                  resource.resourceid
                }

                {' - '}

                {
                  resource.firstname
                }

                {' '}

                {
                  resource.lastname ||
                  ''
                }
              </option>
            )
          )}
        </select>
      </td>

      {/* =====================================================
          COUNTRY
      ===================================================== */}

      <td>
        <input
          value={
            row.country ||
            ''
          }
          readOnly
          placeholder="Auto"
        />
      </td>

      {/* =====================================================
          DESIGNATION
      ===================================================== */}

      <td>
        <input
          value={
            row.designation ||
            ''
          }
          readOnly
          placeholder="Auto"
        />
      </td>

      {/* =====================================================
          WORK LOCATION
      ===================================================== */}

      <td>
        <select
          value={
            row.workLocation
          }
          onChange={(
            event
          ) =>
            onResourceFieldChange(
              row.id,
              'workLocation',
              event.target.value
            )
          }
          disabled={
            !editable
          }
        >
          <option value="">
            Select
          </option>

          {workLocations.map(
            (
              location
            ) => (
              <option
                key={
                  location
                }
                value={
                  location
                }
              >
                {
                  location
                }
              </option>
            )
          )}
        </select>
      </td>

      {/* =====================================================
          GENERATED WEEK VALUES
      ===================================================== */}

      {generatedWeeks.map(
        (
          week
        ) => (
          <td
            key={
              week.id
            }
            className="editable-week-cell"
          >
            <input
              type="number"
              min="0"
              max="100"
              value={
                row.weeklyValues?.[
                  week.id
                ] ?? ''
              }
              onChange={(
                event
              ) =>
                onWeekValueChange(
                  row.id,
                  week.id,
                  event.target.value
                )
              }
              disabled={
                !editable
              }
              placeholder="0"
              title="Planned resource allocation percentage"
            />
          </td>
        )
      )}

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      {editable && (
        <td>
          <div
            style={{
              display:
                'flex',
              flexDirection:
                'column',
              gap:
                '8px',
              minWidth:
                '110px'
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                onApplyWeekValueToAll(
                  row.id
                )
              }
              disabled={
                !row.lastEditedWeekId
              }
              title="Copy the most recently edited percentage to all generated weeks"
            >
              Apply to all
            </button>

            <button
              type="button"
              className="delete-button"
              onClick={() =>
                onRemoveResourceRow(
                  row.id
                )
              }
            >
              Remove
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

/* =========================================================
   WEEKLY RESOURCE PLAN
========================================================= */

function WeeklyResourcePlan({
  generatedWeeks = [],
  resourceRows = [],
  projectRoles = [],
  resources = [],
  viewingInactiveVersion,
  displayedVersionId,
  activeVersionId,
  selectedPhaseId,
  hasUnsavedChanges,
  saving,
  creatingVersion,
  activatingVersionId,
  onAddResourceRow,
  onRemoveResourceRow,
  onResourceFieldChange,
  onWeekValueChange,
  onApplyWeekValueToAll,
  onSavePlan
}) {
  /* =======================================================
     NO GENERATED WEEKS
  ======================================================= */

  if (
    generatedWeeks.length ===
    0
  ) {
    return null;
  }

  /* =======================================================
     EDITABLE STATE
  ======================================================= */

  const editable =
    !viewingInactiveVersion &&
    Boolean(
      activeVersionId
    ) &&
    String(
      displayedVersionId
    ) ===
      String(
        activeVersionId
      );

  const showActionColumn =
    editable;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="project-plan-entry-section">

      {/* =====================================================
          SECTION HEADER
      ===================================================== */}

      <div className="section-heading-row">
        <div>
          <h2>
            Weekly Resource Plan
          </h2>

          <p>
            {viewingInactiveVersion
              ? 'Resource allocations for this Project Version are read-only.'
              : 'Enter planned resource allocation for each generated week.'}
          </p>
        </div>

        {editable && (
          <button
            type="button"
            className="secondary-button"
            onClick={
              onAddResourceRow
            }
            disabled={
              saving ||
              creatingVersion ||
              Boolean(
                activatingVersionId
              )
            }
          >
            + Add Resource Row
          </button>
        )}
      </div>

      {/* =====================================================
          GENERATED PERIOD SUMMARY
      ===================================================== */}

      <div
        style={{
          display:
            'flex',
          gap:
            '16px',
          alignItems:
            'center',
          flexWrap:
            'wrap',
          marginBottom:
            '14px',
          fontSize:
            '13px'
        }}
      >
        <span>
          <strong>
            Planning Period:
          </strong>

          {' '}

          {
            formatDate(
              generatedWeeks[0]
                .startDate
            )
          }

          {' — '}

          {
            formatDate(
              generatedWeeks[
                generatedWeeks.length -
                  1
              ].endDate
            )
          }
        </span>

        <span>
          <strong>
            Weeks:
          </strong>

          {' '}

          {
            generatedWeeks.length
          }
        </span>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="project-entry-grid-wrap">
        <table className="project-entry-grid">
          <thead>
            <tr>
              <th>
                Project Role
              </th>

              <th>
                Skill
              </th>

              <th>
                Planned Resource
              </th>

              <th>
                Country
              </th>

              <th>
                Designation
              </th>

              <th>
                Work Location
              </th>

              {/* =============================================
                  GENERATED WEEK COLUMNS
              ============================================= */}

              {generatedWeeks.map(
                (
                  week
                ) => {
                  const period =
                    getPeriodLabel(
                      week
                    );

                  return (
                    <th
                      key={
                        week.id
                      }
                      className="week-column-header"
                    >
                      <strong>
                        Week{' '}
                        {
                          week.weekNumber
                        }
                      </strong>

                      <span>
                        {
                          period.start
                        }
                      </span>

                      {period.end && (
                        <>
                          <span>
                            to
                          </span>

                          <span>
                            {
                              period.end
                            }
                          </span>
                        </>
                      )}
                    </th>
                  );
                }
              )}

              {showActionColumn && (
                <th>
                  Action
                </th>
              )}
            </tr>
          </thead>

          <tbody>

            {/* =============================================
                RESOURCE ROWS
            ============================================= */}

            {resourceRows.map(
              (
                row
              ) => (
                <ResourceRow
                  key={
                    row.id
                  }
                  row={
                    row
                  }
                  generatedWeeks={
                    generatedWeeks
                  }
                  projectRoles={
                    projectRoles
                  }
                  resources={
                    resources
                  }
                  editable={
                    editable
                  }
                  onRemoveResourceRow={
                    onRemoveResourceRow
                  }
                  onResourceFieldChange={
                    onResourceFieldChange
                  }
                  onWeekValueChange={
                    onWeekValueChange
                  }
                  onApplyWeekValueToAll={
                    onApplyWeekValueToAll
                  }
                />
              )
            )}

            {/* =============================================
                NO RESOURCE ROWS
            ============================================= */}

            {resourceRows.length ===
              0 && (
              <tr>
                <td
                  colSpan={
                    6 +
                    generatedWeeks.length +
                    (
                      showActionColumn
                        ? 1
                        : 0
                    )
                  }
                  style={{
                    textAlign:
                      'center'
                  }}
                >
                  No resource planning rows are available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="project-plan-grid-footer">
        <div className="week-value-help">
          Project Version:{' '}

          <strong>
            V
            {
              displayedVersionId
            }
          </strong>

          {' | Phase: '}

          <strong>
            {
              selectedPhaseId
            }
          </strong>

          {' | '}

          {viewingInactiveVersion
            ? 'Inactive / Read Only'
            : hasUnsavedChanges
              ? 'Active / Unsaved Changes'
              : 'Active / Saved'}
        </div>

        {/* ===============================================
            SAVE BUTTON
        =============================================== */}

        {editable && (
          <button
            type="button"
            onClick={
              onSavePlan
            }
            disabled={
              saving ||
              creatingVersion ||
              Boolean(
                activatingVersionId
              )
            }
          >
            {saving
              ? '⏳ Saving...'
              : hasUnsavedChanges
                ? '💾 Save Changes'
                : '✓ Saved'}
          </button>
        )}
      </div>
    </div>
  );
}

export default WeeklyResourcePlan;