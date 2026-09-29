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
  if (
    !selectedProjectCode ||
    !selectedPhaseId ||
    !displayedVersionId
  ) {
    return null;
  }

  const editable =
    !viewingInactiveVersion &&
    Boolean(activeVersionId) &&
    displayedVersionId ===
      activeVersionId &&
    !creatingVersion &&
    !activatingVersionId;

  return (
    <div className="project-plan-entry-section">
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

      {!viewingInactiveVersion &&
        displayedVersionId ===
          activeVersionId &&
        generatedWeeks.length ===
          0 && (
          <div className="phase-form-actions">
            <button
              type="button"
              onClick={
                onGenerateWeeklyPlan
              }
              disabled={
                !startDate ||
                !endDate
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