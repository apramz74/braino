export interface Idea {
  id: string;
  content: string;
  type: "use_case" | "feature" | "consideration";
  saved?: boolean;
}

// New types for AI Software Idea Shaper
export interface AgendaDimension {
  id: string;
  name: string;
  description: string;
  status: "todo" | "active" | "done";
}

export interface DimensionOption {
  id: string;
  text: string;
  isEdited: boolean;
}

export interface Selection {
  selectedOptionText: string;
  isEdited: boolean;
}

export interface IdeaShaperState {
  initialIdea: string;
  agenda: AgendaDimension[];
  currentDimensionId: string | null;
  selections: { [dimensionId: string]: Selection };
  derivedMasterPrompt: string;
  derivedProjectSummary: string;
}

export type IdeaShaperStep =
  | "initial-idea"
  | "review-agenda"
  | "dimension-selection"
  | "idea-brief"
  | "wireframes";

// Legacy types for backward compatibility
export type WizardStep =
  | "initial-prompt"
  | "review-questions"
  | "draft-scope"
  | "final-document";

export interface ScopeDocument {
  title: string;
  description: string;
  includedItems: Idea[];
  categories: {
    [key: string]: Idea[];
  };
}

// Export template types
export * from "./templates";
