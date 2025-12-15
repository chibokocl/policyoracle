
import { GoogleGenAI, Type, Chat, Schema } from "@google/genai";
import { PolicyAnalysis, WarRoomTurn, PersonaType, PersonaConfig } from '../types';

// Helper to convert file to Base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ANALYSIS_PROMPT_BASE = `
  You are PolicyOracle, an elite geopolitical consultant. 
  Analyze the provided policy content.
  
  EXTRACT & GENERATE the following structured data:

  1. **Policy Title**: Create a concise, professional title for this session based on the document content (e.g., "National Semiconductor Strategy 2025" instead of "draft_v2.pdf").
  2. **Country**: The issuing jurisdiction.
  3. **Visual Intelligence**: Identify the SINGLE most important quantitative relationship in this document and create a dataset to visualize it.
     - If it's budget allocations -> Use 'SANKEY' (Label=Source, Target=Recipient, Value=Amount).
     - If it's a forecast or comparison -> Use 'BAR'.
     - If it's composition/share -> Use 'PIE'.
     - If it's a singular massive target (e.g. "Net Zero by 2050") -> Use 'STAT'.
  4. **Report Sections**: Create 3-4 dynamic report sections that cover the most critical aspects of *this specific policy*. Do not use generic headers. Use headers like "Strategic Vulnerabilities", "Fiscal Impact", "Compliance Deadlines", etc.
  5. **Sectors**: Identify key sectors with sentiment.
  6. **Opportunities**: Commercial tenders, tax breaks, or investment signals.
  7. **Global Benchmarking**: Compare to top competitors.
  8. **Risks**: Specific clauses with high corruption/risk potential.
  9. **Corruption Score**: 0-100.
  10. **Game Theory**: Generate 3 specific search queries for prediction markets (e.g. Polymarket, Kalshi) related to the policy's outcome (e.g. "Will [Country] pass AI Bill?", "Oil price forecast 2025", "General Election odds").

  Return ONLY valid JSON matching the schema.
