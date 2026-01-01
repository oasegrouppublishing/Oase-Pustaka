
import { GoogleGenAI } from "@google/genai";
import { BookCoverForm, GeneratedImage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateBookCover = async (config: BookCoverForm): Promise<GeneratedImage[]> => {
  const images: GeneratedImage[] = [];
  
  // Construct a prompt based on requirements
  let basePrompt = `Create a professional book cover design. `;
  
  if (config.size === 'FRONT_COVER') {
    basePrompt += `This is a Front Cover (Vertical). Title: "${config.title}", Author: "${config.author}". Place the title prominently in high-quality typography. Ensure the background suits the book's theme. IMPORTANT: Keep the top-right corner completely clean for a publisher logo. `;
  } else if (config.size === 'SPINE') {
    basePrompt += `This is a Vertical Book Spine. Title: "${config.title}", Author: "${config.author}". Text should be rotated 90 degrees or stacked vertically. `;
  } else if (config.size === 'BACK_COVER') {
    basePrompt += `This is a Back Cover. It must feature this blurb text: "${config.blurb}". Include space for a barcode at the bottom center or right. IMPORTANT: Keep the bottom-left corner completely clean for a publisher logo. `;
  } else if (config.size === 'CONTENT_LAYOUT') {
    basePrompt += `This is a Horizontal Interior Layout Banner. Plain white background with very subtle artistic flourishes. No text. `;
  }

  basePrompt += `Style: ${config.style}. Genre: ${config.genre}. Trend: ${config.trend}. Texture: ${config.texture}. Idea: ${config.designIdea}. Use high professional publishing quality. `;
  
  const tasks = Array.from({ length: config.imageCount }).map(async (_, idx) => {
    try {
      const parts: any[] = [{ text: `${basePrompt} Variation ${idx + 1}.` }];
      
      // Add reference images if any
      config.references.forEach(base64 => {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: base64.split(',')[1] || base64
          }
        });
      });

      // Selection of standard Gemini aspect ratios based on requested sizes
      let targetAspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "3:4";
      if (config.size === 'SPINE') targetAspectRatio = "9:16";
      else if (config.size === 'CONTENT_LAYOUT') targetAspectRatio = "16:9";
      else if (config.size === 'FRONT_COVER' || config.size === 'BACK_COVER') targetAspectRatio = "3:4";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: targetAspectRatio
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return {
            id: Math.random().toString(36).substr(2, 9),
            url: `data:image/png;base64,${part.inlineData.data}`
          };
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      return null;
    }
    return null;
  });

  const results = await Promise.all(tasks);
  return results.filter(img => img !== null) as GeneratedImage[];
};
