import React, { useState } from "react";
import { AgendaDimension } from "../types";

interface AgendaReviewStepProps {
  initialIdea: string;
  agenda: AgendaDimension[];
  onConfirm: (editedAgenda: AgendaDimension[]) => void;
  onStartOver: () => void;
}

const AgendaReviewStep: React.FC<AgendaReviewStepProps> = ({
  initialIdea,
  agenda,
  onConfirm,
  onStartOver,
}) => {
  const [editedAgenda, setEditedAgenda] = useState<AgendaDimension[]>(agenda);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const handleStartEdit = (dimension: AgendaDimension) => {
    setEditingId(dimension.id);
    setEditingName(dimension.name);
    setEditingDescription(dimension.description);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      setEditedAgenda((prev) =>
        prev.map((dim) =>
          dim.id === editingId
            ? {
                ...dim,
                name: editingName.trim(),
                description: editingDescription.trim(),
              }
            : dim
        )
      );
    }
    setEditingId(null);
    setEditingName("");
    setEditingDescription("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingDescription("");
  };

  const handleDelete = (id: string) => {
    setEditedAgenda((prev) => prev.filter((dim) => dim.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newAgenda = [...editedAgenda];
      [newAgenda[index], newAgenda[index - 1]] = [
        newAgenda[index - 1],
        newAgenda[index],
      ];
      setEditedAgenda(newAgenda);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < editedAgenda.length - 1) {
      const newAgenda = [...editedAgenda];
      [newAgenda[index], newAgenda[index + 1]] = [
        newAgenda[index + 1],
        newAgenda[index],
      ];
      setEditedAgenda(newAgenda);
    }
  };

  const handleAddDimension = () => {
    const newId = `custom-${Date.now()}`;
    const newDimension: AgendaDimension = {
      id: newId,
      name: "New Dimension",
      description: "Describe what will be covered in this dimension.",
      status: "todo",
    };
    setEditedAgenda((prev) => [...prev, newDimension]);
    setEditingId(newId);
    setEditingName("New Dimension");
    setEditingDescription("Describe what will be covered in this dimension.");
  };

  const handleConfirm = () => {
    onConfirm(editedAgenda);
  };

  return (
    <div className="agenda-review-container">
      <div className="agenda-review-content">
        <div className="agenda-header">
          <h2>Review your brainstorming agenda</h2>
          <span className="agenda-description">
            Based on your prompt, we've generated a list of dimensions to
            explore. Make sure it looks good!
          </span>
        </div>

        <div className="agenda-list">
          {editedAgenda.map((dimension, index) => (
            <div key={dimension.id} className="agenda-item">
              <div className="agenda-item-content">
                <span className="agenda-number">{index + 1}</span>

                {editingId === dimension.id ? (
                  <div className="edit-form">
                    <div className="edit-fields">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="edit-input edit-name"
                        placeholder="Dimension name"
                        autoFocus
                      />
                      <textarea
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="edit-input edit-description"
                        placeholder="Brief description of what will be covered"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.ctrlKey) handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                    </div>
                    <div className="edit-actions">
                      <button onClick={handleSaveEdit} className="save-btn">
                        ✓
                      </button>
                      <button onClick={handleCancelEdit} className="cancel-btn">
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="agenda-content">
                      <span className="agenda-name">{dimension.name}</span>
                      <span className="agenda-description">
                        {dimension.description}
                      </span>
                    </div>
                    <div className="agenda-actions">
                      <button
                        onClick={() => handleStartEdit(dimension)}
                        className="action-btn edit-btn"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="action-btn move-btn"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === editedAgenda.length - 1}
                        className="action-btn move-btn"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleDelete(dimension.id)}
                        disabled={editedAgenda.length <= 3}
                        className="action-btn delete-btn"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="agenda-controls">
          <button onClick={handleAddDimension} className="add-dimension-btn">
            + Add Dimension
          </button>
        </div>

        <div className="agenda-footer">
          <button onClick={onStartOver} className="secondary-button">
            Start Over
          </button>
          <button onClick={handleConfirm} className="primary-button">
            Confirm & Start with "{editedAgenda[0]?.name}"
          </button>
        </div>
      </div>

      <style>{`
        .agenda-review-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .agenda-header {
          text-align: left;
          margin-bottom: 1.5rem;
        }

        .agenda-header h2 {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          color: #1f2937;
          font-weight: 600;
        }

        .agenda-description {
          font-size: 0.9rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .agenda-list {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 2rem;
        }

        .agenda-item {
          margin-bottom: 0.5rem;
        }

        .agenda-item:last-child {
          margin-bottom: 0;
        }

        .agenda-item-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .agenda-item-content:hover {
          border-color: #2563eb;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
        }

        .agenda-number {
          background: #2563eb;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .agenda-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .agenda-name {
          font-size: 1rem;
          color: #1f2937;
          font-weight: 500;
        }

        .agenda-description {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.3;
        }

        .agenda-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .action-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .edit-btn:hover {
          background: #dbeafe;
          border-color: #2563eb;
        }

        .delete-btn:hover:not(:disabled) {
          background: #fef2f2;
          border-color: #dc2626;
        }

        .edit-form {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          flex-grow: 1;
        }

        .edit-fields {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .edit-input {
          padding: 0.5rem;
          border: 2px solid #2563eb;
          border-radius: 6px;
          outline: none;
          font-family: inherit;
        }

        .edit-name {
          font-size: 1rem;
          font-weight: 500;
        }

        .edit-description {
          font-size: 0.875rem;
          resize: vertical;
          min-height: 2.5rem;
        }

        .edit-actions {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          align-self: flex-start;
        }

        .save-btn {
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .cancel-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .agenda-controls {
          text-align: center;
          margin-bottom: 2rem;
        }

        .add-dimension-btn {
          background: #f3f4f6;
          color: #374151;
          border: 2px dashed #d1d5db;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-dimension-btn:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        .agenda-footer {
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

export default AgendaReviewStep;
