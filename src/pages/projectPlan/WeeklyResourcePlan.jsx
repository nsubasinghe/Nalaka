import {
  formatDate,
  getWeekPeriodKey,
  workLocations
} from './projectPlanUtils';

/* =========================================================
   FORMAT PERIOD LABEL
========================================================= */

const getPeriodLabel = (displayWeek) => {
  if (
    displayWeek.startDate &&
    displayWeek.endDate
  ) {
    return {
      start:
        formatDate(
          displayWeek.startDate
        ),

      end:
        formatDate(
          displayWeek.endDate
        )
    };
  }

  return {
    start: 'Legacy period',
    end: ''
  };
};

/* =========================================================
   CURRENT VALUE FOR DISPLAY COLUMN
========================================================= */

const getCurrentRowValue = (
  row,
  displayWeek,
  generatedWeeks
) => {
  /* -------------------------------------------------------
     Normal exact-period match
  ------------------------------------------------------- */

  if (
    displayWeek.currentWeekId
  ) {
    return (
      row.weeklyValues[
        displayWeek.currentWeekId
      ] ?? ''
    );
  }

  /* -------------------------------------------------------
     Fallback exact-period search
  ------------------------------------------------------- */

  const matchingWeek =
    generatedWeeks.find(
      (week) =>
        getWeekPeriodKey(
          week
        ) ===
        `${displayWeek.periodStartDate}|${displayWeek.periodEndDate}`
    );

  if (
    !matchingWeek
  ) {
    return '';
  }

  return (
    row.weeklyValues[
      matchingWeek.id
    ] ?? ''
  );
};

/* =========================================================
   HISTORICAL RESOURCE ROW
========================================================= */

function HistoricalResourceRow({
  row,
  displayWeeks,
  projectRoles,
  resources,
  showActionColumn
}) {
  const selectedRole =
    projectRoles.find(
      (role) =>
        String(
          role.projectroleid
        ) ===
        String(
          row.projectRoleId
        )
    );

  const selectedResource =
    resources.find(
      (resource) =>
        String(
          resource.resourceid
        ) ===
        String(
          row.resourceId
        )
    );

  return (
    <tr
      style={{
        opacity: 0.78
      }}
    >
      {/* =================================================
          RECORD TYPE
      ================================================= */}

      <td>
        <span
          style={{
            display:
              'inline-block',
            padding:
              '4px 8px',
            borderRadius:
              '999px',
            fontSize:
              '12px',
            fontWeight:
              700,
            background:
              'rgba(0, 0, 0, 0.06)'
          }}
        >
          Historical
        </span>
      </td>

      {/* =================================================
          PROJECT ROLE
      ================================================= */}

      <td>
        <input
          value={
            selectedRole
              ? `${selectedRole.projectroleid} - ${selectedRole.description}`
              : row.projectRoleId
          }
          readOnly
        />
      </td>

      {/* =================================================
          SKILL
      ================================================= */}

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

      {/* =================================================
          RESOURCE
      ================================================= */}

      <td>
        <input
          value={
            selectedResource
              ? `${selectedResource.resourceid} - ${selectedResource.firstname || ''} ${selectedResource.lastname || ''}`.trim()
              : row.resourceId
          }
          readOnly
        />
      </td>

      {/* =================================================
          COUNTRY
      ================================================= */}

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

      {/* =================================================
          DESIGNATION
      ================================================= */}

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

      {/* =================================================
          WORK LOCATION
      ================================================= */}

      <td>
        <input
          value={
            row.workLocation ||
            ''
          }
          readOnly
        />
      </td>

      {/* =================================================
          HISTORICAL PERIOD VALUES
      ================================================= */}

      {displayWeeks.map(
        (displayWeek) => {
          const value =
            row.weeklyValues[
              displayWeek.id
            ] ?? '';

          return (
            <td
              key={
                displayWeek.id
              }
              className="editable-week-cell"
            >
              <input
                type="number"
                min="0"
                max="100"
                value={
                  value
                }
                readOnly
                disabled
                placeholder="-"
                title={
                  value !== ''
                    ? 'Historical allocation - read only'
                    : ''
                }
              />
            </td>
          );
        }
      )}

      {/* =================================================
          ACTION PLACEHOLDER
      ================================================= */}

      {showActionColumn && (
        <td>
          <span
            style={{
              fontSize:
                '12px',
              opacity:
                0.65
            }}
          >
            Read only
          </span>
        </td>
      )}
    </tr>
  );
}

/* =========================================================
   CURRENT RESOURCE ROW
========================================================= */

