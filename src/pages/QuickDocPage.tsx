import React, { useState, useRef, useEffect } from "react";
import { generateDocumentation } from "../services/openaiService";
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  fetchDocumentHistory,
  saveDocumentToHistory as saveDocToHistory,
  deleteDocumentFromHistory,
} from "../services/supabaseService";
import { Template, DocumentHistory } from "../types";
import { FileText, BookTemplate } from "lucide-react";

// Simplified Markdown to HTML converter with special handling for display
const markdownToHtml = (markdown: string): string => {
  // First, clean up the markdown by removing empty lines before headings
  // and ensuring only one empty line between sections
  const cleanedMarkdown = markdown
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n+#/g, "\n#") // Remove empty lines before headings
    .replace(/\n{3,}/g, "\n\n"); // Limit consecutive empty lines

  // Track if we're inside a section and the previous line was a heading
  let inSection = false;
  let afterHeading = false;
  let result = "";

  // Process line by line
  const lines = cleanedMarkdown.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines if they're between sections or after a heading
    if (trimmedLine === "") {
      if (afterHeading) {
        // Skip empty line after heading
        continue;
      }

      // Check if next non-empty line is a heading
      let isBeforeHeading = false;
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        if (nextLine === "") continue;
        if (nextLine.startsWith("#")) {
          isBeforeHeading = true;
        }
        break;
      }

      if (isBeforeHeading) {
        // Skip empty line before heading
        continue;
      }

      // Otherwise, render a small spacer
      result += "<div class='editor-line editor-spacer'></div>";
      continue;
    }

    // Process headings and reset section tracking
    if (trimmedLine.startsWith("# ")) {
      result += `<div class='editor-line editor-h1'>${trimmedLine.substring(
        2
      )}</div>`;
      inSection = true;
      afterHeading = true;
    } else if (trimmedLine.startsWith("## ")) {
      result += `<div class='editor-line editor-h2'>${trimmedLine.substring(
        3
      )}</div>`;
      inSection = true;
      afterHeading = true;
    } else if (trimmedLine.startsWith("### ")) {
      result += `<div class='editor-line editor-h3'>${trimmedLine.substring(
        4
      )}</div>`;
      inSection = true;
      afterHeading = true;
    } else if (trimmedLine.startsWith("- ")) {
      // Fix bullet point rendering
      result += `<div class='editor-line editor-bullet'><span class="bullet-marker">•</span> ${trimmedLine.substring(
        2
      )}</div>`;
      afterHeading = false;
    } else if (line.match(/^\d+\.\s/)) {
      // Fix numbered list rendering
      const num = trimmedLine.match(/^\d+/)?.[0] || "1";
      result += `<div class='editor-line editor-numbered'><span class="number-marker">${num}.</span> ${trimmedLine.substring(
        trimmedLine.indexOf(" ") + 1
      )}</div>`;
      afterHeading = false;
    } else {
      result += `<div class='editor-line'>${trimmedLine}</div>`;
      afterHeading = false;
    }
  }

  return result;
};

// HTML to Markdown converter
const htmlToMarkdown = (html: string): string => {
  // Parse the HTML content
  const div = document.createElement("div");
  div.innerHTML = html;

  // Process each line
  const lines = div.querySelectorAll(".editor-line");
  let markdown = "";

  lines.forEach((line) => {
    const text = line.textContent || "";

    if (line.classList.contains("editor-h1")) {
      markdown += `# ${text}\n\n`;
    } else if (line.classList.contains("editor-h2")) {
      markdown += `## ${text}\n\n`;
    } else if (line.classList.contains("editor-h3")) {
      markdown += `### ${text}\n\n`;
    } else if (line.classList.contains("editor-bullet")) {
      markdown += `- ${text}\n`;
    } else if (line.classList.contains("editor-numbered")) {
      markdown += `1. ${text}\n`;
    } else if (text.trim() === "") {
      markdown += "\n";
    } else {
      markdown += `${text}\n\n`;
    }
  });

  return markdown.trim();
};

