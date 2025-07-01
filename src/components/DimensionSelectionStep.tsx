import React, { useState, useEffect } from "react";
import { AgendaDimension, DimensionOption, IdeaShaperState } from "../types";
import { generateDimensionOptions } from "../services/openaiService";

interface DimensionSelectionStepProps {
  ideaShaperState: IdeaShaperState;
  onSelectionMade: (
    dimensionId: string,
    selectedText: string,
    isEdited: boolean
  ) => void;
  onNavigateToDimension: (dimensionId: string) => void;
  onStartOver: () => void;
}

const DimensionSelectionStep: React.FC<DimensionSelectionStepProps> = ({
  ideaShaperState,
  onSelectionMade,
  onNavigateToDimension,
  onStartOver,
}) => {
  const [options, setOptions] = useState<DimensionOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [rerollContext, setRerollContext] = useState("");
  const [showRerollInput, setShowRerollInput] = useState(false);

  const currentDimension = ideaShaperState.agenda.find(
    (dim) => dim.id === ideaShaperState.currentDimensionId
  );

  const currentDimensionIndex = ideaShaperState.agenda.findIndex(
    (dim) => dim.id === ideaShaperState.currentDimensionId
  );

  // Get prior selections for context
  const priorSelections = Object.fromEntries(
    Object.entries(ideaShaperState.selections).map(([dimId, selection]) => [
      dimId,
      selection.selectedOptionText,
    ])
  );

  // Load options when dimension changes
  useEffect(() => {
    if (currentDimension) {
      loadOptions();
    }
  }, [ideaShaperState.currentDimensionId]);

  const loadOptions = async (additionalContext?: string) => {
    if (!currentDimension) return;

    setIsLoading(true);
    setError(null);

    try {
      const generatedOptions = await generateDimensionOptions(
        ideaShaperState.initialIdea,
        currentDimension.name,
        priorSelections,
        additionalContext
      );
      setOptions(generatedOptions);
    } catch (err) {
      console.error("Error generating options:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate options. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReroll = async () => {
    await loadOptions(rerollContext || undefined);
    setShowRerollInput(false);
    setRerollContext("");
  };

  const handleEditOption = (option: DimensionOption) => {
    setEditingOptionId(option.id);
    setEditingText(option.text);
  };

  const handleSaveEdit = () => {
    if (editingOptionId && editingText.trim()) {
      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === editingOptionId
            ? { ...opt, text: editingText.trim(), isEdited: true }
            : opt
        )
      );
    }
    setEditingOptionId(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingOptionId(null);
    setEditingText("");
  };

  const handleSelectOption = (option: DimensionOption) => {
    if (!currentDimension) return;
    onSelectionMade(currentDimension.id, option.text, option.isEdited);
  };

  const getAgendaItemStatus = (dimension: AgendaDimension) => {
    if (dimension.id === ideaShaperState.currentDimensionId) return "active";
    if (ideaShaperState.selections[dimension.id]) return "done";
    return "todo";
  };

  if (!currentDimension) {
    return <div>No dimension selected</div>;
  }

  return (
    <div className="dimension-selection-container">
      {/* Sidebar with agenda */}
      <div className="agenda-sidebar">
        <h3>Project Agenda</h3>
        <div className="agenda-progress">
          {ideaShaperState.agenda.map((dimension, index) => {
            const status = getAgendaItemStatus(dimension);
            return (
              <div
                key={dimension.id}
                className={`agenda-item ${status}`}
                onClick={() =>
                  status === "done"
                    ? onNavigateToDimension(dimension.id)
                    : undefined
                }
              >
                <span className="agenda-number">{index + 1}</span>
                <span className="agenda-name">{dimension.name}</span>
                <span className="agenda-status">
                  {status === "done" && "✓"}
                  {status === "active" && "→"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Persistent insights */}
        <div className="insights-section">
          <div className="insight-item">
            <button className="insight-button">📋 Master Prompt</button>
          </div>
          <div className="insight-item">
            <button className="insight-button">📄 Project Summary</button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="main-content">
        <div className="dimension-header">
          <h2>{currentDimension.name}</h2>
          <p className="dimension-description">
            {currentDimension.description}
          </p>
          <p className="dimension-progress">
            Step {currentDimensionIndex + 1} of {ideaShaperState.agenda.length}
          </p>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="error-close">
              ×
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Generating options for {currentDimension.name}...</p>
          </div>
        ) : (
          <>
            <div className="options-container">
              {options.map((option) => (
                <div key={option.id} className="option-card">
                  {editingOptionId === option.id ? (
                    <div className="edit-form">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="edit-textarea"
                        rows={4}
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button onClick={handleSaveEdit} className="save-btn">
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="option-content">
                        <p className="option-text">{option.text}</p>
                        {option.isEdited && (
                          <span className="edited-badge">Edited</span>
                        )}
                      </div>
                      <div className="option-actions">
                        <button
                          onClick={() => handleEditOption(option)}
                          className="edit-option-btn"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleSelectOption(option)}
                          className="select-btn"
                        >
                          Select & Continue
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="reroll-section">
              {showRerollInput ? (
                <div className="reroll-input-container">
                  <textarea
                    value={rerollContext}
                    onChange={(e) => setRerollContext(e.target.value)}
                    placeholder="Provide additional context for new options (optional)..."
                    className="reroll-input"
                    rows={2}
                  />
                  <div className="reroll-actions">
                    <button
                      onClick={handleReroll}
                      className="reroll-confirm-btn"
                    >
                      Generate New Options
                    </button>
                    <button
                      onClick={() => setShowRerollInput(false)}
                      className="reroll-cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="reroll-buttons">
                  <button onClick={() => loadOptions()} className="reroll-btn">
                    🎲 Re-roll Options
                  </button>
                  <button
                    onClick={() => setShowRerollInput(true)}
                    className="reroll-with-context-btn"
                  >
                    🎲 Re-roll with Guidance...
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <div className="navigation-footer">
          <button onClick={onStartOver} className="start-over-btn">
            Start Over
          </button>
        </div>
      </div>

      <style>{`
        .dimension-selection-container {
          display: flex;
          min-height: 80vh;
          gap: 2rem;
        }

        .agenda-sidebar {
          width: 300px;
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .agenda-sidebar h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
          font-size: 1.2rem;
        }

        .agenda-progress {
          margin-bottom: 2rem;
        }

        .agenda-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .agenda-item.todo {
          background: #f3f4f6;
          color: #6b7280;
        }

        .agenda-item.active {
          background: #dbeafe;
          color: #1d4ed8;
          border: 2px solid #2563eb;
        }

        .agenda-item.done {
          background: #d1fae5;
          color: #065f46;
          cursor: pointer;
        }

        .agenda-item.done:hover {
          background: #a7f3d0;
        }

        .agenda-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .agenda-item.todo .agenda-number {
          background: #d1d5db;
          color: #6b7280;
        }

        .agenda-item.active .agenda-number {
          background: #2563eb;
          color: white;
        }

        .agenda-item.done .agenda-number {
          background: #10b981;
          color: white;
        }

        .agenda-name {
          font-size: 0.9rem;
          font-weight: 500;
          flex-grow: 1;
        }

        .agenda-status {
          font-weight: 600;
        }

        .insights-section {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
        }

        .insight-item {
          margin-bottom: 0.5rem;
        }

        .insight-button {
          width: 100%;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 0.75rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .insight-button:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .main-content {
          flex: 1;
          max-width: 800px;
        }

        .dimension-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .dimension-header h2 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }

        .dimension-description {
          color: #6b7280;
          font-size: 1.1rem;
          margin: 0 0 1rem 0;
          line-height: 1.4;
        }

        .dimension-progress {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }

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

        .error-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #dc2626;
          margin-left: auto;
        }

        .loading-container {
          text-align: center;
          padding: 4rem 2rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .options-container {
          margin-bottom: 2rem;
        }

        .option-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          transition: all 0.2s ease;
        }

        .option-card:hover {
          border-color: #2563eb;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);
        }

        .option-content {
          margin-bottom: 1rem;
          position: relative;
        }

        .option-text {
          font-size: 1rem;
          line-height: 1.6;
          color: #374151;
          margin: 0;
        }

        .edited-badge {
          position: absolute;
          top: -0.5rem;
          right: 0;
          background: #f59e0b;
          color: white;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 600;
        }

        .option-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .edit-option-btn {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .edit-option-btn:hover {
          background: #e5e7eb;
        }

        .select-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .select-btn:hover {
          background: #1d4ed8;
        }

        .edit-form {
          width: 100%;
        }

        .edit-textarea {
          width: 100%;
          padding: 1rem;
          border: 2px solid #2563eb;
          border-radius: 8px;
          font-size: 1rem;
          line-height: 1.6;
          resize: vertical;
          margin-bottom: 1rem;
          outline: none;
        }

        .edit-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .save-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .cancel-btn {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .reroll-section {
          margin-bottom: 2rem;
          text-align: center;
        }

        .reroll-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .reroll-btn, .reroll-with-context-btn {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reroll-btn:hover, .reroll-with-context-btn:hover {
          background: #e5e7eb;
        }

        .reroll-input-container {
          max-width: 500px;
          margin: 0 auto;
        }

        .reroll-input {
          width: 100%;
          padding: 1rem;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          resize: vertical;
          margin-bottom: 1rem;
          outline: none;
        }

        .reroll-input:focus {
          border-color: #2563eb;
        }

        .reroll-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .reroll-confirm-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .reroll-cancel-btn {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .navigation-footer {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .start-over-btn {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-over-btn:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default DimensionSelectionStep;
