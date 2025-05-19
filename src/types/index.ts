export interface Idea {
  id: string;
  content: string;
  type: "use_case" | "feature" | "consideration";
  saved?: boolean;
}

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
