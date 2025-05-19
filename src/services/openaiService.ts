import { Idea } from "../types";

const API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

// Ensure you have an API key from environment variables for security
// In development, you can use .env file with REACT_APP_OPENAI_API_KEY
const getApiKey = () => {
  return process.env.REACT_APP_OPENAI_API_KEY;
};

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

/**
 * Generates documentation based on a template and user input
 * @param templateName The name of the template
 * @param templateInstructions Instructions for how to process the user input
 * @param templateContent The template structure with markdown headings
 * @param userInput The user's input content to structure according to the template
 * @returns Generated documentation content in markdown format
 */
export const generateDocumentation = async (
  templateName: string,
  templateInstructions: string,
  templateContent: string,
  userInput: string
): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error(
      "OpenAI API key is missing. Please set the REACT_APP_OPENAI_API_KEY environment variable."
    );
    throw new Error("API key is missing");
  }

  const systemMessage = `
    You are an AI assistant helping to generate documentation based on the following structure and instructions.
    
    Your task is to analyze the user's input and generate a document that follows the template structure.
    Fill in each section with relevant content extracted or derived from the user input.
    Maintain the document's heading structure as defined in the template.
    Ensure the content in each section is coherent, professional, and aligned with the template's purpose.
    If certain information is not available in the user input, make reasonable assumptions or provide placeholder text.
    
    Return the generated document in markdown format, preserving all headings from the template.
  `;

  const userMessage = `
TEMPLATE: ${templateName}

INSTRUCTIONS: ${templateInstructions}

TEMPLATE STRUCTURE:
${templateContent}

USER INPUT:
${userInput}

Please analyze the user input and generate a complete document following the template structure.
`;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano-2025-04-14", // Make sure to use an appropriate model
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || "Failed to fetch from OpenAI API"
      );
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
};

/**
 * Generates brainstorming ideas using OpenAI API
 * @param prompt The user's input prompt about the feature they want to brainstorm
 * @returns An array of idea objects with types and content
 */
export const generateIdeas = async (prompt: string): Promise<Idea[]> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error(
      "OpenAI API key is missing. Please set the REACT_APP_OPENAI_API_KEY environment variable."
    );
    throw new Error("API key is missing");
  }

  const systemMessage = `
    You are a product scope brainstorming assistant helping a product manager think through the scope of a new feature. 
    
    Generate thought-provoking questions about scope considerations for the feature based on the user's prompt.
    Group questions into logical categories.
    
    Return a JSON array of objects without any explanations or other text.
    Each object should have:
    1. "type": one of ["use_case", "feature", "consideration"] based on the question's focus
    2. "content": a clear, concise scope question that would help determine project requirements
    
    For example, if the user is working on a document collaboration feature, you might generate questions like:
    - "What happens if a participant is removed mid-flow? Who inherits their responsibilities?"
    - "Can you enforce dependencies between fields (e.g., manager can't write until employee submits)?"
    - "What does the document 'final version' look like? Is there a full audit trail?"
    
    Focus on questions that help define boundaries, edge cases, user flows, and feature completeness criteria.
    Return at least 8 questions, with a good mix of the different types.
  `;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano-2025-04-14",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || "Failed to fetch from OpenAI API"
      );
    }

    const data: OpenAIResponse = await response.json();

    try {
      // Check if the response is already a JSON array
      let ideasArray;
      const content = data.choices[0].message.content.trim();

      try {
        // First try to parse it directly
        ideasArray = JSON.parse(content);
      } catch (initialParseError) {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          ideasArray = JSON.parse(jsonMatch[1].trim());
        } else {
          throw new Error("Could not extract valid JSON from the response");
        }
      }

      // Validate that we have an array of objects with the right structure
      if (
        !Array.isArray(ideasArray) ||
        !ideasArray.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            "type" in item &&
            "content" in item
        )
      ) {
        throw new Error("Response is not in the expected format");
      }

      // Add unique IDs to each idea
      return ideasArray.map((idea, index) => ({
        ...idea,
        id: `${Date.now()}-${index}`,
      }));
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Raw response content:", data.choices[0].message.content);
      throw new Error("Invalid response format from OpenAI");
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
};
