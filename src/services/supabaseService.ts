import { createClient } from "@supabase/supabase-js";
import { Template, DocumentHistory } from "../types";

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if we have what we need
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase configuration");
  throw new Error("Supabase configuration is missing");
}

console.log("Initializing Supabase client with URL:", supabaseUrl);

// Create client with proper options
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      "X-Client-Info": "brainstormer-app/1.0.0",
    },
  },
});

// Templates API
export const fetchTemplates = async (): Promise<Template[]> => {
  try {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      throw error;
    }

    return data || [];
  } catch (err: any) {
    // More detailed error logging
    console.error("Exception in fetchTemplates:", err);
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response headers:", err.response.headers);
    }
    throw err;
  }
};

export const createTemplate = async (
  template: Omit<Template, "id">
): Promise<Template> => {
  try {
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
  } catch (err: any) {
    console.error("Exception in createTemplate:", err);
    throw err;
  }
};

export const updateTemplate = async (template: Template): Promise<Template> => {
  try {
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
  } catch (err: any) {
    console.error("Exception in updateTemplate:", err);
    throw err;
  }
};

export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("templates").delete().eq("id", id);

    if (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  } catch (err: any) {
    console.error("Exception in deleteTemplate:", err);
    throw err;
  }
};

// Document History API
export const fetchDocumentHistory = async (): Promise<DocumentHistory[]> => {
  try {
    const { data, error } = await supabase
      .from("document_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching document history:", error);
      throw error;
    }

    return data || [];
  } catch (err: any) {
    console.error("Exception in fetchDocumentHistory:", err);
    throw err;
  }
};

export const saveDocumentToHistory = async (
  document: Omit<Omit<DocumentHistory, "id">, "created_at">
): Promise<DocumentHistory> => {
  try {
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
  } catch (err: any) {
    console.error("Exception in saveDocumentToHistory:", err);
    throw err;
  }
};

export const deleteDocumentFromHistory = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("document_history")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting document from history:", error);
      throw error;
    }
  } catch (err: any) {
    console.error("Exception in deleteDocumentFromHistory:", err);
    throw err;
  }
};
