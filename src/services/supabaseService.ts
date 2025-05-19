import { createClient } from "@supabase/supabase-js";
import { Template, DocumentHistory } from "../types";

// Initialize the Supabase client using environment variables
// But fallback to hardcoded values if environment variables are not available
// This is a temporary solution for development - remove hardcoded values for production
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://abmhwjlzmlbrlyityeud.supabase.co";
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFibWh3amx6bWxicmx5aXR5ZXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MTk4NTAsImV4cCI6MjA2MzE5NTg1MH0.TAR9SxO9SDkbnhAffgIpVnTssQ5DMw4-P40AJZmlCGE";

// Debug logging to help troubleshoot
console.log(
  "Supabase URL from env:",
  process.env.REACT_APP_SUPABASE_URL ? "Found" : "Not found"
);
console.log(
  "Actually using URL:",
  supabaseUrl ? supabaseUrl.substring(0, 15) + "..." : "None"
);

// Check if we have what we need
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase configuration even after fallback");
  throw new Error("Supabase configuration is missing completely");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Templates API
export const fetchTemplates = async (): Promise<Template[]> => {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }

  return data || [];
};

export const createTemplate = async (
  template: Omit<Template, "id">
): Promise<Template> => {
  const { data, error } = await supabase
    .from("templates")
    .insert({
      name: template.name,
      description: template.description,
      content: template.content,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating template:", error);
    throw error;
  }

  return data;
};

export const updateTemplate = async (template: Template): Promise<Template> => {
  const { data, error } = await supabase
    .from("templates")
    .update({
      name: template.name,
      description: template.description,
      content: template.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", template.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating template:", error);
    throw error;
  }

  return data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase.from("templates").delete().eq("id", id);

  if (error) {
    console.error("Error deleting template:", error);
    throw error;
  }
};

// Document History API
export const fetchDocumentHistory = async (): Promise<DocumentHistory[]> => {
  const { data, error } = await supabase
    .from("document_history")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching document history:", error);
    throw error;
  }

  return data || [];
};

export const saveDocumentToHistory = async (
  document: Omit<Omit<DocumentHistory, "id">, "created_at">
): Promise<DocumentHistory> => {
  const { data, error } = await supabase
    .from("document_history")
    .insert({
      title: document.title,
      content: document.content,
      template_id: document.templateId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving document to history:", error);
    throw error;
  }

  return data;
};

export const deleteDocumentFromHistory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("document_history")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting document from history:", error);
    throw error;
  }
};
