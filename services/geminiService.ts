import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DetectionResult } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the response schema for structured JSON output
const detectionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    detected: {
      type: Type.BOOLEAN,
      description: "Whether a hand showing a number gesture is clearly detected.",
    },
    number: {
      type: Type.INTEGER,
      description: "The number represented by the fingers (0-10). Null if not clear.",
    },
    boundingBox: {
      type: Type.OBJECT,
      description: "The bounding box of the hand, normalized coordinates 0-1000.",
      properties: {
        ymin: { type: Type.INTEGER },
        xmin: { type: Type.INTEGER },
        ymax: { type: Type.INTEGER },
        xmax: { type: Type.INTEGER },
      },
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0 and 1.",
    },
    explanation: {
      type: Type.STRING,
      description: "Brief reason for the detection.",
    },
  },
  required: ["detected", "confidence"],
};

export const detectHandNumber = async (base64Image: string): Promise<DetectionResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: `Analyze this image for a hand gesture showing a specific number (finger counting). 
            Identify the number shown (0-10). 
            Provide a tight bounding box around the hand (normalized 0-1000).
            If no hand or unclear gesture, set detected to false.
            Keep explanation extremely brief (max 3 words) to ensure speed.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: detectionSchema,
        temperature: 0.1, // Low temperature for consistent classification
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    const result = JSON.parse(text) as any;

    // Normalize bounding box to 0-1 range if it exists and is in 0-1000 scale
    let normalizedBox = null;
    if (result.boundingBox) {
      normalizedBox = {
        ymin: result.boundingBox.ymin / 1000,
        xmin: result.boundingBox.xmin / 1000,
        ymax: result.boundingBox.ymax / 1000,
        xmax: result.boundingBox.xmax / 1000,
      };
    }

    return {
      detected: result.detected,
      number: result.number,
      boundingBox: normalizedBox,
      confidence: result.confidence,
      explanation: result.explanation
    };

  } catch (error) {
    console.error("Gemini Detection Error:", error);
    return {
      detected: false,
      number: null,
      boundingBox: null,
      confidence: 0,
      explanation: "Error processing image"
    };
  }
};