`;

const RESPONSE_SCHEMA_CONFIG: Schema = {
  type: Type.OBJECT,
  properties: {
    policyTitle: { type: Type.STRING },
    country: { type: Type.STRING },
    visualData: {
      type: Type.OBJECT,
      properties: {
         headline: { type: Type.STRING, description: "Title of the chart" },
         chartType: { type: Type.STRING, enum: ["SANKEY", "BAR", "PIE", "STAT"] },
         description: { type: Type.STRING, description: "Brief explanation of the data" },
         dataPoints: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                    target: { type: Type.STRING, description: "Target for Sankey only" },
                    meta: { type: Type.STRING, description: "Unit or context" }
                },
                required: ["label", "value"]
            }
         }
      },
      required: ["headline", "chartType", "description", "dataPoints"]
    },
    reportSections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
            header: { type: Type.STRING },
            body: { type: Type.STRING },
            icon: { type: Type.STRING, enum: ["RISK", "MONEY", "GLOBE", "LAW", "SUMMARY"] }
        },
        required: ["header", "body", "icon"]
      }
    },
    sectors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          sentiment: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
          score: { type: Type.NUMBER },
          reasoning: { type: Type.STRING }
        },
        required: ["name", "sentiment", "score", "reasoning"]
      }
    },
    opportunities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["TENDER", "TAX_INCENTIVE", "INVESTMENT"] },
          description: { type: Type.STRING },
          estimatedValue: { type: Type.STRING }
        },
        required: ["title", "type", "description"]
      }
    },
    globalContext: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sectorName: { type: Type.STRING },
          localRank: { type: Type.STRING },
          analysis: { type: Type.STRING },
          topCompetitors: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 country: { type: Type.STRING },
                 metric: { type: Type.STRING },
                 rank: { type: Type.NUMBER }
               },
               required: ["country", "metric", "rank"]
             }
          }
        },
        required: ["sectorName", "localRank", "analysis", "topCompetitors"]
      }
    },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clause: { type: Type.STRING },
          riskLevel: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
          explanation: { type: Type.STRING }
        },
        required: ["clause", "riskLevel", "explanation"]
      }
    },
    corruptionScore: { type: Type.NUMBER },
    gameTheoryQueries: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["policyTitle", "country", "visualData", "reportSections", "sectors", "opportunities", "globalContext", "risks", "corruptionScore", "gameTheoryQueries"]
};

// War Room Schema - Updated for Markov Simulation
const WAR_ROOM_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING, description: "A text description of what happens (2-3 sentences)." },
    outcome: { type: Type.STRING, enum: ["SUCCESS", "FAILURE", "STALEMATE"] },
    scorecard: {
      type: Type.OBJECT,
      properties: {
        userRisk: { type: Type.NUMBER, description: "0-100 (High is bad)" },
        potentialReward: { type: Type.NUMBER, description: "0-100 (High is good)" },
        legalExposure: { type: Type.NUMBER, description: "0-100 (High is bad)" }
      },
      required: ["userRisk", "potentialReward", "legalExposure"]
    },
    simState: {
        type: Type.OBJECT,
        properties: {
            regime: { type: Type.STRING, enum: ["STABLE", "VOLATILE"], description: "Current market regime based on Markov Switching Model" },
            gprIndex: { type: Type.NUMBER, description: "Geopolitical Risk Index (0-200)" },
            interestRate: { type: Type.NUMBER, description: "Central Bank Policy Rate %" },
            inflation: { type: Type.NUMBER, description: "Inflation Rate %" },
            reserves: { type: Type.STRING, description: "Foreign Reserves (e.g. $14B)" },
            privateCredit: { type: Type.STRING, enum: ["EXPANDING", "CONTRACTING"], description: "State of lending to private sector" }
        },
        required: ["regime", "gprIndex", "interestRate", "inflation", "reserves", "privateCredit"]
    },
    relevantClause: { type: Type.STRING, description: "The specific text from the policy that determined this outcome (or 'N/A' if loophole found)." }
  },
  required: ["narrative", "outcome", "scorecard", "simState", "relevantClause"]
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to sanitize JSON string
const cleanJsonString = (text: string): string => {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
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

export const analyzePolicyDocument = async (file: File): Promise<PolicyAnalysis> => {
  try {
    const ai = getAIClient();
    const base64Data = await fileToGenerativePart(file);
    const modelId = "gemini-3-pro-preview";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: ANALYSIS_PROMPT_BASE }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA_CONFIG
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);
    return {
      documentName: file.name,
      timestamp: Date.now(),
      mandates: [], // Providing empty array for backward compatibility types if needed in UI fallback
      ...data
    };

  } catch (error) {
    console.error("Analysis Failed:", error);
    throw error;
  }
};

export const analyzePolicyUrl = async (url: string): Promise<PolicyAnalysis> => {
  try {
    const ai = getAIClient();
    const modelId = "gemini-3-pro-preview";

    const urlPrompt = `
      ${ANALYSIS_PROMPT_BASE}
      Target URL: ${url}
      Instructions: Use Google Search to find and read the policy. Return raw JSON only.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: urlPrompt }] },
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    let data;
    try {
      const cleanText = cleanJsonString(text);
      data = JSON.parse(cleanText);
    } catch (e) {
      console.error("JSON Parse Error on URL response. Raw text:", text);
      throw new Error("Failed to parse analysis results from URL.");
    }

    return {
      documentName: url,
      timestamp: Date.now(),
      mandates: [],
      ...data
    };

  } catch (error) {
    console.error("URL Analysis Failed:", error);
    throw error;
  }
};

// ... [Existing Geo Intel, Persona Generation, Chat, and WarRoom code remains unchanged below]
// Re-exporting them to ensure file integrity in response
export const getGeoIntelligence = async (country: string, sector: string): Promise<{ text: string, webSources: any[], mapSources: any[] }> => {
  try {
    const ai = getAIClient();
    const prompt = `Locate key logistical hubs, ports, trade routes, or strategic infrastructure in ${country} relevant to the ${sector} sector. Provide a brief analysis of their strategic importance.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { role: 'user', parts: [{ text: prompt }] },
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
      }
    });

    const text = response.text || "No geospatial intelligence retrieved.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const webSources = chunks.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    const mapSources = chunks.filter((c: any) => c.maps).map((c: any) => ({ title: c.maps.title, uri: c.maps.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.maps.title)}` }));

    return { text, webSources, mapSources };
  } catch (e) {
    return { text: "Satellite Uplink Failed.", webSources: [], mapSources: [] };
  }
};

