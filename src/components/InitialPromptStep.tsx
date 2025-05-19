import React, { useState } from "react";

interface InitialPromptStepProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const InitialPromptStep: React.FC<InitialPromptStepProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="wizard-step">
      <h2
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "1.25rem",
          marginBottom: "0.75rem",
          fontWeight: "600",
        }}
      >
        Describe Your Feature
      </h2>
      <p
        style={{
          marginBottom: "1.5rem",
          color: "var(--text-secondary)",
          fontSize: "0.9375rem",
        }}
      >
        Provide a detailed description of the feature you're scoping. Be
        specific about goals, user needs, and any initial requirements you have
        in mind.
      </p>

      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="input-container">
          <textarea
            placeholder="Describe a feature or product you're scoping (e.g., 'I need a dashboard for tracking project metrics...')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="prompt-input"
            disabled={isLoading}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9375rem",
              lineHeight: "1.5",
              boxShadow: "var(--shadow-sm)",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading || !prompt.trim()}
            style={{
              fontWeight: "500",
              fontSize: "0.9375rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "4px",
            }}
          >
            {isLoading ? (
              <>
                <span className="spinner-small"></span>
                Analyzing...
              </>
            ) : (
              "Generate Scope Questions"
            )}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p style={{ fontSize: "0.9375rem" }}>
            Analyzing your feature and generating key questions...
          </p>
        </div>
      )}
    </div>
  );
};

export default InitialPromptStep;
