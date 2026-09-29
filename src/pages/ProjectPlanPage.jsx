import CreateVersionModal from './projectPlan/CreateVersionModal';
import PhasePlanningPeriod from './projectPlan/PhasePlanningPeriod';
import ProjectDetailsSection from './projectPlan/ProjectDetailsSection';
import WeeklyResourcePlan from './projectPlan/WeeklyResourcePlan';
import useProjectPlan from './projectPlan/useProjectPlan';

function ProjectPlanPage() {
  const {
    /* =====================================================
       MASTER DATA
    ===================================================== */

    projectPhases,
    projectRoles,
    resources,

    /* =====================================================
       LOADING / ACTION STATE
    ===================================================== */

    masterDataLoading,
    planLoading,
    saving,
    creatingVersion,
    activatingVersionId,
    versionHistoryLoading,

    /* =====================================================
       PROJECT / VERSION / PHASE
    ===================================================== */

    selectedProjectCode,
    selectedPhaseId,
    activeVersionId,
    displayedVersionId,
    displayedVersionNote,
    viewingInactiveVersion,
    projectVersions,

    /* =====================================================
       PLANNING
    ===================================================== */

    startDate,
    endDate,
    generatedWeeks,
    resourceRows,

    /* =====================================================
       HISTORICAL PLANNING
    ===================================================== */

    displayWeeks,
    historicalResourceRows,

    /* =====================================================
       MESSAGE STATE
    ===================================================== */

    message,
    messageType,
    hasUnsavedChanges,

    /* =====================================================
       CREATE VERSION MODAL
    ===================================================== */

    showCreateVersionModal,
    newVersionNote,
    createVersionError,

    /* =====================================================
       DERIVED DATA
    ===================================================== */

    noActiveVersion,
    uniqueProjects,
    selectedProject,
    selectedPhase,

    /* =====================================================
       PROJECT / VERSION / PHASE HANDLERS
    ===================================================== */

    handleProjectChange,
    handlePhaseChange,
    handleVersionChange,
    handleBackToActiveVersion,

    /* =====================================================
       VERSION CREATION
    ===================================================== */

    handleOpenCreateVersionModal,
    handleCloseCreateVersionModal,
    handleVersionNoteChange,
    handleCreateNewVersion,

    /* =====================================================
       PLANNING PERIOD HANDLERS
    ===================================================== */

    handleStartDateChange,
    handleEndDateChange,
    handleGenerateWeeklyPlan,

    /* =====================================================
       RESOURCE PLAN HANDLERS
    ===================================================== */

    handleAddResourceRow,
    handleRemoveResourceRow,
    handleResourceFieldChange,
    handleWeekValueChange,
    handleApplyWeekValueToAll,
    handleSavePlan
  } = useProjectPlan();

  return (
    <div className="page-wrap">

      {/* ===================================================
          MAIN CARD
      =================================================== */}

      <div className="card project-plan-card">

        {/* =================================================
            PAGE HEADING
        ================================================= */}

        <div className="page-heading">
          <div>
            <h1>
              📊 Project Plan
            </h1>

            <p className="page-description">
              Manage complete project baseline versions
              and phase-level resource planning using
              the phases assigned to each project.
            </p>
          </div>
        </div>

        {/* =================================================
            PROJECT DETAILS
        ================================================= */}

        <ProjectDetailsSection
          selectedProjectCode={
            selectedProjectCode
          }
          displayedVersionId={
            displayedVersionId
          }
          selectedPhaseId={
            selectedPhaseId
          }
          uniqueProjects={
            uniqueProjects
          }
          projectVersions={
            projectVersions
          }
          projectPhases={
            projectPhases
          }
          selectedProject={
            selectedProject
          }
          selectedPhase={
            selectedPhase
          }
          activeVersionId={
            activeVersionId
          }
          displayedVersionNote={
            displayedVersionNote
          }
          viewingInactiveVersion={
            viewingInactiveVersion
          }
          hasUnsavedChanges={
            hasUnsavedChanges
          }
          masterDataLoading={
            masterDataLoading
          }
          versionHistoryLoading={
            versionHistoryLoading
          }
          planLoading={
            planLoading
          }
          creatingVersion={
            creatingVersion
          }
          saving={
            saving
          }
          activatingVersionId={
            activatingVersionId
          }
          onProjectChange={
            handleProjectChange
          }
          onVersionChange={
            handleVersionChange
          }
          onPhaseChange={
            handlePhaseChange
          }
          onOpenCreateVersionModal={
            handleOpenCreateVersionModal
          }
          onBackToActiveVersion={
            handleBackToActiveVersion
          }
        />

        {/* =================================================
            NO ACTIVE VERSION WARNING
        ================================================= */}

        {noActiveVersion && (
          <p className="message message-error">
            ⚠ No active Project Version exists for this
            project.
          </p>
        )}

        {/* =================================================
            INACTIVE VERSION INFORMATION
        ================================================= */}

        {viewingInactiveVersion && (
          <p className="message message-success">
            📚 You are viewing inactive Project Version{' '}
            <strong>
              V{displayedVersionId}
            </strong>
            . This entire baseline is read-only.
          </p>
        )}

        {/* =================================================
            UNSAVED CHANGES WARNING
        ================================================= */}

        {!viewingInactiveVersion &&
          hasUnsavedChanges && (
            <p className="message message-error">
              ⚠ You have unsaved changes in Project
              Version{' '}
              <strong>
                V{displayedVersionId}
              </strong>
              .
            </p>
          )}

        {/* =================================================
            PHASE PLANNING PERIOD
        ================================================= */}

        <PhasePlanningPeriod
          selectedProjectCode={
            selectedProjectCode
          }
          selectedPhaseId={
            selectedPhaseId
          }
          displayedVersionId={
            displayedVersionId
          }
          selectedPhase={
            selectedPhase
          }
          startDate={
            startDate
          }
          endDate={
            endDate
          }
          generatedWeeks={
            generatedWeeks
          }
          viewingInactiveVersion={
            viewingInactiveVersion
          }
          creatingVersion={
            creatingVersion
          }
          activeVersionId={
            activeVersionId
          }
          activatingVersionId={
            activatingVersionId
          }
          onStartDateChange={
            handleStartDateChange
          }
          onEndDateChange={
            handleEndDateChange
          }
          onGenerateWeeklyPlan={
            handleGenerateWeeklyPlan
          }
        />

        {/* =================================================
            PAGE MESSAGE
        ================================================= */}

        {message && (
          <p
            className={`message message-${messageType}`}
          >
            {message}
          </p>
        )}

        {/* =================================================
            WEEKLY RESOURCE PLAN
        ================================================= */}

        <WeeklyResourcePlan
          generatedWeeks={
            generatedWeeks
          }
          displayWeeks={
            displayWeeks
          }
          historicalResourceRows={
            historicalResourceRows
          }
          resourceRows={
            resourceRows
          }
          projectRoles={
            projectRoles
          }
          resources={
            resources
          }
          viewingInactiveVersion={
            viewingInactiveVersion
          }
          displayedVersionId={
            displayedVersionId
          }
          activeVersionId={
            activeVersionId
          }
          selectedPhaseId={
            selectedPhaseId
          }
          hasUnsavedChanges={
            hasUnsavedChanges
          }
          saving={
            saving
          }
          creatingVersion={
            creatingVersion
          }
          activatingVersionId={
            activatingVersionId
          }
          onAddResourceRow={
            handleAddResourceRow
          }
          onRemoveResourceRow={
            handleRemoveResourceRow
          }
          onResourceFieldChange={
            handleResourceFieldChange
          }
          onWeekValueChange={
            handleWeekValueChange
          }
          onApplyWeekValueToAll={
            handleApplyWeekValueToAll
          }
          onSavePlan={
            handleSavePlan
          }
        />

      </div>

      {/* ===================================================
          CREATE PROJECT VERSION MODAL
      =================================================== */}

      <CreateVersionModal
        show={
          showCreateVersionModal
        }
        creatingVersion={
          creatingVersion
        }
        selectedProjectCode={
          selectedProjectCode
        }
        activeVersionId={
          activeVersionId
        }
        newVersionNote={
          newVersionNote
        }
        createVersionError={
          createVersionError
        }
        onClose={
          handleCloseCreateVersionModal
        }
        onVersionNoteChange={
          handleVersionNoteChange
        }
        onCreate={
          handleCreateNewVersion
        }
      />

    </div>
  );
}

export default ProjectPlanPage;