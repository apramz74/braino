import { Idea, AgendaDimension, DimensionOption } from "../types";
import { generateMultipleImages } from "./geminiService";

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

/**
 * Generates an agenda of project dimensions based on the initial software idea
 * @param initialIdea The user's initial software idea description
 * @returns An array of agenda dimensions with names and initial status
 */
export const generateAgenda = async (
  initialIdea: string
): Promise<AgendaDimension[]> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error(
      "OpenAI API key is missing. Please set the REACT_APP_OPENAI_API_KEY environment variable."
    );
    throw new Error("API key is missing");
  }

  const systemMessage = `
    You are an AI assistant helping to structure software ideas into comprehensive project dimensions.
    
    Based on the user's initial software idea, generate a logical, ordered list of project dimensions that need to be explored to fully define the software concept.
    
    Each dimension should represent a key aspect of the software that needs to be defined, such as:
    - Target Users & Use Cases
    - Core Features & Functionality  
    - User Experience & Interface
    - Technical Architecture
    - Data & Content Strategy
    - Business Model & Monetization
    - Launch & Growth Strategy
    - Success Metrics & Analytics
    
    Adapt the dimensions to be relevant to the specific software idea provided. The dimensions should be:
    1. Specific to the software type and domain
    2. Ordered logically (foundational concepts first, implementation details later)
    3. Comprehensive enough to fully define the software concept
    4. Between 5-8 dimensions total
    
    Return a JSON array of objects without any explanations or other text.
    Each object should have:
    1. "name": a clear, descriptive name for the dimension (e.g., "Target Users & Use Cases")
    2. "id": a kebab-case identifier derived from the name (e.g., "target-users-use-cases")
    3. "description": a brief 1-sentence description explaining what will be covered in this dimension
    
    Example for a fitness tracking app:
    [
      {"id": "target-users", "name": "Target Users & Goals", "description": "Define who will use the app and what fitness goals they want to achieve."},
      {"id": "core-features", "name": "Core Tracking Features", "description": "Determine the essential tracking capabilities and data the app will capture."},
      {"id": "user-experience", "name": "User Experience & Interface", "description": "Design the user interface approach and key user interaction flows."},
      {"id": "data-insights", "name": "Data & Insights Strategy", "description": "Plan how user data will be analyzed and presented as actionable insights."},
      {"id": "social-features", "name": "Social & Community Features", "description": "Explore social sharing, community building, and motivational features."},
      {"id": "technical-platform", "name": "Technical Platform & Integration", "description": "Choose the technology stack and third-party integrations needed."},
      {"id": "business-model", "name": "Business Model & Monetization", "description": "Define how the app will generate revenue and sustain operations."}
    ]
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
          { role: "user", content: `Software Idea: ${initialIdea}` },
        ],
        temperature: 0.7,
        max_tokens: 1000,
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
      let agendaArray;
      const content = data.choices[0].message.content.trim();

      try {
        // First try to parse it directly
        agendaArray = JSON.parse(content);
      } catch (initialParseError) {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          agendaArray = JSON.parse(jsonMatch[1].trim());
        } else {
          throw new Error("Could not extract valid JSON from the response");
        }
      }

      // Validate that we have an array of objects with the right structure
      if (
        !Array.isArray(agendaArray) ||
        !agendaArray.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            "id" in item &&
            "name" in item &&
            "description" in item
        )
      ) {
        throw new Error("Response is not in the expected format");
      }

      // Add status to each dimension (all start as 'todo')
      return agendaArray.map((dimension) => ({
        ...dimension,
        status: "todo" as const,
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

/**
 * Generates dimension options for a specific project dimension
 * @param initialIdea The user's initial software idea
 * @param dimensionName The name of the current dimension
 * @param priorSelections Previous selections made in earlier dimensions
 * @param additionalContext Optional additional context from user
 * @returns An array of dimension options
 */
export const generateDimensionOptions = async (
  initialIdea: string,
  dimensionName: string,
  priorSelections: { [dimensionId: string]: string },
  additionalContext?: string
): Promise<DimensionOption[]> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error(
      "OpenAI API key is missing. Please set the REACT_APP_OPENAI_API_KEY environment variable."
    );
    throw new Error("API key is missing");
  }

  const priorSelectionsText = Object.entries(priorSelections)
    .map(([dimensionId, selection]) => `- ${dimensionId}: ${selection}`)
    .join("\n");

  const systemMessage = `
    You are an AI assistant helping to generate specific options for a software project dimension.
    
    Based on the initial software idea and any prior dimension selections, generate 2-3 distinct, well-thought-out options for the current dimension.
    
    Each option should be:
    1. Specific and actionable for the given dimension
    2. Coherent with the initial idea and prior selections
    3. Distinct from the other options (different approaches/perspectives)
    4. Detailed enough to be meaningful but concise enough to be easily understood
    5. Directly editable by the user
    
    For dimensions like "Target Users", provide specific user personas or segments.
    For "Core Features", provide specific feature sets or capabilities.
    For "User Experience", provide specific interface approaches or user flows.
    For "Technical Architecture", provide specific tech stack or architectural approaches.
    
    Return a JSON array of objects without any explanations or other text.
    Each object should have:
    1. "text": a detailed description of the option (2-4 sentences)
    2. "id": a unique identifier for the option
    
    Example for "Target Users & Goals" dimension:
    [
      {
        "id": "fitness-beginners",
        "text": "Fitness beginners (ages 25-40) who want to start a healthy lifestyle but feel overwhelmed by complex fitness apps. They need simple, encouraging guidance with basic tracking and achievable goals that build confidence over time."
      },
      {
        "id": "busy-professionals", 
        "text": "Busy professionals (ages 30-45) who have limited time for fitness but want to maintain health. They need efficient, time-conscious workouts and quick progress tracking that fits into their hectic schedules."
      }
    ]
  `;

  const userMessage = `
