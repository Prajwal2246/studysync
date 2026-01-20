import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, AIMode } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateGeminiResponse = async (
  history: ChatMessage[],
  prompt: string,
  mode: AIMode,
  userLocation?: GeolocationCoordinates
): Promise<{ text: string; groundingMetadata?: any }> => {
  
  try {
    const historyContents = history
      .filter(msg => msg.sender !== 'system')
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    // Add the current prompt
    const contents = [
      ...historyContents,
      { role: 'user', parts: [{ text: prompt }] }
    ];

    let modelName = 'gemini-3-flash-preview'; // Default for search
    let tools: any[] = [];
    let toolConfig: any = undefined;

    if (mode === 'search') {
      modelName = 'gemini-3-flash-preview';
      tools = [{ googleSearch: {} }];
    } else if (mode === 'maps') {
      modelName = 'gemini-2.5-flash';
      tools = [{ googleMaps: {} }];
      
      if (userLocation) {
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }
          }
        };
      }
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents as any,
      config: {
        tools: tools.length > 0 ? tools : undefined,
        toolConfig: toolConfig,
        systemInstruction: "You are a helpful meeting assistant. Keep your answers concise and relevant to the conversation. When using maps, provide specific locations."
      }
    });

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const text = response.text || "I couldn't generate a text response.";

    return {
      text,
      groundingMetadata
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "I encountered an error processing your request. Please try again."
    };
  }
};
