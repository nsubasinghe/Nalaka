import {
  useEffect
} from 'react';

function PhasePlanningPeriod({
  selectedProjectCode,
  selectedPhaseId,
  displayedVersionId,
  selectedPhase,
  startDate,
  endDate,
  generatedWeeks,
  viewingInactiveVersion,
  creatingVersion,
  activeVersionId,
  activatingVersionId,
  onStartDateChange,
  onEndDateChange,
  onGenerateWeeklyPlan
}) {
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
      ) &&
    !creatingVersion &&
    !activatingVersionId;

  /* =========================================================
     AUTOMATIC WEEK GENERATION

     Generate / refresh the weekly plan automatically once
     both Phase Start Date and End Date contain valid values.

     Using an effect ensures React has already updated both
     date states before week generation runs.
  ========================================================= */

  useEffect(() => {
    if (
      !editable ||
      !selectedProjectCode ||
      !selectedPhaseId ||
      !displayedVersionId ||
      !startDate ||
      !endDate
    ) {
      return;
    }

    if (
      endDate <
      startDate
    ) {
      return;
    }

    onGenerateWeeklyPlan();

  }, [
    startDate,
    endDate,
    editable,
    selectedProjectCode,
    selectedPhaseId,
    displayedVersionId
  ]);

  /* =========================================================
     HIDE UNTIL PROJECT / VERSION / PHASE SELECTED
  ========================================================= */

  if (
    !selectedProjectCode ||
    !selectedPhaseId ||
    !displayedVersionId
  ) {
    return null;
  }

  return (
    <div className="project-plan-entry-section">

      {/* =====================================================
          HEADING
      ===================================================== */}

      <div className="section-heading-row">
        <div>
          <h2>
            Phase Planning Period
          </h2>

          <p>
            {
              selectedPhase
                ?.description
            }

            {' — Project Version '}

            <strong>
              V
              {
                displayedVersionId
              }
            </strong>
          </p>
        </div>
      </div>

      {/* =====================================================
          PHASE DATES
      ===================================================== */}

      <div className="form-grid">
        <label>
          Start Date *

          <input
            type="date"
            value={
              startDate
            }
            onChange={
              onStartDateChange
            }
            disabled={
              !editable
            }
          />
        </label>

        <label>
          End Date *

          <input
            type="date"
            value={
              endDate
            }
            min={
              startDate ||
              undefined
            }
            onChange={
              onEndDateChange
            }
            disabled={
              !editable
            }
          />
        </label>
      </div>

      {/* =====================================================
          WEEK GENERATION INFORMATION
      ===================================================== */}

      {editable &&
        startDate &&
        endDate &&
        endDate >=
          startDate && (
          <div
            style={{
              marginTop:
                '14px'
            }}
          >
            {generatedWeeks.length >
            0 ? (
              <p
                className="message message-success"
                style={{
                  marginBottom:
                    0
                }}
              >
                ✓ {
                  generatedWeeks.length
                } week
                {
                  generatedWeeks.length ===
                  1
                    ? ''
                    : 's'
                } generated automatically
                from the selected phase dates.
              </p>
            ) : (
              <p
                className="page-description"
                style={{
                  marginBottom:
                    0
                }}
              >
                Generating weekly planning periods...
              </p>
            )}
          </div>
        )}

      {/* =====================================================
          MANUAL FALLBACK

          Keep a manual button only as a fallback if automatic
          generation does not yet have any generated weeks.
      ===================================================== */}

      {!viewingInactiveVersion &&
        String(
          displayedVersionId
        ) ===
          String(
            activeVersionId
          ) &&
        startDate &&
        endDate &&
        generatedWeeks.length ===
          0 && (
          <div className="phase-form-actions">
            <button
              type="button"
              onClick={
                onGenerateWeeklyPlan
              }
              disabled={
                !editable ||
                endDate <
                  startDate
              }
            >
              Generate Weekly Plan
            </button>
          </div>
        )}
    </div>
  );
}

export default PhasePlanningPeriod;