INITIAL SOFTWARE IDEA: ${initialIdea}

CURRENT DIMENSION: ${dimensionName}

PRIOR SELECTIONS:
${priorSelectionsText || "None yet"}

${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ""}

Generate 2-3 distinct options for the "${dimensionName}" dimension.
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
          { role: "user", content: userMessage },
        ],
        temperature: 0.8,
        max_tokens: 1200,
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
      let optionsArray;
      const content = data.choices[0].message.content.trim();

      try {
        // First try to parse it directly
        optionsArray = JSON.parse(content);
      } catch (initialParseError) {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          optionsArray = JSON.parse(jsonMatch[1].trim());
        } else {
          throw new Error("Could not extract valid JSON from the response");
        }
      }

      // Validate that we have an array of objects with the right structure
      if (
        !Array.isArray(optionsArray) ||
        !optionsArray.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            "id" in item &&
            "text" in item
        )
      ) {
        throw new Error("Response is not in the expected format");
      }

      // Add isEdited flag to each option (all start as false)
      return optionsArray.map((option) => ({
        ...option,
        isEdited: false,
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

/**
 * Generates HTML/CSS mockups based on user description and optional images
 * @param description The user's description of what they want to design
 * @param images Array of image data URLs for visual reference (optional)
 * @returns Object containing HTML markup and explanation
 */
export const generateHTMLMockup = async (
  description: string,
  images: string[] = []
): Promise<{ html: string; explanation: string }> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error(
      "OpenAI API key is missing. Please set the REACT_APP_OPENAI_API_KEY environment variable."
    );
    throw new Error("API key is missing");
  }

  const systemMessage = `
    You are a UI/UX design expert who creates beautiful, modern HTML/CSS mockups that look like real, production-ready web applications.
    
    CRITICAL: Think like a product designer first, then implement. Consider:
    - What is the user trying to accomplish? 
    - What's the context and user journey?
    - How would this fit into a real application?
    - What would users expect to see and interact with?
    
    Your task is to analyze the user's description and any reference images to generate:
    1. A complete HTML mockup with inline CSS that visualizes their design concept AS A REALISTIC WEB APPLICATION
    2. A clear and very concise explanation of your design decisions and layout choices made in the mockup. This should be the minimal amount of words needed to communicate your key points.
    3. An array of specific image prompts for any images needed in the design
    
    COMPOSITION & UX PRINCIPLES (MOST IMPORTANT):
    - Design realistic, contextual interfaces that users would actually encounter
    - Create clear visual hierarchy with purposeful focal points and content flow
    - Use familiar UI patterns and layouts that users expect (headers, navigation, content areas, CTAs)
    - Consider the complete user journey - what comes before/after this screen?
    - Make every element serve a clear purpose in the user's workflow
    - Design with realistic content, not just placeholder text
    - Create balanced, harmonious layouts with intentional whitespace
    - Ensure the interface tells a story and guides users toward their goal
    
    REALISTIC APPLICATION STRUCTURE:
    - Design complete page layouts with proper headers, navigation, main content areas, and footers when appropriate
    - Include contextual elements like breadcrumbs, page titles, progress indicators, or status information
    - Add realistic navigation patterns (tabs, sidebar menus, top nav) that make sense for the use case
    - Consider mobile responsiveness and how the layout would adapt
    - Include appropriate calls-to-action and user flow elements
    
    HTML/CSS IMPLEMENTATION:
    - Create a complete, self-contained HTML document with embedded CSS
    - Use modern CSS with flexbox/grid layouts for professional structure
    - Design with realistic, contextual content that serves the user's actual needs
    - Include proper page structure (header, main content, aside, footer as needed)
    - Use semantic HTML elements that create logical content hierarchy
    - Apply modern design principles with intentional spacing, typography scale, and visual rhythm
    - Include realistic UI components (buttons, forms, cards, navigation) styled consistently
    - Make text highly readable with proper font sizes, line heights, and contrast
    
    CRITICAL - LAYOUT CONSISTENCY & ALIGNMENT:
    - Use ONE consistent container strategy throughout the entire page - don't mix approaches
    - If using max-width containers, ALWAYS center them with "margin: 0 auto"
    - Ensure all page sections (header, main, footer, sidebars) follow the same centering pattern
    - Never mix centered content with left-aligned content in the same design
    - When constraining width, apply the same constraint and centering to ALL major sections
    - Use consistent padding/margins across all containers
    - Align related elements using the same CSS alignment methods (all flexbox OR all text-align, not mixed)
    - Test that all sections visually align when viewed as a complete page
    
    IMPORTANT - Image Guidelines:
    - When you need images in the mockup, use this EXACT format for img tags:
      <img src="PLACEHOLDER_IMAGE_X" alt="descriptive alt text" style="your css styles">
    - Use "PLACEHOLDER_IMAGE_1", "PLACEHOLDER_IMAGE_2", etc. as the src values
    - Always provide descriptive alt text that explains what kind of image is needed
    - For background images in CSS, use: background-image: url('PLACEHOLDER_IMAGE_X');
    - Number your placeholders sequentially (1, 2, 3, etc.)
    
    Styling preferences:
    	• Overall Philosophy: Fast, minimal, elegant. Prioritizes user flow, clarity, and visual hierarchy. No unnecessary decoration — every element supports momentum and focus.
    	• Color Palette: Cool neutrals — soft blacks, deep grays, white, slate. Accent colors include electric blue (#5E6AD2) and teal. Occasional warm tones for alerts. Fully optimized dark mode with high contrast and soft depth.
    	• Typography: Uses Inter. Modern, geometric, highly legible. Small-to-medium font sizes, tight line heights, generous letter spacing. Emphasis via weight, not size.
    	• Layout & Spacing: Grid-based, sharp alignment, clear vertical rhythm. Generous whitespace. Consistent padding (8/16/24px system) to create calm, readable UIs.
    	• Components:
    	  - Minimalist and clean
    	  - Soft shadows and subtle borders for depth
    	  - Buttons: pill or rectangle with slight radius (4–6px), often borderless until hover
    	  - Inputs/switches/dropdowns: sleek, responsive, unintrusive
    	  - Loading states: smooth skeletons or subtle spinners
    	• Motion & Feedback: Fast, understated animations (e.g., modals slide, dropdowns ease). Clear state changes via soft color transitions or motion cues. Never jarring.
    	• Tone & Structure: Opinionated defaults, low configurability. Clean, focused, frictionless interface that "just works" out of the box.
    
    Return your response as a JSON object with this exact structure:
    {
      "html": "<!DOCTYPE html><html><head><style>/* CSS here */</style></head><body>/* HTML content here */</body></html>",
      "explanation": "A clear and very concise explanation of your design decisions and layout choices made in the mockup. This should be the minimal amount of words needed to communicate your key points.",
      "imagePrompts": ["Specific prompt for PLACEHOLDER_IMAGE_1", "Specific prompt for PLACEHOLDER_IMAGE_2", ...]
    }
    
    For imagePrompts, provide specific, detailed prompts for each PLACEHOLDER_IMAGE_X used in your HTML. Consider:
    - The design context and purpose of each image
    - The style that would match the overall design aesthetic
    - Realistic content that would serve the user's needs
    - Professional quality and composition
    
    Example imagePrompts:
    - "Professional headshot of a smiling business person, clean white background, corporate style, high quality portrait"
    - "Modern minimalist logo for a tech startup, clean geometric design, blue and gray colors, vector style"
    - "Screenshot of a clean dashboard interface, modern UI design, charts and metrics, professional software aesthetic"
    
    LAYOUT PATTERNS TO FOLLOW:
    CORRECT consistent centering approach:
    - Wrap all content in one main container with max-width and margin: 0 auto
    - Let all sections (header, main, footer) inherit this centering
    - Use consistent padding across all sections
    
    INCORRECT mixed alignment (AVOID):
    - Different centering methods for different sections
    - Some sections centered, others left-aligned
    - Inconsistent container widths or padding
    
    FINAL REQUIREMENTS:
    - The mockup must look like a screenshot from a real, polished web application
    - Avoid disconnected elements scattered on a page - create cohesive, purposeful layouts
    - Every element should have clear relationships and logical groupings
    - All page sections must be perfectly aligned and follow consistent layout patterns
    - The design should immediately communicate its purpose and guide user actions
    - Include realistic branding, content, and interface elements that users would expect
    - Make it look production-ready, not like a wireframe or design exercise
    - If you include any PLACEHOLDER_IMAGE_X in your HTML, you MUST provide corresponding prompts in the imagePrompts array
  `;

  const imageContext =
    images.length > 0
      ? `\n\nReference images provided: ${images.length} image(s) uploaded for visual context.`
      : "";

  const userMessage = `
Design Request: ${description}${imageContext}

Please create a realistic, production-quality HTML/CSS mockup that looks like a real web application. 

Think about:
- What kind of application or website this would be part of
- What the user is trying to accomplish on this page
- How this fits into their overall journey
- What content and interactions would actually be helpful

CRITICAL: Ensure perfect visual alignment by using consistent container structures and centering methods throughout the entire page. All sections must align perfectly with each other.

Then design and implement a complete, cohesive interface that serves those user needs.

If you include any PLACEHOLDER_IMAGE_X placeholders in your HTML, make sure to provide specific, detailed prompts for each one in the imagePrompts array.
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
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 3000,
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
      let responseObj;
      const content = data.choices[0].message.content.trim();

      try {
        // First try to parse it directly
        responseObj = JSON.parse(content);
      } catch (initialParseError) {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          responseObj = JSON.parse(jsonMatch[1].trim());
        } else {
          throw new Error("Could not extract valid JSON from the response");
        }
      }

      // Validate that we have the expected structure
      if (
        typeof responseObj !== "object" ||
        responseObj === null ||
        !("html" in responseObj) ||
        !("explanation" in responseObj)
      ) {
        throw new Error("Response is not in the expected format");
      }

      // Basic HTML validation
      const htmlContent = responseObj.html;
      if (
        !htmlContent ||
        typeof htmlContent !== "string" ||
        !htmlContent.includes("<html")
      ) {
        throw new Error("Invalid HTML content received");
      }

      // Generate images if prompts were provided
      let finalHtml = responseObj.html;

      try {
        const imagePrompts = responseObj.imagePrompts || [];

        if (imagePrompts.length > 0) {
          console.log(`Generating ${imagePrompts.length} images for mockup...`);

          // Generate images using Gemini with the specific prompts
          const generatedImages = await generateMultipleImages(imagePrompts);

          // Replace PLACEHOLDER_IMAGE_X with actual generated images
          generatedImages.forEach((imageDataUrl, index) => {
            const placeholder = `PLACEHOLDER_IMAGE_${index + 1}`;
            finalHtml = finalHtml.replace(
              new RegExp(placeholder, "g"),
              imageDataUrl
            );
          });

          console.log(
            `Successfully replaced ${generatedImages.length} image placeholders with generated images`
          );
        }
      } catch (imageError) {
        console.warn(
          "Failed to generate images for mockup, using original HTML:",
          imageError
        );
        // Continue with original HTML if image generation fails
      }

      return {
        html: finalHtml,
        explanation: responseObj.explanation,
      };
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
