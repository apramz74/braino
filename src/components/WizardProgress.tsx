import React from "react";
import { WizardStep } from "../types";

interface WizardProgressProps {
  currentStep: WizardStep;
}

const WizardProgress: React.FC<WizardProgressProps> = ({ currentStep }) => {
  const steps: { id: WizardStep; label: string }[] = [
    { id: "initial-prompt", label: "Describe Feature" },
    { id: "review-questions", label: "Review Questions" },
    { id: "draft-scope", label: "Draft Scope" },
    { id: "final-document", label: "Final Document" },
  ];

  // Find current step index
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="wizard-progress">
      {steps.map((step, index) => {
        // Determine step status (completed, current, or upcoming)
        const stepStatus =
          index < currentIndex
            ? "completed"
            : index === currentIndex
            ? "current"
            : "upcoming";

        return (
          <div key={step.id} className={`progress-step ${stepStatus}`}>
            <div className="step-indicator">
              {stepStatus === "completed" ? (
                <span className="step-check">✓</span>
              ) : (
                <span className="step-number">{index + 1}</span>
              )}
            </div>
            <div className="step-label">{step.label}</div>
            {index < steps.length - 1 && <div className="step-connector" />}
          </div>
        );
      })}
    </div>
  );
};

export default WizardProgress;
