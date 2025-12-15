
export interface SectorAnalysis {
  name: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number; // 0 to 100
  reasoning: string;
}

export interface Mandate {
  description: string;
  amount: string;
  amountValue?: number; // Numeric value in millions
  sector: string;
}

export interface RiskFactor {
  clause: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export interface GlobalCompetitor {
  country: string;
  metric: string; // e.g. "50GW Capacity"
  rank: number;
}

export interface SectorGlobalContext {
  sectorName: string;
  localRank: string; // e.g. "Emerging Leader" or "Top 10" or "Tier 2"
  topCompetitors: GlobalCompetitor[];
  analysis: string;
}

export interface Opportunity {
  title: string;
  type: 'TENDER' | 'TAX_INCENTIVE' | 'INVESTMENT';
  description: string;
  estimatedValue?: string;
}

// New: Dynamic Visualization Data
export type ChartType = 'SANKEY' | 'BAR' | 'PIE' | 'STAT';

export interface DataPoint {
  label: string; // Source (Sankey), Label (Bar/Pie), or Text (Stat)
  value: number; 
  target?: string; // Target (Sankey only)
  meta?: string; // Unit or context
}

export interface VisualIntelligence {
  headline: string;
  chartType: ChartType;
  description: string;
  dataPoints: DataPoint[];
}

// New: Dynamic Report Sections
export interface ReportSection {
  header: string;
  body: string;
  icon: 'RISK' | 'MONEY' | 'GLOBE' | 'LAW' | 'SUMMARY';
}

export interface PolicyAnalysis {
  documentName: string; // Original filename
  policyTitle: string; // New: AI-derived title (e.g. "National AI Act 2025")
  country: string;
  sectors: SectorAnalysis[];
  mandates: Mandate[]; // Kept for legacy compatibility if needed
  risks: RiskFactor[];
  opportunities: Opportunity[];
  globalContext: SectorGlobalContext[];
  corruptionScore: number;
  // realityCheck: string; // Deprecated in favor of reportSections[0]
  visualData: VisualIntelligence; // New: Dynamic Chart
  reportSections: ReportSection[]; // New: Dynamic Report
  gameTheoryQueries: string[];
  timestamp: number;
}

export interface MarketData {
  question: string;
  probability: number;
  volume: string;
  url: string;
  platform: string;
  isSimulation?: boolean;
}

export interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  DASHBOARD = 'DASHBOARD',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// --- WAR ROOM TYPES ---

export type PersonaType = 'CORPORATION' | 'PROTESTOR' | 'FOREIGN_STATE' | 'INVESTOR' | 'REGULATOR' | 'CUSTOM';

export interface SimulationState {
  regime: 'STABLE' | 'VOLATILE'; // From Markov Switching Report
  gprIndex: number; // Geopolitical Risk Index (0-200)
  interestRate: number; // Policy Rate %
  inflation: number; // %
  reserves: string; // e.g. "$14.2B"
  privateCredit: 'EXPANDING' | 'CONTRACTING';
}

export interface WarRoomTurn {
  id: string;
  userAction: string;
  narrative: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'STALEMATE';
  scorecard: {
    userRisk: number; // 0-100
    potentialReward: number; // 0-100
    legalExposure: number; // 0-100
  };
  simState?: SimulationState; // New: Macro-economic state
  relevantClause?: string;
  timestamp: number;
}

export interface PersonaConfig {
  id: PersonaType;
  name: string;
  description: string;
  demographics?: string;
  psychographics?: string;
  objective: string;
  suggestedMoves: string[];
}