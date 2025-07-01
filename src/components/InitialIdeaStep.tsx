import React, { useState } from "react";

interface InitialIdeaStepProps {
  onSubmit: (idea: string) => void;
  isLoading: boolean;
}

const InitialIdeaStep: React.FC<InitialIdeaStepProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [idea, setIdea] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim()) {
      onSubmit(idea.trim());
    }
  };

  return (
    <div className="initial-idea-container">
      <div className="initial-idea-content">
        <div className="initial-idea-header">
          <h2>What's your idea?</h2>
        </div>

        <form onSubmit={handleSubmit} className="initial-idea-form">
          <div className="input-group">
            <label htmlFor="idea-input" className="input-label">
              Share what you're thinking about. AI will help you structure the
              brainstorming process.
            </label>
            <textarea
              id="idea-input"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your software idea... (e.g., 'A mobile app that helps people find local hiking trails with real-time weather updates')"
              className="idea-input"
              rows={4}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={!idea.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Generating Agenda...
              </>
            ) : (
              "Start brainstorming"
            )}
          </button>
        </form>
      </div>

      <style>{`
        .initial-idea-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 3rem 2rem 2rem 2rem;
        }

        .initial-idea-content {
          max-width: 600px;
          width: 100%;
          text-align: center;
        }

        .initial-idea-header h2 {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          color: #374151;
          font-weight: 600;
          text-align: left;
        }

        .initial-idea-form {
          margin-bottom: 3rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .input-label {
          display: block;
          font-size: 0.9rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .idea-input {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          line-height: 1.5;
          resize: vertical;
          min-height: 120px;
          transition: border-color 0.2s ease;
        }

        .idea-input::placeholder {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .idea-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .idea-input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        .submit-button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 4px;
          font-size: 0.844rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto;
        }

        .submit-button:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .submit-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }


      `}</style>
    </div>
  );
};

export default InitialIdeaStep;
