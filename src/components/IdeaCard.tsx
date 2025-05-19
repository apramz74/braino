import React from "react";

interface IdeaCardProps {
  id: string;
  content: string;
  type: "use_case" | "feature" | "consideration";
  onDismiss: (id: string) => void;
  onSave: (id: string) => void;
}

const IdeaCard: React.FC<IdeaCardProps> = ({
  id,
  content,
  type,
  onDismiss,
  onSave,
}) => {
  // Format the content to ensure it ends with a question mark if it's a question
  const formattedContent = content.trim().endsWith("?")
    ? content
    : content.includes("?")
    ? content
    : `${content}?`;

  return (
    <div className={`idea-card ${type}`}>
      <div className="idea-content">
        <span className="idea-type">{type.replace("_", " ")}</span>
        <p>{formattedContent}</p>
      </div>
      <div className="idea-actions">
        <button
          onClick={() => onDismiss(id)}
          className="dismiss-btn"
          aria-label="Exclude from scope"
        >
          Exclude
        </button>
        <button
          onClick={() => onSave(id)}
          className="save-btn"
          aria-label="Include in scope"
        >
          Include
        </button>
      </div>
    </div>
  );
};

export default IdeaCard;
