const GEMINI_API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent";

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
