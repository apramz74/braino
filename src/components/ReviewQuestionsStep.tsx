import React, { useState, useEffect } from "react";
import { Idea } from "../types";
import IdeaCard from "./IdeaCard";

interface ReviewQuestionsStepProps {
  ideas: Idea[];
  onComplete: (includedItems: Idea[]) => void;
  onBack: () => void;
  error: string | null;
}

const ReviewQuestionsStep: React.FC<ReviewQuestionsStepProps> = ({
  ideas,
  onComplete,
  onBack,
  error,
}) => {
  const [currentIdeas, setCurrentIdeas] = useState<Idea[]>(ideas);
  const [includedIdeas, setIncludedIdeas] = useState<Idea[]>([]);
  const [isReviewComplete, setIsReviewComplete] = useState<boolean>(false);

  // Group ideas by their type for better organization
  const groupedIdeas = currentIdeas.reduce((groups, idea) => {
    const type = idea.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(idea);
    return groups;
  }, {} as Record<string, Idea[]>);

  const handleDismiss = (id: string) => {
    setCurrentIdeas(currentIdeas.filter((idea) => idea.id !== id));
  };

  const handleInclude = (id: string) => {
    const ideaToInclude = currentIdeas.find((idea) => idea.id === id);

    if (ideaToInclude) {
      setIncludedIdeas([...includedIdeas, { ...ideaToInclude, saved: true }]);
      handleDismiss(id);
    }
  };

  // Check if all questions have been reviewed
  useEffect(() => {
    if (currentIdeas.length === 0 && includedIdeas.length > 0) {
      setIsReviewComplete(true);
    } else {
      setIsReviewComplete(false);
    }
  }, [currentIdeas, includedIdeas]);

  const handleNext = () => {
    onComplete(includedIdeas);
  };

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>Step 2: Review Scope Questions</h2>
        <p className="step-description">
          Review these questions to define your feature's scope. Include
          questions that are important to consider and dismiss those that are
          irrelevant.
        </p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <p>Please check your API key or try again.</p>
        </div>
      )}

      <div className="step-content">
        {Object.keys(groupedIdeas).length > 0 ? (
          <>
            {Object.entries(groupedIdeas).map(([type, typeIdeas]) => (
              <div key={type} className="question-category">
                <h3 className="category-title">{type.replace("_", " ")}</h3>
                <div className="ideas-container">
                  {typeIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      id={idea.id}
                      content={idea.content}
                      type={idea.type}
                      onDismiss={handleDismiss}
                      onSave={handleInclude}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div
            className={`no-items-message ${isReviewComplete ? "hidden" : ""}`}
          >
            <p>No more questions to review.</p>
          </div>
        )}

        {includedIdeas.length > 0 && (
          <div className="included-items-preview">
            <h3>Selected for Scope ({includedIdeas.length})</h3>
            <div className="included-items-list">
              {includedIdeas.map((idea) => (
                <div key={idea.id} className="included-item">
                  <span className="item-type">
                    {idea.type.replace("_", " ")}
                  </span>
                  <span className="item-content">{idea.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="wizard-nav">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
        <button
          className="next-btn"
          onClick={handleNext}
          disabled={includedIdeas.length === 0}
        >
          {isReviewComplete ? "Create Draft Scope" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default ReviewQuestionsStep;
