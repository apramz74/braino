import React from "react";
import { ScopeDocument } from "../types";

interface FinalDocumentStepProps {
  scopeDoc: ScopeDocument;
  onStartOver: () => void;
  onBack: () => void;
}

const FinalDocumentStep: React.FC<FinalDocumentStepProps> = ({
  scopeDoc,
  onStartOver,
  onBack,
}) => {
  // Function to format date as "Month Day, Year"
  const getFormattedDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleExport = () => {
    // Create downloadable text content
    let content = `# ${scopeDoc.title}\n`;
    content += `Date: ${getFormattedDate()}\n\n`;
    content += `## Overview\n${scopeDoc.description}\n\n`;
    content += `## Scope Considerations\n\n`;

    // Add all categories and items
    Object.entries(scopeDoc.categories).forEach(([type, items]) => {
      content += `### ${type.replace("_", " ").toUpperCase()}\n`;
      items.forEach((item) => {
        content += `- ${item.content}\n`;
      });
      content += "\n";
    });

    // Create a blob and download link
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scopeDoc.title.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>Scope Document Complete</h2>
        <p className="step-description">
          Your feature scope document is complete. You can export it or start
          over with a new feature.
        </p>
      </div>

      <div className="final-document">
        <div className="document-header final">
          <h1>{scopeDoc.title}</h1>
          <div className="document-meta">
            <span className="document-date">Created: {getFormattedDate()}</span>
          </div>
        </div>

        <div className="document-section">
          <h3>Overview</h3>
          <div className="document-content">
            <p>{scopeDoc.description}</p>
          </div>
        </div>

        <div className="document-section">
          <h3>Scope Considerations</h3>

          {Object.entries(scopeDoc.categories).map(([type, items]) => (
            <div key={type} className="document-category">
              <h4 className={`category-header ${type}`}>
                {type.replace("_", " ").toUpperCase()}
              </h4>
              <ul className="category-items final">
                {items.map((item) => (
                  <li key={item.id} className="category-item">
                    {item.content}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="document-actions">
        <button className="export-btn" onClick={handleExport}>
          Export as Markdown
        </button>
      </div>

      <div className="wizard-nav">
        <button className="back-btn" onClick={onBack}>
          Back to Edit
        </button>
        <button className="start-over-btn" onClick={onStartOver}>
          Start New Document
        </button>
      </div>
    </div>
  );
};

export default FinalDocumentStep;