function CurrentResourceRow({
  row,
  displayWeeks,
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
      {/* =================================================
          RECORD TYPE
      ================================================= */}

      <td>
        <span
          style={{
            display:
              'inline-block',
            padding:
              '4px 8px',
            borderRadius:
              '999px',
            fontSize:
              '12px',
            fontWeight:
              700,
            background:
              'rgba(0, 128, 0, 0.08)'
          }}
        >
          Current
        </span>
      </td>

      {/* =================================================
          PROJECT ROLE
      ================================================= */}

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
      </td>

      {/* =================================================
          SKILL
      ================================================= */}

      <td>
        <input
          value={
            row.skill
          }
          readOnly
          placeholder="Auto"
        />
      </td>

      {/* =================================================
          PLANNED RESOURCE
      ================================================= */}

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
            (resource) => (
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
                  resource.lastname
                }
              </option>
            )
          )}
        </select>
      </td>

      {/* =================================================
          COUNTRY
      ================================================= */}

      <td>
        <input
          value={
            row.country
          }
          readOnly
          placeholder="Auto"
        />
      </td>

      {/* =================================================
          DESIGNATION
      ================================================= */}

      <td>
        <input
          value={
            row.designation
          }
          readOnly
          placeholder="Auto"
        />
      </td>

      {/* =================================================
          WORK LOCATION
      ================================================= */}

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
            (location) => (
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

      {/* =================================================
          EXACT PERIOD COLUMNS
      ================================================= */}

      {displayWeeks.map(
        (displayWeek) => {
          const currentValue =
            getCurrentRowValue(
              row,
              displayWeek,
              generatedWeeks
            );

          const currentColumn =
            Boolean(
              displayWeek.isCurrent
            );

          const currentWeek =
            generatedWeeks.find(
              (week) =>
                week.id ===
                displayWeek.currentWeekId
            );

          return (
            <td
              key={
                displayWeek.id
              }
              className="editable-week-cell"
            >
              {currentColumn &&
              currentWeek ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    currentValue
                  }
                  onChange={(
                    event
                  ) =>
                    onWeekValueChange(
                      row.id,
                      currentWeek.id,
                      event.target.value
                    )
                  }
                  disabled={
                    !editable
                  }
                  placeholder="0"
                  title="Current planning allocation"
                />
              ) : (
                <input
                  type="text"
                  value=""
                  readOnly
                  disabled
                  placeholder="-"
                  title="Historical period"
                />
              )}
            </td>
          );
        }
      )}

      {/* =================================================
          ACTIONS
      ================================================= */}

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
              title="Copy the most recently edited percentage to all current planning periods"
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
  displayWeeks = [],
  historicalResourceRows = [],
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
     FALLBACK

     Until ProjectPlanPage passes displayWeeks, the
     component can still work with generatedWeeks.
  ======================================================= */

  const resolvedDisplayWeeks =
    displayWeeks.length > 0
      ? displayWeeks
      : generatedWeeks.map(
          (week) => ({
            id:
              week.id,

            year:
              week.year,

            weekNumber:
              week.weekNumber,

            startDate:
              week.startDate,

            endDate:
              week.endDate,

            periodStartDate:
              '',

            periodEndDate:
              '',

            currentWeekId:
              week.id,

            isCurrent:
              true,

            isHistorical:
              false
          })
        );

  if (
    resolvedDisplayWeeks.length ===
      0
  ) {
    return null;
  }

  const editable =
    !viewingInactiveVersion &&
    displayedVersionId ===
      activeVersionId;

  const showActionColumn =
    editable;

  return (
    <div className="project-plan-entry-section">

      {/* =================================================
          SECTION HEADER
      ================================================= */}

      <div className="section-heading-row">
        <div>
          <h2>
            Weekly Resource Plan
          </h2>

          <p>
            {viewingInactiveVersion
              ? 'Historical allocations from this Project Version.'
              : historicalResourceRows.length >
                  0
                ? 'Historical allocations are read-only. Current allocations can be edited and saved.'
                : 'Enter resource allocation for the selected phase.'}
          </p>
        </div>

        {editable && (
          <button
            type="button"
            className="secondary-button"
            onClick={
              onAddResourceRow
            }
          >
            + Add Resource Row
          </button>
        )}
      </div>

      {/* =================================================
          LEGEND
      ================================================= */}

      {historicalResourceRows.length >
        0 && (
        <div
          style={{
            display:
              'flex',
            gap:
              '16px',
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
              Historical
            </strong>
            {' — preserved previous exact-period data'}
          </span>

          <span>
            <strong>
              Current
            </strong>
            {' — active planning period'}
          </span>
        </div>
      )}

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="project-entry-grid-wrap">

        <table className="project-entry-grid">

          <thead>
            <tr>

              <th>
                Record
              </th>

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

              {/* =========================================
                  EXACT PERIOD COLUMNS
              ========================================= */}

              {resolvedDisplayWeeks.map(
                (displayWeek) => {
                  const period =
                    getPeriodLabel(
                      displayWeek
                    );

                  return (
                    <th
                      key={
                        displayWeek.id
                      }
                      className="week-column-header"
                    >
                      <strong>
                        Week{' '}
                        {
                          displayWeek.weekNumber
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

                      <small
                        style={{
                          marginTop:
                            '4px',
                          opacity:
                            0.7
                        }}
                      >
                        {displayWeek.isCurrent
                          ? 'Current'
                          : 'Historical'}
                      </small>
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
                HISTORICAL ROWS FIRST
            ============================================= */}

            {historicalResourceRows.map(
              (row) => (
                <HistoricalResourceRow
                  key={
                    row.id
                  }
                  row={
                    row
                  }
                  displayWeeks={
                    resolvedDisplayWeeks
                  }
                  projectRoles={
                    projectRoles
                  }
                  resources={
                    resources
                  }
                  showActionColumn={
                    showActionColumn
                  }
                />
              )
            )}

            {/* =============================================
                CURRENT ROWS SECOND
            ============================================= */}

            {resourceRows.map(
              (row) => (
                <CurrentResourceRow
                  key={
                    row.id
                  }
                  row={
                    row
                  }
                  displayWeeks={
                    resolvedDisplayWeeks
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
                NO ROWS
            ============================================= */}

            {historicalResourceRows.length ===
              0 &&
              resourceRows.length ===
                0 && (
                <tr>
                  <td
                    colSpan={
                      7 +
                      resolvedDisplayWeeks.length +
                      (showActionColumn
                        ? 1
                        : 0)
                    }
                    style={{
                      textAlign:
                        'center'
                    }}
                  >
                    No resource planning rows are
                    available.
                  </td>
                </tr>
              )}

          </tbody>

        </table>

      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

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

          {historicalResourceRows.length >
            0 && (
            <>
              {' | Historical rows: '}

              <strong>
                {
                  historicalResourceRows.length
                }
              </strong>
            </>
          )}

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