// Custom editor styles
const editorStyles = `
  .editor-container {
    border: 1px solid #e5e7eb;
    border-radius: 0 0 6px 6px;
    min-height: 150px;
    padding: 12px;
    outline: none;
    font-size: calc(0.9375rem * var(--font-scale));
    line-height: 1.5;
    overflow-y: auto;
    background-color: white;
  }
  
  .editor-container:focus {
    border-color: #3b82f6;
  }
  
  .editor-line {
    margin: 0;
    padding: 4px 0;
    min-height: 24px;
  }
  
  /* Generated document container styles with tighter spacing */
  .generated-document {
    line-height: 1.2;
  }
  
  .generated-document .editor-line {
    padding: 1px 0;
    min-height: 0; /* Allow minimum height to be determined by content */
    margin: 0;
  }
  
  /* Special spacer class for minimal vertical spacing */
  .editor-spacer {
    height: 0.3em !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* Ensure consistent spacing for headings in the generated document */
  .generated-document .editor-h1 {
    margin-top: 1.4em;
    margin-bottom: 0.6em;
    padding-bottom: 0.2em;
    border-bottom: 1px solid rgba(0,0,0,0.1);
  }
  
  .generated-document .editor-h2 {
    margin-top: 1.2em;
    margin-bottom: 0.5em;
  }
  
  .generated-document .editor-h3 {
    margin-top: 1em;
    margin-bottom: 0.4em;
  }
  
  /* Add space after the first heading (document title) */
  .generated-document .editor-h1:first-child {
    margin-top: 0;
  }
  
  /* Ensure proper spacing for list items */
  .generated-document .editor-bullet,
  .generated-document .editor-numbered {
    margin-top: 0.1em;
    margin-bottom: 0.1em;
    padding-top: 0;
    padding-bottom: 0;
    position: relative;
    padding-left: 0; /* Remove left padding since we'll use the marker */
    display: flex;
    align-items: flex-start;
  }
  
  /* Style bullet markers */
  .bullet-marker {
    display: inline-block;
    width: 1.2em;
    margin-right: 0.3em;
    flex-shrink: 0;
  }

  /* Style number markers */
  .number-marker {
    display: inline-block;
    min-width: 1.5em;
    margin-right: 0.3em;
    text-align: right;
    flex-shrink: 0;
  }
  
  /* Regular paragraph spacing */
  .generated-document .editor-line:not(.editor-h1):not(.editor-h2):not(.editor-h3):not(.editor-bullet):not(.editor-numbered):not(.editor-spacer) {
    margin-top: 0.1em;
    margin-bottom: 0.3em;
  }
  
  .editor-h1 {
    font-size: calc(1.5rem * var(--font-scale));
    font-weight: 600;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .editor-h2 {
    font-size: calc(1.25rem * var(--font-scale));
    font-weight: 600;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .editor-h3 {
    font-size: calc(1.125rem * var(--font-scale));
    font-weight: 600;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  /* Additional spacing for document headings */
  .doc-h1 {
    margin-top: 1.2rem;
    margin-bottom: 0.8rem;
  }
  
  .doc-h2 {
    margin-top: 1rem;
    margin-bottom: 0.6rem;
  }
  
  .doc-h3 {
    margin-top: 0.8rem;
    margin-bottom: 0.4rem;
  }
  
  .editor-bullet {
    padding-left: 20px;
    position: relative;
  }
  
  .editor-bullet::before {
    content: "";
    position: absolute;
    left: 0;
  }
  
  .editor-numbered {
    padding-left: 20px;
    position: relative;
  }
  
  .editor-numbered::before {
    content: "";
    position: absolute;
    left: 0;
  }
  
  .editor-toolbar {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 6px 6px 0 0;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-bottom: none;
  }
  
  .toolbar-button {
    padding: 0.5rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    background-color: white;
    font-size: calc(0.875rem * var(--font-scale));
    font-weight: 500;
    cursor: pointer;
  }
  
  .toolbar-button:hover {
    background-color: #f3f4f6;
  }
  
  .toolbar-button.active {
    background-color: #dbeafe;
    color: #1e40af;
    border-color: #93c5fd;
  }
`;

// Function to sanitize markdown content by removing unnecessary empty lines
const sanitizeMarkdown = (markdown: string): string => {
  // First, normalize line endings and ensure consistent formatting
  let sanitized = markdown
    .replace(/\r\n/g, "\n") // Convert Windows line endings to Unix style
    .replace(/\n{3,}/g, "\n\n"); // Limit consecutive empty lines to maximum of 2

  // Split by headings (lines starting with #)
  const headingPattern = /\n(#+\s.*)/g;
  const parts = sanitized.split(headingPattern);

  if (parts.length <= 1) {
    return sanitized; // No headings found, return as is
  }

  // First part is content before any heading
  let result = parts[0].trim();

  // Process each heading and the content that follows it
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i]; // This is the heading (## Goals, etc.)
    const content = i + 1 < parts.length ? parts[i + 1] : ""; // Content after this heading, before next heading

    // Add the heading with exactly one newline before it (if not the first heading)
    if (result.length > 0) {
      result += "\n\n";
    }

    result += heading;

    // Add the content after the heading, properly trimmed
    const trimmedContent = content.trim();
    if (trimmedContent.length > 0) {
      result += "\n\n" + trimmedContent;
    }
  }

  return result;
};

