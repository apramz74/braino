import React, { useState, useEffect } from "react";
import { Idea, ScopeDocument } from "../types";

interface DraftScopeStepProps {
  includedItems: Idea[];
  prompt: string;
  onComplete: (scopeDoc: ScopeDocument) => void;
  onBack: () => void;
}

const DraftScopeStep: React.FC<DraftScopeStepProps> = ({
  includedItems,
  prompt,
  onComplete,
  onBack,
}) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [categories, setCategories] = useState<Record<string, Idea[]>>({});

  // Auto-generate title from prompt
  useEffect(() => {
    if (!title && prompt) {
      // Extract a title from the prompt (first 50 chars or up to first period)
      const endIndex = Math.min(
        prompt.indexOf(".") > 0 ? prompt.indexOf(".") : 50,
        50
      );
      setTitle(prompt.substring(0, endIndex) + " Scope Document");
    }
  }, [prompt, title]);

  // Auto-generate description from prompt
  useEffect(() => {
    if (!description && prompt) {
      setDescription(prompt);
    }
  }, [prompt, description]);

  // Group included items by type
  useEffect(() => {
    const grouped = includedItems.reduce((groups, item) => {
      const type = item.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
      return groups;
    }, {} as Record<string, Idea[]>);

    setCategories(grouped);
  }, [includedItems]);

  const handleNext = () => {
    const scopeDoc: ScopeDocument = {
      title,
      description,
      includedItems,
      categories,
    };
    onComplete(scopeDoc);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value);
  };

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>Step 3: Review Draft Scope</h2>
        <p className="step-description">
          Review and edit your draft scope document. Make sure the title and
          description accurately represent your feature.
        </p>
      </div>

      <div className="draft-document">
        <div className="document-header">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="document-title-input"
            placeholder="Enter document title"
          />
        </div>

        <div className="document-section">
          <h3>Overview</h3>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            className="document-description"
            placeholder="Describe the feature in detail"
            rows={6}
          />
        </div>

        <div className="document-section">
          <h3>Scope Considerations</h3>
          <p className="section-note">
            The following questions have been included in your scope:
          </p>

          {Object.entries(categories).map(([type, items]) => (
            <div key={type} className="document-category">
              <h4>{type.replace("_", " ").toUpperCase()}</h4>
              <ul className="category-items">
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

      <div className="wizard-nav">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
        <button
          className="next-btn"
          onClick={handleNext}
          disabled={!title.trim() || !description.trim()}
        >
          Finalize Scope Document
        </button>
      </div>
    </div>
  );
};

export default DraftScopeStep;
