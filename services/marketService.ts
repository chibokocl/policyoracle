
import { GoogleGenAI } from "@google/genai";
import { MarketData } from '../types';

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Helper to sanitize JSON string (duplicated from geminiService to keep modules independent)
const cleanJsonString = (text: string): string => {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  // Check for array
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  
  if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      return text.substring(firstBracket, lastBracket + 1);
  }

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return text.trim();
};

export const getPredictionMarkets = async (queries: string[]): Promise<MarketData[]> => {
  try {
    const ai = getAIClient();
    const modelId = "gemini-2.5-flash"; // Fast model for search

    // If no queries, provide defaults
    const searchTerms = queries.length > 0 ? queries : ["Global Recession Risk", "US Interest Rates", "Oil Price Forecast"];
    
    const prompt = `
      You are a financial intelligence agent.
      
      TASK:
      Search for ACTIVE prediction markets (on Polymarket, Kalshi, PredictIt) OR major financial news headlines related to these topics:
      ${searchTerms.join(', ')}

      INSTRUCTIONS:
      1. Use Google Search to find real trading odds or probability percentages.
      2. If a specific prediction market exists (e.g., "Will Fed cut rates?"), return it.
      3. If NO market exists, find a relevant recent news headline and estimate a "sentiment probability" (0% = Very Negative/Unlikely, 100% = Very Positive/Likely) and label the platform as "News".
      4. Try to find at least 5 distinct items.

      RETURN JSON ARRAY:
      [
        {
          "question": "Fed Rate Cut by December?",
          "probability": 0.75,
          "volume": "$12M",
          "url": "https://polymarket.com/...",
          "platform": "Polymarket"
        },
        ...
      ]
      
      Return ONLY raw JSON. No markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI Market Agent");

    try {
        const clean = cleanJsonString(text);
        const data = JSON.parse(clean);
        
        if (Array.isArray(data)) {
            return data.map((item: any) => ({
                question: item.question || "Unknown Market",
                probability: typeof item.probability === 'number' ? item.probability : 0.5,
                volume: item.volume || "N/A",
                url: item.url || "#",
                platform: item.platform || "Analyst Est.",
                isSimulation: false
            }));
        }
    } catch (e) {
        console.warn("Market Data Parse Error", e);
    }

  } catch (e) {
    console.warn("Market Intelligence Fetch Failed:", e);
  }

  // Fallback to Mock Data if AI fails completely
  return getMockMarkets();
};

const getMockMarkets = (): MarketData[] => [
    {
      question: "Analysis Engine Offline: Using Historical Data",
      probability: 0.50,
      volume: "N/A",
      url: "#",
      platform: "System",
      isSimulation: true
    },
    {
      question: "Fed Interest Rate Cut in Q3?",
      probability: 0.15,
      volume: "$14.2M",
      url: "#",
      platform: "Kalshi",
      isSimulation: true
    },
    {
      question: "Oil Prices > $85 by Dec?",
      probability: 0.42,
      volume: "$3.5M",
      url: "#",
      platform: "Polymarket",
      isSimulation: true
    },
    {
      question: "Global Supply Chain Index Hits Record High?",
      probability: 0.55,
      volume: "$2.4M",
      url: "#",
      platform: "PredictIt",
      isSimulation: true
    }
];
