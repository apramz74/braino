const GEMINI_API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent";

// Gemini 2.5 Flash endpoint for image understanding
const GEMINI_VISION_API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Get Gemini API key from environment variables
const getGeminiApiKey = () => {
  return process.env.REACT_APP_GEMINI_API_KEY;
};

interface GeminiImageResponse {
  candidates: {
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string; // base64 encoded image data
        };
      }>;
    };
  }[];
}

/**
 * Generates an image using Gemini 2.0 Flash image generation
 * @param prompt The text prompt describing the image to generate
 * @returns Base64 encoded image data URL
 */
export const generateImage = async (prompt: string): Promise<string> => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.error(
      "Gemini API key is missing. Please set the REACT_APP_GEMINI_API_KEY environment variable."
    );
    throw new Error("Gemini API key is missing");
  }

  try {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(
        `Failed to generate image: ${response.status} ${response.statusText}`
      );
    }

    const data: GeminiImageResponse = await response.json();

    // Find the image data in the response
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("No image generated in response");
    }

    const imagePart = candidate.content.parts.find((part) => part.inlineData);
    if (!imagePart?.inlineData) {
      throw new Error("No image data found in response");
    }

    // Return as data URL
    const { mimeType, data: imageData } = imagePart.inlineData;
    return `data:${mimeType};base64,${imageData}`;
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    throw error;
  }
};

/**
 * Generates multiple images based on prompts
 * @param prompts Array of text prompts for image generation
 * @returns Array of base64 encoded image data URLs
 */
export const generateMultipleImages = async (
  prompts: string[]
): Promise<string[]> => {
  try {
    // Generate images in parallel
    const imagePromises = prompts.map((prompt) => generateImage(prompt));
    return await Promise.all(imagePromises);
  } catch (error) {
    console.error("Error generating multiple images:", error);
    throw error;
  }
};

/**
 * Analyzes images using Gemini 2.5 Flash for visual understanding
 * @param images Array of base64 data URLs (e.g., "data:image/jpeg;base64,...")
 * @param context Optional context about what the images should be analyzed for
 * @returns Detailed description of the images for use in design generation
 */
export const analyzeImages = async (
  images: string[],
  context: string = "UI/UX design reference"
): Promise<string> => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.error(
      "Gemini API key is missing. Please set the REACT_APP_GEMINI_API_KEY environment variable."
    );
    throw new Error("Gemini API key is missing");
  }

  if (images.length === 0) {
    return "";
  }

  try {
    // Convert data URLs to the format Gemini expects
    const imageParts = images.map((dataUrl) => {
      // Extract mime type and base64 data from data URL
      const [header, base64Data] = dataUrl.split(",");
      const mimeType = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";

      return {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };
    });

    const prompt = `Analyze these ${images.length} image${
      images.length > 1 ? "s" : ""
    } as user-created mockups or design sketches. 

These images likely contain wireframes, sketches, FigJam mockups, hand-drawn designs, or rough prototypes created by the user to communicate their design ideas.

Focus on identifying and describing:

1. **UI Components & Elements:**
   - What specific interface elements are shown (buttons, forms, navigation, cards, lists, etc.)
   - Text areas, input fields, dropdowns, and interactive elements
   - Icons, images, or media placeholders indicated
   - Navigation patterns (header, sidebar, tabs, breadcrumbs)

2. **Layout & Composition:**
   - Overall page structure and content organization
   - How elements are arranged and grouped together
   - Spatial relationships between different sections
   - Grid patterns, columns, or layout systems suggested

3. **Content Structure:**
   - What types of content areas are defined
   - Hierarchy of information (headings, subheadings, body text)
   - Data or content types being displayed (profiles, listings, dashboards, etc.)
   - Call-to-action buttons and their placement

4. **User Intent & Flow:**
   - What the user is trying to accomplish with this interface
   - Primary actions or workflows suggested by the layout
   - How users would navigate through the interface

5. **Design Patterns:**
   - Any specific UI patterns or conventions being followed
   - Mobile vs desktop considerations if apparent
   - Modern web app patterns vs traditional website structure

Be specific about what you can identify, even if the mockup is rough or sketchy. Translate the user's visual ideas into concrete, implementable design concepts that can guide HTML/CSS development. If multiple images are provided, explain how they relate to each other (different screens, variations, etc.).

Focus on being actionable - describe elements in a way that would help a developer understand exactly what UI components and layout structure to build.`;

    const response = await fetch(
      `${GEMINI_VISION_API_ENDPOINT}?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                ...imageParts,
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Vision API error:", errorText);
      throw new Error(
        `Failed to analyze images: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Extract the text response
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("No analysis generated in response");
    }

    const textPart = candidate.content.parts.find((part: any) => part.text);
    if (!textPart?.text) {
      throw new Error("No text analysis found in response");
    }

    return textPart.text.trim();
  } catch (error) {
    console.error("Error analyzing images with Gemini:", error);
    throw error;
  }
};
