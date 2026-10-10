/**
 * TraceMind AI Core Data Types
 * Digital Forensics & Cyberattack Reconstruction Platform
 */

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export type FindingStatus = 'new' | 'reviewing' | 'confirmed' | 'dismissed';

export type EntityType = 
  | 'user' 
  | 'host' 
  | 'ip' 
  | 'domain' 
  | 'file' 
  | 'process' 
  | 'alert' 
  | 'email';

export type RelationshipType = 
  | 'observed'             // Directly recorded in log (e.g. host initiated connection)
  | 'deterministic'        // Proven by correlated rule & matching timestamp/indicator
  | 'hypothesis'           // AI-proposed attack progression hypothesis
  | 'contradictory'        // Inconsistent evidence (e.g. firewall blocked vs host beaconed)
  | 'unproven';            // Missing telemetry gap

export interface ExtractedIndicator {
  id: string;
  type: EntityType;
  value: string;
  context?: string;
}

export interface EvidenceItem {
  id: string;                      // e.g. "EVD-101"
  sourceType: 'auth_log' | 'email' | 'endpoint_edr' | 'network_dns' | 'firewall' | 'incident_report' | 'syslog';
  sourceReference: string;         // e.g. "Syslog-Server-02", "Exchange-MessageTracking"
  timestamp?: string;              // ISO 8601 or undefined if missing/uncertain
  timestampConfidence: 'exact' | 'uncertain' | 'missing';
  title: string;
  rawContent: string;
  summary: string;
  fileFormat: 'text' | 'json' | 'csv' | 'pcap_summary';
  indicators: ExtractedIndicator[];
  status: 'ingested' | 'analyzed' | 'flagged' | 'benign_filtered';
  sizeBytes: number;
  addedAt: string;
}

export interface TimelineEvent {
  id: string;
  evidenceId: string;
  timestamp?: string;
  timestampDisplay: string;
  timestampConfidence: 'exact' | 'uncertain' | 'missing';
  eventTitle: string;
  description: string;
  severity: SeverityLevel;
  confidenceScore: number;         // 0.0 - 1.0
  mitreAttack?: {
    id: string;                    // e.g. "T1566.001"
    name: string;                  // e.g. "Spearphishing Attachment"
    tactic: string;                // e.g. "Initial Access"
  };
  entities: {
    type: EntityType;
    value: string;
  }[];
  isContradictory?: boolean;
  contradictionNotes?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  severity?: SeverityLevel;
  evidenceIds: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string;                  // node id
  target: string;                  // node id
  relationship: string;            // label, e.g. "Sent Phish to", "Spawned Process"
  type: RelationshipType;          // observed | deterministic | hypothesis | contradictory | unproven
  evidenceIds: string[];
  explanation: string;
  confidence: number;
}

export interface Finding {
  id: string;
  title: string;
  severity: SeverityLevel;
  confidenceScore: number;         // 0 to 1
  confidenceExplanation: string;
  supportingEvidenceIds: string[];
  evidenceExcerpts: {
    evidenceId: string;
    source: string;
    quote: string;
  }[];
  reasoningSummary: string;
  mitreTactic?: string;
  mitreTechnique?: string;
  alternativeBenignExplanations: string[];
  whatWouldDisproveThis: {
    evidenceGaps: string[];
    competingHypotheses: string[];
    recommendedVerifications: string[];
  };
  recommendedDefensiveActions: string[];
  status: FindingStatus;
  analystNotes?: string;
  origin: 'rule_engine' | 'open_weight_model';
}

export interface Investigation {
  id: string;
  name: string;
  caseNumber: string;
  leadAnalyst: string;
  status: 'active' | 'in_review' | 'closed' | 'escalated';
  createdAt: string;
  updatedAt: string;
  summary: string;
  evidence: EvidenceItem[];
  timeline: TimelineEvent[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  findings: Finding[];
  notes: string;
  lastAnalysisMode: 'demo_rule_engine' | 'open_weight_model';
  isSampleInvestigation?: boolean;
}

export interface ModelProviderConfig {
  mode: 'demo' | 'open_weight';
  endpointUrl: string;             // e.g. "http://localhost:11434/v1" or custom vLLM
  modelIdentifier: string;         // e.g. "llama3.3:70b", "qwen2.5:32b", "mistral-7b"
  apiKey?: string;                 // Server-side credential / token
  temperature: number;             // default 0.1
  timeoutSeconds: number;          // default 30
  providerStatus: 'ready' | 'unavailable' | 'testing' | 'connected';
  lastError?: string;
}

export interface BenchmarkTestCase {
  id: string;
  name: string;
  category: 'benign' | 'suspicious_auth' | 'spearphishing' | 'timestamp_drift' | 'contradictory' | 'missing_telemetry' | 'prompt_injection';
  description: string;
  sampleEvidence: {
    sourceType: EvidenceItem['sourceType'];
    rawContent: string;
  }[];
  expectedOutcome: {
    shouldFlagAttack: boolean;
    expectedSeverity: SeverityLevel;
    mitreTechniqueExpected?: string;
    injectionContained?: boolean;
  };
}

export interface BenchmarkRunResult {
  testId: string;
  name: string;
  category: string;
  passed: boolean;
  latencyMs: number;
  actualFlagged: boolean;
  actualSeverity: SeverityLevel;
  notes: string;
  injectionNeutralized?: boolean;
}

export interface BenchmarkMetrics {
  totalTests: number;
  passedTests: number;
  precision: number;
  recall: number;
  falsePositiveRate: number;
  injectionDefenseRate: number;
  avgLatencyMs: number;
  evaluatedAt: string;
  isSimulatedDemoMetric: boolean;
}
