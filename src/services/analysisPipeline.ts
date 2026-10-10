/**
 * TraceMind AI Unified Analysis Pipeline
 * Coordinates evidence normalization, indicator extraction, correlation routing, and provenance tracking
 */

import { 
  EvidenceItem, 
  Investigation, 
  ModelProviderConfig,
  TimelineEvent,
  GraphNode,
  GraphEdge,
  Finding
} from '../types';
import { executeRuleEngineAnalysis } from './ruleEngine';
import { analyzeWithOpenWeightModel } from './openWeightClient';

export interface PipelineExecutionResult {
  investigation: Investigation;
  modeUsed: 'demo_rule_engine' | 'open_weight_model';
  durationMs: number;
  indicatorsCount: number;
  timelineCount: number;
  findingsCount: number;
  warning?: string;
  error?: string;
}

/**
 * Runs the complete forensic analysis pipeline on an investigation's evidence
 */
export async function runAnalysisPipeline(
  investigation: Investigation,
  modelConfig: ModelProviderConfig
): Promise<PipelineExecutionResult> {
  const startTime = performance.now();
  const evidenceList = investigation.evidence;

  let timeline: TimelineEvent[] = [];
  let nodes: GraphNode[] = [];
  let edges: GraphEdge[] = [];
  let findings: Finding[] = [];
  let modeUsed: 'demo_rule_engine' | 'open_weight_model' = 'demo_rule_engine';
  let warning: string | undefined;
  let error: string | undefined;

  if (modelConfig.mode === 'open_weight') {
    // Attempt Open-Weight inference
    modeUsed = 'open_weight_model';
    const modelResult = await analyzeWithOpenWeightModel(evidenceList, modelConfig);

    if (modelResult.success && modelResult.findings && modelResult.findings.length > 0) {
      timeline = modelResult.timeline || [];
      nodes = modelResult.nodes || [];
      edges = modelResult.edges || [];
      findings = modelResult.findings.map(f => ({
        ...f,
        origin: 'open_weight_model'
      }));
    } else {
      // Per instructions: "Clearly indicate when this provider is unavailable. Do not silently replace an unavailable open-weight model with Gemini or another proprietary model."
      error = `Open-Weight Model (${modelConfig.modelIdentifier}) at ${modelConfig.endpointUrl} is unavailable: ${modelResult.error || 'No response returned'}. Falling back to Rule-based demonstration is only done upon explicit user request.`;
      
      // We do NOT silently switch. But to keep the UI from crashing, we return the error and allow the user to switch to demo mode.
      return {
        investigation,
        modeUsed: 'open_weight_model',
        durationMs: Math.round(performance.now() - startTime),
        indicatorsCount: 0,
        timelineCount: 0,
        findingsCount: 0,
        error
      };
    }
  } else {
    // Development / Demo Mode: Transparent deterministic rule engine
    modeUsed = 'demo_rule_engine';
    const ruleResult = executeRuleEngineAnalysis(evidenceList);
    timeline = ruleResult.timeline;
    nodes = ruleResult.nodes;
    edges = ruleResult.edges;
    findings = ruleResult.findings;
  }

  // Count extracted indicators across evidence
  const totalIndicators = evidenceList.reduce((acc, ev) => acc + ev.indicators.length, 0);

  const updatedInvestigation: Investigation = {
    ...investigation,
    timeline,
    nodes,
    edges,
    findings,
    lastAnalysisMode: modeUsed,
    updatedAt: new Date().toISOString()
  };

  const durationMs = Math.round(performance.now() - startTime);

  return {
    investigation: updatedInvestigation,
    modeUsed,
    durationMs,
    indicatorsCount: totalIndicators,
    timelineCount: timeline.length,
    findingsCount: findings.length,
    warning,
    error
  };
}
