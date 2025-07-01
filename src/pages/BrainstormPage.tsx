import React, { useState } from "react";
import { generateAgenda } from "../services/openaiService";
import { AgendaDimension, IdeaShaperStep, IdeaShaperState } from "../types";

// Import new components for the idea shaper flow
import InitialIdeaStep from "../components/InitialIdeaStep";
import AgendaReviewStep from "../components/AgendaReviewStep";
import DimensionSelectionStep from "../components/DimensionSelectionStep";

const BrainstormPage: React.FC = () => {
  // State for the new AI Software Idea Shaper flow
  const [currentStep, setCurrentStep] =
    useState<IdeaShaperStep>("initial-idea");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Main state for the idea shaper
  const [ideaShaperState, setIdeaShaperState] = useState<IdeaShaperState>({
    initialIdea: "",
    agenda: [],
    currentDimensionId: null,
    selections: {},
    derivedMasterPrompt: "",
    derivedProjectSummary: "",
  });

  // Handle initial idea submission
  const handleInitialIdeaSubmit = async (idea: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate agenda based on the initial idea
      const generatedAgenda = await generateAgenda(idea);

      // Update state with the initial idea and generated agenda
      setIdeaShaperState((prev) => ({
        ...prev,
        initialIdea: idea,
        agenda: generatedAgenda,
        derivedMasterPrompt: `Software Idea: ${idea}`,
        derivedProjectSummary: `Initial Concept: ${idea}`,
      }));

      // Move to the next step (review agenda)
      setCurrentStep("review-agenda");
    } catch (err) {
      console.error("Error generating agenda:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate agenda. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle agenda confirmation
  const handleAgendaConfirm = (editedAgenda: AgendaDimension[]) => {
    // Update the agenda and start with the first dimension
    const updatedAgenda = editedAgenda.map((dim, index) => ({
      ...dim,
      status: index === 0 ? ("active" as const) : ("todo" as const),
    }));

    setIdeaShaperState((prev) => ({
      ...prev,
      agenda: updatedAgenda,
      currentDimensionId: updatedAgenda[0]?.id || null,
    }));

    setCurrentStep("dimension-selection");
  };

  // Handle dimension selection
  const handleSelectionMade = (
    dimensionId: string,
    selectedText: string,
    isEdited: boolean
  ) => {
    // Update selections and agenda status
    setIdeaShaperState((prev) => {
      const updatedSelections = {
        ...prev.selections,
        [dimensionId]: { selectedOptionText: selectedText, isEdited },
      };

      const currentIndex = prev.agenda.findIndex(
        (dim) => dim.id === dimensionId
      );
      const nextIndex = currentIndex + 1;
      const hasNextDimension = nextIndex < prev.agenda.length;

      const updatedAgenda = prev.agenda.map((dim, index) => {
        if (dim.id === dimensionId) {
          return { ...dim, status: "done" as const };
        }
        if (index === nextIndex && hasNextDimension) {
          return { ...dim, status: "active" as const };
        }
        return dim;
      });

      // Update master prompt and project summary
      const selectionsText = Object.entries(updatedSelections)
        .map(([dimId, selection]) => {
          const dimension = prev.agenda.find((d) => d.id === dimId);
          return `${dimension?.name}: ${selection.selectedOptionText}`;
        })
        .join("\n");

      const updatedMasterPrompt = `Software Idea: ${prev.initialIdea}\n\nSelections:\n${selectionsText}`;
      const updatedProjectSummary = `${prev.initialIdea}\n\n${selectionsText}`;

      return {
        ...prev,
        selections: updatedSelections,
        agenda: updatedAgenda,
        currentDimensionId: hasNextDimension
          ? updatedAgenda[nextIndex].id
          : null,
        derivedMasterPrompt: updatedMasterPrompt,
        derivedProjectSummary: updatedProjectSummary,
      };
    });

    // Check if we've completed all dimensions
    const currentIndex = ideaShaperState.agenda.findIndex(
      (dim) => dim.id === dimensionId
    );
    if (currentIndex === ideaShaperState.agenda.length - 1) {
      // Move to idea brief step
      setCurrentStep("idea-brief");
    }
  };

  // Handle navigation to a specific dimension (for revisiting)
  const handleNavigateToDimension = (dimensionId: string) => {
    setIdeaShaperState((prev) => {
      // Clear all selections after this dimension
      const dimensionIndex = prev.agenda.findIndex(
        (dim) => dim.id === dimensionId
      );
      const clearedSelections = { ...prev.selections };

      // Remove selections for dimensions after the target dimension
      prev.agenda.slice(dimensionIndex + 1).forEach((dim) => {
        delete clearedSelections[dim.id];
      });

      // Update agenda status
      const updatedAgenda = prev.agenda.map((dim, index) => {
        if (index < dimensionIndex) return { ...dim, status: "done" as const };
        if (index === dimensionIndex)
          return { ...dim, status: "active" as const };
        return { ...dim, status: "todo" as const };
      });

      return {
        ...prev,
        selections: clearedSelections,
        agenda: updatedAgenda,
        currentDimensionId: dimensionId,
      };
    });

    setCurrentStep("dimension-selection");
  };

  // Start over with a new idea
  const handleStartOver = () => {
    setCurrentStep("initial-idea");
    setIdeaShaperState({
      initialIdea: "",
      agenda: [],
      currentDimensionId: null,
      selections: {},
      derivedMasterPrompt: "",
      derivedProjectSummary: "",
    });
    setError(null);
  };

  // Render current step based on state
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "initial-idea":
        return (
          <InitialIdeaStep
            onSubmit={handleInitialIdeaSubmit}
            isLoading={isLoading}
          />
        );
      case "review-agenda":
        return (
          <AgendaReviewStep
            initialIdea={ideaShaperState.initialIdea}
            agenda={ideaShaperState.agenda}
            onConfirm={handleAgendaConfirm}
            onStartOver={handleStartOver}
          />
        );
      case "dimension-selection":
        return (
          <DimensionSelectionStep
            ideaShaperState={ideaShaperState}
            onSelectionMade={handleSelectionMade}
            onNavigateToDimension={handleNavigateToDimension}
            onStartOver={handleStartOver}
          />
        );
      case "idea-brief":
        return (
          <div className="idea-brief">
            <h2>Your Project Blueprint</h2>
            <p>
              Congratulations! You've completed your AI-guided idea shaping
              process.
            </p>
            <div className="project-summary">
              <h3>Project Summary</h3>
              <pre>{ideaShaperState.derivedProjectSummary}</pre>
            </div>
            <div className="brief-actions">
              <button onClick={handleStartOver} className="secondary-button">
                Start New Idea
              </button>
              <button className="primary-button">
                Generate Key Screen Wireframes
              </button>
            </div>
          </div>
        );
      default:
        return <div>Step not implemented yet</div>;
    }
  };

  return (
    <div className="page-container">
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.25rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Brainstormer</h1>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="error-close"
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      <div className="page-content">{renderCurrentStep()}</div>

      <style>{`
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #dc2626;
        }

        .error-icon {
          font-size: 1.2rem;
        }

        .error-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #dc2626;
          margin-left: auto;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .idea-brief {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .idea-brief h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .idea-brief p {
          font-size: 1.2rem;
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .project-summary {
          background: #f8fafc;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          text-align: left;
        }

        .project-summary h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .project-summary pre {
          font-family: inherit;
          white-space: pre-wrap;
          line-height: 1.6;
          color: #374151;
          margin: 0;
        }

        .brief-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .primary-button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .primary-button:hover {
          background: #1d4ed8;
        }

        .secondary-button {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .secondary-button:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default BrainstormPage;