export const generatePersonas = async (country: string, policyName: string, sectors: string[], keyRisks: string[] = []): Promise<PersonaConfig[]> => {
    const ai = getAIClient();
    const prompt = `
      You are a sociological simulation architect specializing in political anthropology.
      CONTEXT: Policy "${policyName}" in "${country}".
      KEY SECTORS: ${sectors.join(', ')}.
      KEY RISKS/CLAUSES: ${keyRisks.slice(0, 5).join('; ')}.

      TASK: Create 5 culturally and politically accurate personas for a war game simulation.
      
      CRITICAL INSTRUCTION:
      - Detect the political spectrum and cultural archetypes specific to "${country}".
      - DO NOT use generic names like "Average Citizen" or "Standard Corp".
      - USE LOCAL TERMINOLOGY, SLANG, and POLITICAL ARCHETYPES.
        * Examples:
          - USA: "MAGA Loyalist", "Coastal Liberal", "Beltway Lobbyist", "Gen Z Activist".
          - Kenya: "Hustler Nation", "Chawa (Influencer)", "Dynasty Heir", "Gen Z (Maandamano)".
          - China: "Party Cadre", "Little Pink (Nationalist Netizen)", "Tech Oligarch", "Migrant Worker".
          - UK: "Tory Backbencher", "Red Wall Voter", "City Banker".
          - Generic/Unknown: "Opposition Leader", "Industry Tycoon", "Youth Leader".
      - Map these specific archetypes to the closest standard ROLE (ID) below.

      ROLES (id): 'CORPORATION', 'PROTESTOR', 'FOREIGN_STATE', 'INVESTOR', 'REGULATOR'.

      OUTPUT FORMAT (JSON Array of PersonaConfig):
      [
        {
          "id": "PROTESTOR", // Map 'Gen Z' or 'Chawa' here if they are disrupting/agitating
          "name": "[Specific Cultural Name, e.g. 'Gen Z Digital Native']",
          "description": "[Brief backstory using local context and slang]",
          "demographics": "[e.g. Urban Youth, Nairobi, 18-25]",
          "psychographics": "[e.g. Disillusioned, Tech-savvy, Radical]",
          "objective": "A concise, actionable goal relevant to the policy (e.g. 'Force amendment of Clause 4', 'Secure tax exemption', 'Trigger government collapse'). Avoid vague goals like 'Profit'.",
          "suggestedMoves": ["Action 1", "Action 2"]
        }
      ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json" }
        });
        const text = response.text;
        const cleanText = cleanJsonString(text || "[]");
        const rawData = JSON.parse(cleanText);

        // sanitize: ensure demographics/psychographics are strings
        // This fixes the React Error #31 where an object is passed as a child
        const cleanData = rawData.map((p: any) => ({
            ...p,
            demographics: typeof p.demographics === 'object' 
                ? Object.entries(p.demographics).map(([k, v]) => `${k}: ${v}`).join(', ') 
                : p.demographics,
            psychographics: typeof p.psychographics === 'object' 
                ? Object.entries(p.psychographics).map(([k, v]) => `${k}: ${v}`).join(', ') 
                : p.psychographics
        }));

        return cleanData as PersonaConfig[];
    } catch (e) {
        return [{ id: 'CORPORATION', name: `${country || 'Standard'} Corp`, description: 'Generic entity', demographics: 'N/A', psychographics: 'Profit-driven', objective: 'Profit', suggestedMoves: ['Lobby'] }];
    }
};

export class PolicyChatSession {
  private chat: Chat;
  private filePart: any;
  private isUrl: boolean;
  private contextLoaded: boolean = false;

  constructor() {
    const ai = getAIClient();
    this.chat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: "You are PolicyOracle's interactive agent." } });
    this.filePart = null;
    this.isUrl = false;
  }

  async loadContext(fileOrUrl: File | string) {
    if (fileOrUrl instanceof File) {
      const base64Data = await fileToGenerativePart(fileOrUrl);
      this.filePart = { inlineData: { mimeType: fileOrUrl.type, data: base64Data } };
      this.isUrl = false;
    } else {
      this.filePart = { text: `Context URL: ${fileOrUrl}` };
      this.isUrl = true;
    }
    this.contextLoaded = true;
  }

  async sendMessage(msgText: string): Promise<string> {
    if (!this.contextLoaded) throw new Error("Context not loaded");
    let message: any[] | string = msgText;
    const history = await this.chat.getHistory();
    if (history.length === 0) message = this.isUrl ? [{ text: `Policy: ${this.filePart.text}` }, { text: msgText }] : [this.filePart, { text: msgText }];
    const result = await this.chat.sendMessage({ message });
    return result.text || "No response generated.";
  }
}

export class WarRoomSession {
  private chat: Chat;
  private filePart: any;
  private contextLoaded: boolean = false;
  private geopoliticalContext: string = "";
  private personaName: string = 'Corporation';
  private personaDescription: string = 'Standard entity';

  constructor() {
    const ai = getAIClient();
    this.chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        responseMimeType: "application/json",
        responseSchema: WAR_ROOM_SCHEMA,
        systemInstruction: `
          You are the War Room Simulator Engine (Markov-Switching Model). 
          
          SIMULATION LOGIC:
          1. **Regime Switching**: You must track the market state as either 'STABLE' (Low Volatility) or 'VOLATILE' (High Volatility).
             - Use a Markov chain probability to determine regime switches.
             - High Geopolitical Risk (GPR) shocks increase probability of switching to 'VOLATILE'.
          
          2. **Transmission Mechanisms**:
             - **Interest Rates**: Hikes -> Increase Foreign Reserves, Decrease Private Sector Credit, Decrease Inflation.
             - **GPR Shocks**: Impact commodities differently. Energy is HIGHLY REACTIVE. Livestock is LEAST SENSITIVE.
             - **Pegged Exchange**: If country currency is pegged (like Jordan), interest rates often track the US Fed.
          
          3. **Persona Interaction & Realism**:
             - Evaluate the Persona's move against the Policy Document.
             - **Objective Tracking**: Evaluate if the move advances the specific PERSONA OBJECTIVE provided in the context.
             - **Game Theory & Prediction Markets**: Use any [MARKET ODDS] provided in the context to weight outcomes. 
               * IF a prediction market indicates high probability (e.g., "70% chance of subsidy cuts"), moves relying on subsidies should have HIGHER RISK/FAILURE rates.
               * IF a prediction market indicates "Civil Unrest likely", PROTESTOR moves get a buff.
             - **Real-Time Scenarios**: Calculate outcomes based on REAL WORLD probabilities for the specific country context. 
               - E.g. In a high corruption regime, bribery attempts have higher success but higher legal risk.
               - In a 'VOLATILE' regime, public protests have a higher chance of cascading into riots.
             - Quote specific clauses if the move fails due to legal restrictions.
          
          OUTPUT:
          - Return a structured JSON with the narrative outcome AND the full 'simState' (regime, gprIndex, rates, etc.).
          - Update the 'simState' dynamically based on the move and random market factors.
        `
      }
    });
  }

  async loadContext(fileOrUrl: File | string, personaName: string, personaDescription: string) {
    this.personaName = personaName;
    this.personaDescription = personaDescription;
    if (fileOrUrl instanceof File) {
      const base64Data = await fileToGenerativePart(fileOrUrl);
      this.filePart = { inlineData: { mimeType: fileOrUrl.type, data: base64Data } };
    } else {
      this.filePart = { text: `Policy Document URL: ${fileOrUrl}` };
    }
    this.contextLoaded = true;
  }

  async integrateGameTheory(marketData: string) {
      if (!this.contextLoaded) return;
      // Inject market data as a system update to inform the probabilities
      await this.chat.sendMessage({ message: `[SYSTEM UPDATE: GAME THEORY MATRIX] Apply these real-world probabilities to the simulation: ${marketData}` });
  }

  async enrichContext(country: string, policyName: string): Promise<any> {
     const ai = getAIClient();
     const searchPrompt = `Research current geopolitical reality for ${country}. Target Policy: "${policyName}". Find timeline, relevance, status, market metrics. Return JSON { summary, marketMetrics, liveStrategies }.`;
     try {
         const intelResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: searchPrompt }] },
            config: { tools: [{ googleSearch: {} }] }
         });
         const text = intelResponse.text;
         const cleanText = cleanJsonString(text || "{}");
         const data = JSON.parse(cleanText);
         this.geopoliticalContext = `SUMMARY: ${data.summary} MARKET: ${data.marketMetrics?.join(', ')}`;
         if (this.contextLoaded) await this.chat.sendMessage({ message: `[SYSTEM UPDATE: REAL-TIME INTELLIGENCE] ${this.geopoliticalContext}` });
         return data;
     } catch (e) {
         return { summary: "Offline Mode", marketMetrics: ["OFFLINE"], liveStrategies: [] };
     }
  }

  async submitMove(action: string): Promise<WarRoomTurn> {
    if (!this.contextLoaded) throw new Error("Context not loaded");
    const promptText = `PERSONA: ${this.personaName} (${this.personaDescription}). ACTION: "${action}". Analyze outcome applying Markov Switching logic.`;
    let message: any[] | string = promptText;
    const history = await this.chat.getHistory();
    if (history.length === 0) message = [this.filePart, { text: promptText }];
    const result = await this.chat.sendMessage({ message });
    const text = result.text;
    const cleanText = cleanJsonString(text || "{}");
    const data = JSON.parse(cleanText);
    return { 
        id: crypto.randomUUID(), 
        userAction: action, 
        narrative: data.narrative, 
        outcome: data.outcome, 
        scorecard: data.scorecard, 
        simState: data.simState, 
        relevantClause: data.relevantClause, 
        timestamp: Date.now() 
    };
  }
}
