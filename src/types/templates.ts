// Template interface
export interface Template {
  id: string;
  name: string;
  description: string; // Instructions for how to process user input with this template
  content: string;
  created_at?: string;
  updated_at?: string;
}

// Generated document history interface
export interface DocumentHistory {
  id: string;
  title: string;
  content: string;
  templateId: string;
  created_at?: string;
}