const QuickDocPage: React.FC = () => {
  // State for templates and modal
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string>("");
  const [currentFormat, setCurrentFormat] = useState<string>("");
  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    description: string;
    content: string;
  }>({
    name: "",
    description: "",
    content: "# New Template\n\n## Section 1\n\n## Section 2\n\n## Section 3",
  });
  // State for generated documentation
  const [generatedDoc, setGeneratedDoc] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showGeneratedDoc, setShowGeneratedDoc] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [docHistory, setDocHistory] = useState<DocumentHistory[]>([]);
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"templates" | "history">(
    "templates"
  );
  const [isLoading, setIsLoading] = useState({
    templates: false,
    history: false,
  });
  // Add state for history modal
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const generatedDocRef = useRef<HTMLDivElement>(null);

  // Initialize editor with styles
  useEffect(() => {
    // Add the editor styles to the document
    if (!document.getElementById("editor-styles")) {
      const styleElement = document.createElement("style");
      styleElement.id = "editor-styles";
      styleElement.innerHTML = editorStyles;
      document.head.appendChild(styleElement);
    }
  }, []);

  // Load templates from Supabase on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading((prev) => ({ ...prev, templates: true }));
        const supabaseTemplates = await fetchTemplates();

        // Set templates from Supabase and select the first one if available
        setTemplates(supabaseTemplates);
        if (supabaseTemplates.length > 0) {
          setSelectedTemplate(supabaseTemplates[0]?.id || "");
        }
      } catch (error) {
        console.error("Error loading templates:", error);
        setTemplates([]);
      } finally {
        setIsLoading((prev) => ({ ...prev, templates: false }));
      }
    };

    loadTemplates();
  }, []);

  // Load document history from Supabase on component mount
  useEffect(() => {
    const loadDocumentHistory = async () => {
      try {
        setIsLoading((prev) => ({ ...prev, history: true }));
        const history = await fetchDocumentHistory();
        setDocHistory(history);
      } catch (error) {
        console.error("Error loading document history:", error);
      } finally {
        setIsLoading((prev) => ({ ...prev, history: false }));
      }
    };

    loadDocumentHistory();
  }, []);

  // Handle opening the modal for creating a new template
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingTemplateId("");
    const defaultContent =
      "# New Template\n\n## Section 1\n\n## Section 2\n\n## Section 3";
    setNewTemplate({
      name: "",
      description: "",
      content: defaultContent,
    });
    setShowModal(true);
  };

  // Handle opening the modal for editing an existing template
  const handleOpenEditModal = (template: Template) => {
    setIsEditing(true);
    setEditingTemplateId(template.id);
    setNewTemplate({
      name: template.name,
      description: template.description,
      content: template.content,
    });
    setShowModal(true);
  };

  // Handle template creation or update
  const handleSaveTemplate = async () => {
    try {
      // Get the content from the editor
      const editorContent = editorRef.current
        ? htmlToMarkdown(editorRef.current.innerHTML)
        : newTemplate.content;

      if (isEditing && editingTemplateId) {
        // Update existing template in Supabase
        const updatedTemplate = await updateTemplate({
          id: editingTemplateId,
          name: newTemplate.name,
          description: newTemplate.description,
          content: editorContent,
        });

        // Update local state
        setTemplates(
          templates.map((template) =>
            template.id === editingTemplateId ? updatedTemplate : template
          )
        );
      } else {
        // Create new template in Supabase
        const template = await createTemplate({
          name: newTemplate.name,
          description: newTemplate.description,
          content: editorContent,
        });

        // Update local state
        setTemplates([...templates, template]);
      }

      // Reset state and close modal
      setNewTemplate({
        name: "",
        description: "",
        content:
          "# New Template\n\n## Section 1\n\n## Section 2\n\n## Section 3",
      });
      setShowModal(false);
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template. Please try again.");
    }
  };

  // Handle formatting in the editor
  const handleFormatClick = (format: string) => {
    if (!editorRef.current) return;

    // Get the current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Get the selected line element
    const range = selection.getRangeAt(0);
    let lineElement: Node | null = range.commonAncestorContainer;

    // Make sure we have the line element
    while (lineElement && lineElement.nodeType === Node.TEXT_NODE) {
      const parent: ParentNode | null = lineElement.parentNode;
      if (!parent) break;
      lineElement = parent;
    }

    // Find the .editor-line container
    while (
      lineElement &&
      lineElement !== editorRef.current &&
      !(lineElement as HTMLElement).classList?.contains("editor-line")
    ) {
      const parent: ParentNode | null = lineElement.parentNode;
      if (!parent) break;
      lineElement = parent;
    }

    if (!lineElement || lineElement === editorRef.current) {
      // If there's no proper line element, create a new one with the format
      const newLine = document.createElement("div");
      newLine.className = `editor-line ${
        format !== "" ? `editor-${format}` : ""
      }`;

      // If there's selected text, use it, otherwise use a placeholder
      if (range.toString().trim()) {
        newLine.textContent = range.toString();
      } else {
        if (format === "h1") newLine.textContent = "Heading 1";
        else if (format === "h2") newLine.textContent = "Heading 2";
        else if (format === "h3") newLine.textContent = "Heading 3";
        else if (format === "bullet") newLine.textContent = "Bullet point";
        else if (format === "numbered") newLine.textContent = "Numbered item";
        else newLine.textContent = "";
      }

      // Insert the new line
      range.deleteContents();
      range.insertNode(newLine);

      // Set selection after insertion
      range.selectNodeContents(newLine);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Check if we're toggling the format off
      const element = lineElement as HTMLElement;
      const currentClass = Array.from(element.classList).find(
        (cls) => cls.startsWith("editor-") && cls !== "editor-line"
      );

      // Remove any existing format class
      if (currentClass) {
        element.classList.remove(currentClass);
      }

      // If we're not toggling off, add the new format
      if (currentClass !== `editor-${format}`) {
        element.classList.add(`editor-${format}`);
        setCurrentFormat(format);
      } else {
        setCurrentFormat("");
      }
    }
  };

  // Update the current format based on cursor position
  const updateCurrentFormat = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    const range = selection.getRangeAt(0);
    let element: Node | null = range.commonAncestorContainer;

    // Make sure we have an element node
    while (element && element.nodeType === Node.TEXT_NODE) {
      const parent: ParentNode | null = element.parentNode;
      if (!parent) break;
      element = parent;
    }

    // Find the editor line
    while (
      element &&
      element !== editorRef.current &&
      !(element as HTMLElement).classList?.contains("editor-line")
    ) {
      const parent: ParentNode | null = element.parentNode;
      if (!parent) break;
      element = parent;
    }

    if (element && element !== editorRef.current) {
      const htmlElement = element as HTMLElement;
      const classes = htmlElement.className.split(" ");

      if (classes.includes("editor-h1")) setCurrentFormat("h1");
      else if (classes.includes("editor-h2")) setCurrentFormat("h2");
      else if (classes.includes("editor-h3")) setCurrentFormat("h3");
      else if (classes.includes("editor-bullet")) setCurrentFormat("bullet");
      else if (classes.includes("editor-numbered"))
        setCurrentFormat("numbered");
      else setCurrentFormat("");
    } else {
      setCurrentFormat("");
    }
  };

  // Handle editor interactions
  const handleEditorKeyUp = (e: React.KeyboardEvent) => {
    updateCurrentFormat();
  };

  const handleEditorMouseUp = () => {
    updateCurrentFormat();
  };

  // Handle editor initialization
  useEffect(() => {
    if (showModal && editorRef.current) {
      // Initialize the editor content
      editorRef.current.innerHTML = markdownToHtml(newTemplate.content);

      // Focus the editor
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 100);
    }
  }, [showModal, newTemplate.content]);

  // Handle editor pasting
  const handleEditorPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    // Get plain text
    const text = e.clipboardData.getData("text/plain");

    // Insert at caret position
    document.execCommand("insertText", false, text);
  };

  // Handle documentation generation with OpenAI
  const handleGenerateDocumentation = async () => {
    // Only proceed if a template is selected and user has provided input
    if (!selectedTemplate || !userInput.trim()) return;

    // Find the selected template
    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    setIsGenerating(true);
    setErrorMessage(""); // Clear any previous errors

    try {
      // Call the OpenAI service to generate documentation based on the template and user input
      const generatedContent = await generateDocumentation(
        template.name,
        template.description,
        template.content,
        userInput
      );

      // Clean up the generated content with our sanitize function
      const cleanedContent = sanitizeMarkdown(generatedContent);

      setGeneratedDoc(cleanedContent);
      // Set a default title based on the template name
      setDocumentTitle(`${template.name} - ${new Date().toLocaleDateString()}`);
      setShowGeneratedDoc(true);
    } catch (error) {
      console.error("Error generating documentation:", error);
      // Set error message for user display
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to generate documentation. Please try again later."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle closing the generated document view
  const handleCloseGenerated = () => {
    setShowGeneratedDoc(false);
    setGeneratedDoc("");
    setDocumentTitle("");
    setCopySuccess("");
  };

  // Copy formatted content to clipboard
  const copyToClipboard = () => {
    if (!generatedDocRef.current) return;

    // Create a range and selection
    const range = document.createRange();
    range.selectNode(generatedDocRef.current);

    const selection = window.getSelection();
    if (!selection) return;

    // Clear any current selections
    selection.removeAllRanges();

    // Add the new range to copy formatted content
    selection.addRange(range);

    try {
      // Copy the selection
      document.execCommand("copy");
      selection.removeAllRanges();
      setCopySuccess("Copied to clipboard!");

      // Clear success message after 2 seconds
      setTimeout(() => {
        setCopySuccess("");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      setCopySuccess("Failed to copy. Try again.");
    }
  };

  // Save document to history
  const saveToHistory = async () => {
    if (!selectedTemplate || !generatedDoc) return;

    try {
      const title = documentTitle || `Document ${docHistory.length + 1}`;

      // Save to Supabase
      const savedDocument = await saveDocToHistory({
        title,
        content: generatedDoc,
        templateId: selectedTemplate,
      });

      // Update local state
      setDocHistory([...docHistory, savedDocument]);
      alert("Document saved to history!");
      handleCloseGenerated();
    } catch (error) {
      console.error("Error saving document to history:", error);
      alert("Failed to save document. Please try again.");
    }
  };

  // Clear all document history (with confirmation)
  const clearHistory = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all document history? This cannot be undone."
      )
    ) {
      try {
        // Delete each document from Supabase
        await Promise.all(
          docHistory.map((doc) => deleteDocumentFromHistory(doc.id))
        );

        // Clear local state
        setDocHistory([]);
      } catch (error) {
        console.error("Error clearing history:", error);
        alert("Failed to clear history. Please try again.");
      }
    }
  };

  return (
    <div className="page-container">
      {/* Modified page header with history link - no border-bottom */}
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ margin: 0 }}>QuickDoc</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {/* Add history link in the header */}
          <button
            onClick={() => {
              setShowHistoryModal(true);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary-color)",
              fontSize: "calc(1rem * var(--font-scale))",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              transition: "background-color 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 102, 255, 0.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <FileText size={18} />
            <span>History</span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--primary-light)",
                color: "white",
                borderRadius: "4px",
                height: "20px",
                minWidth: "20px",
                padding: "0 6px",
                fontSize: "calc(0.75rem * var(--font-scale))",
                fontWeight: "600",
              }}
            >
              {docHistory.length}
            </div>
          </button>
        </div>
      </div>

      <div
        className="quickdoc-container"
        style={{
          display: "flex",
          gap: "1.5rem",
          marginTop: "1.5rem",
          height: "calc(100vh - 200px)",
          minHeight: "500px",
        }}
      >
        {/* Create a mega card that contains both sections */}
        <div
          className="mega-card"
          style={{
            display: "flex",
            width: "100%",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow)",
            overflow: "hidden",
            border: "1px solid var(--card-border)",
            backgroundColor: "white",
          }}
        >
          {/* Template Selector (Left Side) */}
          <div
            className="template-selector"
            style={{
              width: "300px",
              borderRight: "1px solid var(--card-border)",
              padding: "0",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "white",
            }}
          >
            {/* Templates header with icon */}
            <div
              className="section-header"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1.25rem 1rem 1rem 1rem",
                fontWeight: "600",
                fontSize: "calc(1.1rem * var(--font-scale))",
                color: "var(--text-primary)",
              }}
            >
              <BookTemplate size={20} />
              <span>Templates</span>
            </div>

            <div
              className="template-list"
              style={{
                overflowY: "auto",
                flex: 1,
                padding: "0 1rem 1rem 1rem",
              }}
            >
              {isLoading.templates ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  Loading templates...
                </div>
              ) : templates.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <p>No templates available yet.</p>
                  <p>Create your first template to get started!</p>
                  <button
                    onClick={handleOpenCreateModal}
                    style={{
                      padding: "0.625rem 1rem",
                      backgroundColor: "var(--primary-color)",
                      color: "white",
                      fontWeight: "600",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "calc(0.9375rem * var(--font-scale))",
                    }}
                  >
                    Create Template
                  </button>
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className={`template-item ${
                      selectedTemplate === template.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "0.5rem",
                      cursor: "pointer",
                      backgroundColor:
                        selectedTemplate === template.id
                          ? "rgba(59, 130, 246, 0.1)"
                          : "white",
                      border:
                        selectedTemplate === template.id
                          ? "1px solid var(--primary-light)"
                          : "1px solid var(--card-border)",
                      position: "relative",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "calc(0.95rem * var(--font-scale))",
                        fontWeight: "600",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {template.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "calc(0.8125rem * var(--font-scale))",
                        color: "var(--text-secondary)",
                        margin: 0,
                        marginBottom: "1rem",
                      }}
                    >
                      {template.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginTop: "auto",
                        fontSize: "calc(0.8125rem * var(--font-scale))",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenEditModal(template);
                        }}
                        style={{
                          color: "var(--primary-color)",
                          textDecoration: "none",
                          transition: "font-weight 0.1s ease",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.fontWeight = "600")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.fontWeight = "normal")
                        }
                      >
                        Edit
                      </a>
                      <a
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Delete template "${template.name}"?`
                            )
                          ) {
                            try {
                              await deleteTemplate(template.id);
                              setTemplates(
                                templates.filter((t) => t.id !== template.id)
                              );
                              if (selectedTemplate === template.id) {
                                // If we deleted the selected template, select another one
                                const remainingTemplates = templates.filter(
                                  (t) => t.id !== template.id
                                );
                                setSelectedTemplate(
                                  remainingTemplates[0]?.id || ""
                                );
                              }
                            } catch (error) {
                              console.error("Error deleting template:", error);
                              alert(
                                "Failed to delete template. Please try again."
                              );
                            }
                          }
                        }}
                        style={{
                          color: "var(--negative)",
                          textDecoration: "none",
                          transition: "font-weight 0.1s ease",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.fontWeight = "600")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.fontWeight = "normal")
                        }
                      >
                        Delete
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            {templates.length > 0 && (
              <button
                onClick={handleOpenCreateModal}
                className="create-template-button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.625rem",
                  backgroundColor: "white",
                  color: "var(--primary-color)",
                  fontWeight: "600",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--primary-color)",
                  cursor: "pointer",
                  fontSize: "calc(0.9375rem * var(--font-scale))",
                  width: "calc(100% - 2rem)",
                  marginTop: "0.5rem",
                  marginLeft: "1rem",
                  marginRight: "1rem",
                  marginBottom: "1rem",
                  transition: "background-color 0.2s, color 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(0, 102, 255, 0.05)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
              >
                Create New Template
              </button>
            )}
          </div>

          {/* Input Area (Right Side) */}
          <div
            className="input-area"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "1.5rem",
              backgroundColor: "#f0f7ff",
            }}
          >
            {!selectedTemplate ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "2rem",
                  backgroundColor: "rgba(0,0,0,0.03)",
                  borderRadius: "var(--radius)",
                  gap: "1rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "calc(1.25rem * var(--font-scale))",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                  }}
                >
                  No template selected
                </h2>
                <p
                  style={{
                    fontSize: "calc(0.9375rem * var(--font-scale))",
                    color: "var(--text-secondary)",
                    maxWidth: "500px",
                  }}
                >
                  {templates.length === 0
                    ? "Please create a template first using the button on the left sidebar."
                    : "Please select a template from the left sidebar to get started."}
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <h2
                    style={{
                      fontSize: "calc(1.1rem * var(--font-scale))",
                      fontWeight: "600",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Input your content for AI analysis
                  </h2>
                  <p
                    style={{
                      fontSize: "calc(0.9375rem * var(--font-scale))",
                      color: "var(--text-secondary)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Describe your project, feature, or idea in detail. The AI
                    will analyze your input and generate documentation based on
                    the selected template.
                  </p>
                </div>

                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "white",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--card-border)",
                    overflow: "hidden",
                    padding: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Describe your project, feature, or product in detail. The more information you provide, the better the AI can generate relevant documentation."
                    style={{
                      flex: 1,
                      border: "none",
                      resize: "none",
                      padding: "0.5rem",
                      fontSize: "calc(0.9375rem * var(--font-scale))",
                      fontFamily: "var(--font-body)",
                      lineHeight: "1.5",
                      outline: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {/* Error message display */}
                  {errorMessage && (
                    <div
                      className="error-message"
                      style={{
                        padding: "0.75rem",
                        backgroundColor: "#FEE2E2",
                        color: "#B91C1C",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "calc(0.875rem * var(--font-scale))",
                        marginBottom: "1rem",
                      }}
                    >
                      {errorMessage}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      className="submit-btn"
                      disabled={
                        !userInput.trim() || !selectedTemplate || isGenerating
                      }
                      onClick={handleGenerateDocumentation}
                      style={{
                        fontWeight: "600",
                        fontSize: "calc(0.9375rem * var(--font-scale))",
                        padding: "0.625rem 1.25rem",
                        borderRadius: "4px",
                      }}
                    >
                      {isGenerating ? (
                        <>
                          <div className="spinner-small"></div>
                          <span style={{ marginLeft: "0.5rem" }}>
                            Generating...
                          </span>
                        </>
                      ) : (
                        "Generate Documentation"
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Generated Documentation Modal */}
      {showGeneratedDoc && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              borderRadius: "var(--radius)",
              maxWidth: "800px",
              width: "90%",
              maxHeight: "90vh",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              className="modal-header"
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "calc(1.25rem * var(--font-scale))",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                Generated Documentation
              </h2>
              <button
                onClick={handleCloseGenerated}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  color: "var(--text-secondary)",
                }}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid var(--card-border)",
              }}
            >
              <div style={{ marginBottom: "0.5rem" }}>
                <label
                  htmlFor="document-title"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "calc(0.875rem * var(--font-scale))",
                    fontWeight: "500",
                  }}
                >
                  Document Title
                </label>
                <input
                  id="document-title"
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Enter a title for this document"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--card-border)",
                    fontSize: "calc(0.9375rem * var(--font-scale))",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>
            </div>

            <div
              className="modal-body"
              style={{
                padding: "1.5rem",
                overflowY: "auto",
                flex: 1,
              }}
            >
              <div
                ref={generatedDocRef}
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "var(--font-body)",
                  fontSize: "calc(0.9375rem * var(--font-scale))",
                  lineHeight: 1.2,
                }}
                className="generated-document"
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(generatedDoc),
                }}
              />
            </div>

            <div
              className="modal-footer"
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                {copySuccess && (
                  <span
                    style={{
                      color: "var(--positive)",
                      fontSize: "calc(0.875rem * var(--font-scale))",
                      marginRight: "1rem",
                    }}
                  >
                    {copySuccess}
                  </span>
                )}
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: "0.625rem 1rem",
                    border: "1px solid var(--card-border)",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "white",
                    color: "var(--text-secondary)",
                    fontSize: "calc(0.9375rem * var(--font-scale))",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy to Clipboard
                </button>
              </div>

              <div>
                <button
                  onClick={handleCloseGenerated}
                  style={{
                    padding: "0.625rem 1rem",
                    border: "1px solid var(--card-border)",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "white",
                    color: "var(--text-secondary)",
                    fontSize: "calc(0.9375rem * var(--font-scale))",
                    fontWeight: "500",
                    cursor: "pointer",
                    marginRight: "0.5rem",
                  }}
                >
                  Close
                </button>
                <button
                  className="submit-btn"
                  style={{
                    padding: "0.625rem 1rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "calc(0.9375rem * var(--font-scale))",
                    fontWeight: "500",
                  }}
                  onClick={saveToHistory}
                >
                  Save to History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Creation/Editing Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              borderRadius: "var(--radius)",
              maxWidth: "800px",
              width: "90%",
              maxHeight: "90vh",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              className="modal-header"
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "calc(1.25rem * var(--font-scale))",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                {isEditing ? "Edit Template" : "Create New Template"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  color: "var(--text-secondary)",
                }}
              >
                &times;
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                padding: "1.5rem",
                overflowY: "auto",
                flex: 1,
              }}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "calc(0.9375rem * var(--font-scale))",
                    fontWeight: "500",
                  }}
                >
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                  placeholder="Enter template name"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--card-border)",
                    fontSize: "calc(0.9375rem * var(--font-scale))",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "calc(0.9375rem * var(--font-scale))",
                    fontWeight: "500",
                  }}
                >
                  Instructions
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate({
                      ...newTemplate,
                      description: e.target.value,
                    })
                  }
                  placeholder="Provide instructions for how to process the user's input and fit it into this template"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--card-border)",
                    fontSize: "calc(0.9375rem * var(--font-scale))",
                    fontFamily: "var(--font-body)",
                    minHeight: "100px",
                    resize: "vertical",
                    lineHeight: "1.5",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "calc(0.9375rem * var(--font-scale))",
                    fontWeight: "500",
                  }}
                >
                  Template Content
                </label>

                <div className="editor-toolbar">
                  <button
                    className={`toolbar-button ${
                      currentFormat === "h1" ? "active" : ""
                    }`}
                    onClick={() => handleFormatClick("h1")}
                    title="Heading 1"
                  >
                    H1
                  </button>
                  <button
                    className={`toolbar-button ${
                      currentFormat === "h2" ? "active" : ""
                    }`}
                    onClick={() => handleFormatClick("h2")}
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    className={`toolbar-button ${
                      currentFormat === "h3" ? "active" : ""
                    }`}
                    onClick={() => handleFormatClick("h3")}
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <span
                    style={{
                      width: "1px",
                      backgroundColor: "var(--card-border)",
                      margin: "0 0.25rem",
                    }}
                  ></span>
                  <button
                    className={`toolbar-button ${
                      currentFormat === "bullet" ? "active" : ""
                    }`}
                    onClick={() => handleFormatClick("bullet")}
                    title="Bullet List"
                  >
                    • List
                  </button>
                  <button
                    className={`toolbar-button ${
                      currentFormat === "numbered" ? "active" : ""
                    }`}
                    onClick={() => handleFormatClick("numbered")}
                    title="Numbered List"
                  >
                    1. List
                  </button>
                </div>

                <div
                  ref={editorRef}
                  className="editor-container"
                  contentEditable
                  onKeyUp={handleEditorKeyUp}
                  onMouseUp={handleEditorMouseUp}
                  onPaste={handleEditorPaste}
                  data-placeholder="Start typing your template content..."
                ></div>

                <p
                  style={{
                    fontSize: "calc(0.8125rem * var(--font-scale))",
                    color: "var(--text-muted)",
                    marginTop: "0.5rem",
                  }}
                >
                  Select text and click a format button to apply formatting.
                  Click the same button again to remove the formatting.
                </p>
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "0.625rem 1rem",
                  border: "1px solid var(--card-border)",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "white",
                  color: "var(--text-secondary)",
                  fontSize: "calc(0.9375rem * var(--font-scale))",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!newTemplate.name.trim()}
                className="submit-btn"
                style={{
                  padding: "0.625rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "calc(0.9375rem * var(--font-scale))",
                  fontWeight: "500",
                  opacity: newTemplate.name.trim() ? 1 : 0.7,
                  cursor: newTemplate.name.trim() ? "pointer" : "not-allowed",
                }}
              >
                {isEditing ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              borderRadius: "var(--radius)",
              maxWidth: "800px",
              width: "90%",
              maxHeight: "90vh",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              className="modal-header"
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "calc(1.25rem * var(--font-scale))",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                Document History
              </h2>
              <div
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                {docHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--negative)",
                      cursor: "pointer",
                      fontSize: "calc(0.875rem * var(--font-scale))",
                    }}
                  >
                    Clear History
                  </button>
                )}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.5rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  &times;
                </button>
              </div>
            </div>

            <div
              className="modal-body"
              style={{
                padding: "1.5rem",
                overflowY: "auto",
                flex: 1,
              }}
            >
              <div
                className="history-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {isLoading.history ? (
                  <div style={{ textAlign: "center", padding: "2rem 0" }}>
                    Loading document history...
                  </div>
                ) : docHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem 0" }}>
                    No saved documents yet. Generate and save a document to see
                    it here!
                  </div>
                ) : (
                  docHistory.map((doc) => (
                    <div
                      key={doc.id}
                      className="history-item"
                      style={{
                        padding: "1rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--card-border)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        position: "relative",
                        backgroundColor: "white",
                      }}
                      onClick={() => {
                        setGeneratedDoc(doc.content);
                        setDocumentTitle(doc.title);
                        setSelectedTemplate(doc.templateId);
                        setShowGeneratedDoc(true);
                        setShowHistoryModal(false);
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "calc(1rem * var(--font-scale))",
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {doc.title}
                        </h3>
                        <span
                          style={{
                            fontSize: "calc(0.75rem * var(--font-scale))",
                            color: "var(--text-muted)",
                          }}
                        >
                          {doc.created_at
                            ? new Date(doc.created_at).toLocaleDateString()
                            : new Date().toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "calc(0.875rem * var(--font-scale))",
                          color: "var(--text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {doc.content.substring(0, 100)}...
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(`Delete document "${doc.title}"?`)
                          ) {
                            try {
                              deleteDocumentFromHistory(doc.id)
                                .then(() => {
                                  setDocHistory(
                                    docHistory.filter(
                                      (item) => item.id !== doc.id
                                    )
                                  );
                                })
                                .catch((error) => {
                                  console.error(
                                    "Error deleting document:",
                                    error
                                  );
                                  alert(
                                    "Failed to delete document. Please try again."
                                  );
                                });
                            } catch (error) {
                              console.error("Error deleting document:", error);
                              alert(
                                "Failed to delete document. Please try again."
                              );
                            }
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: "1rem",
                          right: "1rem",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          padding: "0.25rem",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{
                  padding: "0.625rem 1rem",
                  border: "1px solid var(--card-border)",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "white",
                  color: "var(--text-secondary)",
                  fontSize: "calc(0.9375rem * var(--font-scale))",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickDocPage;
