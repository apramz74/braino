import React, { useState } from "react";
import { generateIdeas } from "../services/openaiService";
import { Idea, ScopeDocument, WizardStep } from "../types";

// Import wizard step components
import InitialPromptStep from "../components/InitialPromptStep";
import ReviewQuestionsStep from "../components/ReviewQuestionsStep";
import DraftScopeStep from "../components/DraftScopeStep";
import FinalDocumentStep from "../components/FinalDocumentStep";
import WizardProgress from "../components/WizardProgress";

const BrainstormPage: React.FC = () => {
  // State for wizard flow
  const [currentStep, setCurrentStep] = useState<WizardStep>("initial-prompt");
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [includedItems, setIncludedItems] = useState<Idea[]>([]);
  const [scopeDoc, setScopeDoc] = useState<ScopeDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle initial prompt submission
  const handlePromptSubmit = async (inputPrompt: string) => {
    setPrompt(inputPrompt);
    setIsLoading(true);
    setError(null);

    try {
      // Call OpenAI API to generate ideas
      const generatedIdeas = await generateIdeas(inputPrompt);
      setIdeas(generatedIdeas);
      setCurrentStep("review-questions");
    } catch (err) {
      console.error("Error generating ideas:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate ideas. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle completion of review questions step
  const handleQuestionsComplete = (selectedItems: Idea[]) => {
    setIncludedItems(selectedItems);
    setCurrentStep("draft-scope");
  };

  // Handle completion of draft step
  const handleDraftComplete = (document: ScopeDocument) => {
    setScopeDoc(document);
    setCurrentStep("final-document");
  };

  // Start over with a new document
  const handleStartOver = () => {
    setCurrentStep("initial-prompt");
    setPrompt("");
    setIdeas([]);
    setIncludedItems([]);
    setScopeDoc(null);
    setError(null);
  };

  // Go back to previous step
  const handleBack = () => {
    switch (currentStep) {
      case "review-questions":
        setCurrentStep("initial-prompt");
        break;
      case "draft-scope":
        setCurrentStep("review-questions");
        break;
      case "final-document":
        setCurrentStep("draft-scope");
        break;
      default:
        break;
    }
  };

  // Render current step based on state
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "initial-prompt":
        return (
          <InitialPromptStep
            onSubmit={handlePromptSubmit}
            isLoading={isLoading}
          />
        );
      case "review-questions":
        return (
          <ReviewQuestionsStep
            ideas={ideas}
            onComplete={handleQuestionsComplete}
            onBack={handleBack}
            error={error}
          />
        );
      case "draft-scope":
        return (
          <DraftScopeStep
            includedItems={includedItems}
            prompt={prompt}
            onComplete={handleDraftComplete}
            onBack={handleBack}
          />
        );
      case "final-document":
        return (
          <FinalDocumentStep
            scopeDoc={scopeDoc!}
            onStartOver={handleStartOver}
            onBack={handleBack}
          />
        );
      default:
        return null;
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
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Brainstorm</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {/* This is a placeholder for any actions that might be in the header */}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Ideas Generated</div>
          <div className="stat-value">{ideas.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Included in Scope</div>
          <div className="stat-value">{includedItems.length || 0}</div>
          {includedItems.length > 0 && (
            <div className="stat-trend trend-up">
              {Math.round((includedItems.length / (ideas.length || 1)) * 100)}%
              selection rate
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Current Step</div>
          <div className="stat-value">{currentStep.replace("-", " ")}</div>
        </div>
      </div>

      <WizardProgress currentStep={currentStep} />

      <div className="page-content">{renderCurrentStep()}</div>
    </div>
  );
};

export default BrainstormPage;
