import React, { useState, useRef } from "react";
import { Eye, RefreshCw } from "lucide-react";
import { generateHTMLMockup } from "../services/openaiService";

interface PastedImage {
  id: string;
  dataUrl: string;
  name: string;
}

interface MockupResult {
  html: string;
  explanation: string;
}

const DesignstormerPage: React.FC = () => {
  const [description, setDescription] = useState<string>("");
  const [pastedImages, setPastedImages] = useState<PastedImage[]>([]);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mockupResult, setMockupResult] = useState<MockupResult | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const newImage: PastedImage = {
              id: `${Date.now()}-${i}`,
              dataUrl,
              name: `Image ${pastedImages.length + 1}`,
            };
            setPastedImages((prev) => [...prev, newImage]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeImage = (imageId: string) => {
    setPastedImages((prev) => prev.filter((img) => img.id !== imageId));
    // Clear hover state if we're removing the currently hovered image
    if (hoveredImageId === imageId) {
      setHoveredImageId(null);
    }
  };

  const handleMouseEnter = (imageId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setHoveredImageId(imageId);
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Extract image data URLs for the API call
      const imageDataUrls = pastedImages.map((img) => img.dataUrl);

      // Call the OpenAI API to generate the mockup
      const result = await generateHTMLMockup(description, imageDataUrls);

      // Debug logging
      console.log("HTML Mockup Result:", result);
      console.log("HTML Content:", result.html);

      setMockupResult(result);
    } catch (err) {
      console.error("Error generating mockup:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate mockup. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewDesignstorm = () => {
    setDescription("");
    setPastedImages([]);
    setMockupResult(null);
    setError(null);
    setHoveredImageId(null);
    setShowPrompt(false);
  };

  const handleRegenerate = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Extract image data URLs for the API call
      const imageDataUrls = pastedImages.map((img) => img.dataUrl);

      // Call the OpenAI API to generate the mockup
      const result = await generateHTMLMockup(description, imageDataUrls);

      // Debug logging
      console.log("HTML Mockup Result:", result);
      console.log("HTML Content:", result.html);

      setMockupResult(result);
    } catch (err) {
      console.error("Error generating mockup:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate mockup. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // If we have a result, show the results view
  if (mockupResult) {
    return (
      <div className="page-container">
        <div
          className="page-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.25rem",
          }}
        >
          <h1 style={{ margin: 0 }}>Designstormer</h1>
        </div>

        <div className="page-content">
          <div className="results-container">
            <button onClick={handleNewDesignstorm} className="back-button">
              &lt; New designstorm
            </button>

            <div className="mockup-section">
              <h2>Mockup</h2>
              <div className="mockup-display">
                <iframe
                  srcDoc={mockupResult.html}
                  className="html-iframe"
                  title="Generated Mockup"
                  sandbox="allow-same-origin"
                />
              </div>
              <div className="mockup-actions">
                <button
                  className="action-link"
                  onClick={() => setShowPrompt(!showPrompt)}
                >
                  <Eye size={16} />
                  {showPrompt ? "Hide prompt" : "See prompt"}
                </button>
                <button
                  onClick={handleRegenerate}
                  className="action-link"
                  disabled={isLoading}
                >
                  <RefreshCw
                    size={16}
                    className={isLoading ? "spinning" : ""}
                  />
                  {isLoading ? "Regenerating..." : "Regenerate"}
                </button>
              </div>
            </div>

            <div className="explanation-section">
              <h3>Explanation</h3>
              <div className="explanation-content">
                <p>{mockupResult.explanation}</p>
              </div>
            </div>

            {showPrompt && (
              <div className="prompt-section">
                <h3>Your prompt</h3>
                <div className="prompt-content">
                  <p>{description}</p>
                  {pastedImages.length > 0 && (
                    <div className="prompt-images">
                      <p className="images-label">
                        {pastedImages.length} image
                        {pastedImages.length !== 1 ? "s" : ""} provided:
                      </p>
                      <div className="prompt-images-grid">
                        {pastedImages.map((image) => (
                          <img
                            key={image.id}
                            src={image.dataUrl}
                            alt={image.name}
                            className="prompt-image-thumbnail"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <style>{`
          .results-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 0;
          }

          .back-button {
            background: none;
            border: none;
            color: #3b82f6;
            font-size: 1rem;
            cursor: pointer;
            margin-bottom: 2rem;
            padding: 0;
            text-decoration: none;
          }

          .back-button:hover {
            text-decoration: underline;
          }

          .mockup-section {
            margin-bottom: 3rem;
          }

          .mockup-section h2 {
            font-size: 2rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 1.5rem 0;
            text-align: center;
          }

          .mockup-display {
            border: 3px solid #6b7280;
            border-radius: 12px;
            padding: 1rem;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 600px;
          }

          .html-iframe {
            width: 100%;
            height: 600px;
            border: none;
            border-radius: 8px;
            background: white;
          }

          .mockup-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 1rem;
            padding: 0 1rem;
          }

          .action-link {
            background: none;
            border: none;
            color: #1f2937;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border-radius: 4px;
            transition: background-color 0.2s;
          }

          .action-link:hover:not(:disabled) {
            background-color: #f9fafb;
          }

          .action-link:disabled {
            color: #9ca3af;
            cursor: not-allowed;
          }

          .explanation-section h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 1rem 0;
            text-align: center;
          }

          .explanation-content {
            border: 2px solid #6b7280;
            border-radius: 8px;
            padding: 1.5rem;
            background: white;
          }

          .explanation-content p {
            margin: 0;
            line-height: 1.6;
            color: #374151;
          }

          .prompt-section {
            margin-bottom: 3rem;
          }

          .prompt-section h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 1rem 0;
            text-align: center;
          }

          .prompt-content {
            border: 2px solid #6b7280;
            border-radius: 8px;
            padding: 1.5rem;
            background: white;
          }

          .prompt-content p {
            margin: 0 0 1rem 0;
            line-height: 1.6;
            color: #374151;
          }

          .prompt-images {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
          }

          .images-label {
            margin: 0 0 0.75rem 0;
            font-size: 0.9rem;
            color: #6b7280;
            font-weight: 500;
          }

          .prompt-images-grid {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .prompt-image-thumbnail {
            width: 48px;
            height: 48px;
            object-fit: cover;
            border-radius: 6px;
            border: 1px solid #d1d5db;
          }



          .spinning {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Show the input form
  return (
    <div className="page-container">
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.25rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Designstormer</h1>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="error-close"
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      <div className="page-content">
        <div className="designstormer-form">
          <div className="form-header">
            <h2>What do you want to see?</h2>
            <p>
              Share what you need to design and if you want, a visual reference
            </p>
          </div>

          <div className="input-section">
            <textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onPaste={handleImagePaste}
              placeholder="Describe what you want to design..."
              className="description-input"
              disabled={isLoading}
            />

            {/* Image badges below the text input with reserved space */}
            <div className="images-container">
              {pastedImages.map((image) => (
                <div
                  key={image.id}
                  className="image-badge"
                  onMouseEnter={(e) => handleMouseEnter(image.id, e)}
                  onMouseLeave={() => setHoveredImageId(null)}
                >
                  <div className="image-preview-container">
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="image-thumbnail"
                    />
                    <span className="image-label">Image</span>
                    {hoveredImageId === image.id && (
                      <button
                        onClick={() => removeImage(image.id)}
                        className="remove-image"
                        type="button"
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              className="submit-button"
              disabled={!description.trim() || isLoading}
            >
              {isLoading ? "Generating mockup..." : "Start designstorming"}
            </button>
          </div>
        </div>
      </div>

      {/* Fixed positioned hover preview */}
      {hoveredImageId && (
        <div
          className="image-hover-preview"
          style={{
            left: hoverPosition.x,
            top: hoverPosition.y,
          }}
        >
          <img
            src={pastedImages.find((img) => img.id === hoveredImageId)?.dataUrl}
            alt="Preview"
          />
        </div>
      )}

      <style>{`
        .designstormer-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem 0;
        }

        .form-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .form-header h2 {
          font-size: 2rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .form-header p {
          font-size: 1.1rem;
          color: #6b7280;
          margin: 0;
        }

        .input-section {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .description-input {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          font-size: 1rem;
          line-height: 1.5;
          resize: vertical;
          min-height: 200px;
          outline: none;
          font-family: inherit;
          margin-bottom: 0;
        }

        .description-input:focus {
          border-color: #3b82f6;
        }

        .description-input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        .description-input::placeholder {
          color: #9ca3af;
        }

        .images-container {
          height: 32px;
          padding: 0.25rem 1rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: flex-start;
          overflow-x: auto;
          overflow-y: visible;
        }

        .image-badge {
          position: relative;
          display: inline-block;
          z-index: 1;
        }

        .image-preview-container {
          position: relative;
          background: #374151;
          border-radius: 6px;
          padding: 0.4rem 0.6rem;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          cursor: pointer;
          transition: all 0.2s ease;
          padding-right: ${hoveredImageId ? "1.8rem" : "0.6rem"};
        }

        .image-preview-container:hover {
          background: #4b5563;
        }

        .image-thumbnail {
          width: 16px;
          height: 16px;
          object-fit: cover;
          border-radius: 3px;
        }

        .image-label {
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .remove-image {
          position: absolute;
          top: 50%;
          right: 0.3rem;
          transform: translateY(-50%);
          background: transparent;
          color: #9ca3af;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          line-height: 1;
          padding: 0.1rem;
          border-radius: 3px;
          transition: color 0.2s ease;
        }

        .remove-image:hover {
          color: #ef4444;
        }

        .remove-image:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .image-hover-preview {
          position: fixed;
          transform: translateX(-50%) translateY(-100%);
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          pointer-events: none;
          margin-top: -10px;
        }

        .image-hover-preview img {
          width: 200px;
          height: 150px;
          object-fit: cover;
          border-radius: 4px;
          display: block;
        }

        .submit-button {
          background: #1f2937;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 2rem;
          transition: background-color 0.2s ease;
          align-self: center;
        }

        .submit-button:hover:not(:disabled) {
          background: #111827;
        }

        .submit-button:disabled {
          background: #d1d5db;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #dc2626;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 2rem;
        }

        .error-icon {
          font-size: 1.2rem;
        }

        .error-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #dc2626;
          margin-left: auto;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default DesignstormerPage;
