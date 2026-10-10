/**
 * Forensic Findings & Investigation Report View
 * Deep forensic finding cards with evidence citations, "What would disprove this?" counter-evidence analysis,
 * status disposition workflow (new -> reviewing -> confirmed -> dismissed), and export options.
 */

import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { Investigation, Finding, FindingStatus, SeverityLevel, EvidenceItem } from '../types';
import { generateMarkdownReport, downloadFile } from '../services/reportExporter';

interface FindingsViewProps {
  investigation: Investigation;
  onUpdateFindingStatus: (findingId: string, newStatus: FindingStatus) => void;
  onViewEvidenceDetail: (item: EvidenceItem) => void;
}

export const FindingsView: React.FC<FindingsViewProps> = ({
  investigation,
  onUpdateFindingStatus,
  onViewEvidenceDetail
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedCounterHypothesis, setExpandedCounterHypothesis] = useState<Record<string, boolean>>({});

  const toggleCounterAnalysis = (findingId: string) => {
    setExpandedCounterHypothesis(prev => ({
      ...prev,
      [findingId]: !prev[findingId]
    }));
  };

  const findings = investigation.findings;

  const filteredFindings = findings.filter(f => {
    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'all' && f.status !== selectedStatus) return false;
    return true;
  });

  const getSeverityStyle = (s: SeverityLevel) => {
    switch (s) {
      case 'critical':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
      case 'high':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
      case 'medium':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80';
      case 'low':
      case 'informational':
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownReport(investigation);
    downloadFile(`TraceMind_Forensic_Report_${investigation.caseNumber}.md`, md, 'text/markdown');
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(investigation, null, 2);
    downloadFile(`TraceMind_Investigation_${investigation.caseNumber}.json`, jsonStr, 'application/json');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium mb-1">
            <span>Case {investigation.caseNumber}</span>
            <span aria-hidden="true">·</span>
            <span>Forensic Findings & Provenance Citations</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Investigation Findings & Report
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured forensic conclusions. Each hypothesis includes verbatim evidence quotes, competing explanations, and counter-evidence tests.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer font-medium"
            title="Download full forensic incident report in Markdown"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Markdown</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer font-medium"
            title="Download full structured JSON dataset"
          >
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Status Tally */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="informational">Informational / Suppressed</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New (Unreviewed)</option>
            <option value="reviewing">In Review</option>
            <option value="confirmed">Confirmed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          {filteredFindings.length} of {findings.length} findings displayed
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs rounded-lg border border-slate-800 bg-slate-900/40">
          <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p>No findings matched your filter selection.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFindings.map((finding) => {
            const isCounterOpen = expandedCounterHypothesis[finding.id] ?? true;

            return (
              <div
                key={finding.id}
                className="p-5 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-750 transition-colors space-y-4"
              >
                {/* Header: Title, Severity, Origin Engine, Status Switcher */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-cyan-400 font-bold">
                        {finding.id}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold border ${getSeverityStyle(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                        <Cpu className="w-3 h-3 text-cyan-400" />
                        <span>
                          {finding.origin === 'rule_engine' 
                            ? 'Deterministic Rule Engine' 
                            : 'Open-Weight Model Hypothesis'}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-base font-bold text-white pt-1">
                      {finding.title}
                    </h2>
                  </div>

                  {/* Status Toggle Workflow Buttons */}
                  <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-md border border-slate-800 text-xs shrink-0 self-start lg:self-auto">
                    {(['new', 'reviewing', 'confirmed', 'dismissed'] as FindingStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => onUpdateFindingStatus(finding.id, st)}
                        className={`px-2.5 py-1 rounded capitalize font-medium transition-colors cursor-pointer ${
                          finding.status === st
                            ? st === 'confirmed'
                              ? 'bg-rose-900/80 text-rose-200 font-semibold'
                              : st === 'dismissed'
                              ? 'bg-slate-800 text-slate-300 font-semibold'
                              : 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/50'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confidence Bar & MITRE Mapping */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950/60 p-3 rounded border border-slate-850">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span>Hypothesis Confidence Score:</span>
                      <span className="font-mono text-cyan-400 font-bold tabular-nums">
                        {(finding.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${finding.confidenceScore * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 italic">
                      {finding.confidenceExplanation}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <span className="text-slate-400 block mb-0.5">MITRE ATT&CK Classification:</span>
                      <div className="text-slate-200 font-semibold">
                        {finding.mitreTechnique || 'Unclassified Technique'}
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        Tactic: {finding.mitreTactic || 'General Forensics'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reasoning Summary */}
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold text-xs block">
                    Forensic Reasoning Summary:
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {finding.reasoningSummary}
                  </p>
                </div>

                {/* Verbatim Supporting Evidence Excerpts */}
                <div className="space-y-2">
                  <span className="text-slate-400 font-semibold text-xs block">
                    Verbatim Supporting Evidence Excerpts:
                  </span>
                  <div className="space-y-2">
                    {finding.evidenceExcerpts.map((excerpt, idx) => {
                      const item = investigation.evidence.find(e => e.id === excerpt.evidenceId);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded bg-slate-950 border border-slate-850 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-cyan-400 font-semibold">
                                {excerpt.evidenceId}
                              </span>
                              <span className="text-slate-500 font-mono">
                                ({excerpt.source})
                              </span>
                            </div>
                            {item && (
                              <button
                                onClick={() => onViewEvidenceDetail(item)}
                                className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>Inspect Full Record</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <blockquote className="font-mono text-slate-300 text-[11px] pl-2 border-l-2 border-cyan-500/50 italic">
                            "{excerpt.quote}"
                          </blockquote>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Alternative Benign Explanations */}
                {finding.alternativeBenignExplanations && finding.alternativeBenignExplanations.length > 0 && (
                  <div className="space-y-1.5 p-3 rounded bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 font-semibold text-xs block">
                      Alternative Benign Explanations:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                      {finding.alternativeBenignExplanations.map((alt, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {alt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Section: "What Would Disprove This?" (Collapsible Forensic Crucible) */}
                <div className="rounded border border-amber-800/40 bg-amber-950/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCounterAnalysis(finding.id)}
                    className="w-full p-3 flex items-center justify-between text-xs font-semibold text-amber-300 hover:bg-amber-950/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span>What Would Disprove This? (Counter-Evidence & Verification Roadmap)</span>
                    </div>
                    {isCounterOpen ? (
                      <ChevronUp className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-amber-400" />
                    )}
                  </button>

                  {isCounterOpen && (
                    <div className="p-4 pt-1 space-y-3 text-xs border-t border-amber-800/30">
                      {/* Evidence Gaps */}
                      <div>
                        <span className="text-amber-400/90 font-medium block mb-1">
                          Missing Telemetry Gaps:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                          {finding.whatWouldDisproveThis.evidenceGaps.map((gap, idx) => (
                            <li key={idx}>{gap}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Competing Hypotheses */}
                      <div>
                        <span className="text-amber-400/90 font-medium block mb-1">
                          Competing Hypotheses:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                          {finding.whatWouldDisproveThis.competingHypotheses.map((hyp, idx) => (
                            <li key={idx}>{hyp}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended Verifications */}
                      <div>
                        <span className="text-amber-400/90 font-medium block mb-1">
                          Recommended Verifications:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                          {finding.whatWouldDisproveThis.recommendedVerifications.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommended Defensive Actions */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-slate-400 font-semibold text-xs block">
                    Recommended Defensive Actions:
                  </span>
                  <div className="space-y-1">
                    {finding.recommendedDefensiveActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-200 bg-slate-950 p-2 rounded border border-slate-850"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
