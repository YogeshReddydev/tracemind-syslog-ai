/**
 * Security Operations Dashboard
 * SOC overview, KPI metrics, severity distribution, and recent investigations
 */

import React from 'react';
import { 
  FolderArchive, 
  FileText, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Play, 
  Database,
  ExternalLink
} from 'lucide-react';
import { Investigation } from '../types';

interface DashboardViewProps {
  investigations: Investigation[];
  activeInvestigation: Investigation;
  onSelectInvestigation: (inv: Investigation) => void;
  onStartNewInvestigation: () => void;
  onNavigateToWorkspace: () => void;
  onNavigateToFindings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  investigations,
  activeInvestigation,
  onSelectInvestigation,
  onStartNewInvestigation,
  onNavigateToWorkspace,
  onNavigateToFindings
}) => {
  // Compute aggregate statistics
  const totalInvestigations = investigations.length;
  const totalEvidenceCount = investigations.reduce((sum, inv) => sum + inv.evidence.length, 0);
  
  // Aggregate findings
  const allFindings = investigations.flatMap(inv => inv.findings);
  const criticalFindings = allFindings.filter(f => f.severity === 'critical').length;
  const highFindings = allFindings.filter(f => f.severity === 'high').length;
  const mediumFindings = allFindings.filter(f => f.severity === 'medium').length;
  const lowOrInfoFindings = allFindings.filter(f => f.severity === 'low' || f.severity === 'informational').length;
  
  const awaitingReviewCount = allFindings.filter(f => f.status === 'new' || f.status === 'reviewing').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Editorial Header & Sample Data Label */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium mb-1">
            <span>Security Operations Center</span>
            <span aria-hidden="true">·</span>
            <span>Forensics & Reconstruction</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400 font-mono">Sample SOC Demonstration Data</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Investigation Operations Console
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Correlate heterogeneous telemetry into verifiable forensic attack timelines, inspect evidence provenance, and test competing defense hypotheses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onStartNewInvestigation}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer"
          >
            Start New Investigation
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (Single-Elevation, clean hairline border) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Investigations */}
        <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Investigations</span>
            <FolderArchive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white tabular-nums">
            {totalInvestigations}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <span>1 active</span>
            <span className="mx-1.5">·</span>
            <span>1 in review</span>
            <span className="mx-1.5">·</span>
            <span>1 archived</span>
          </div>
        </div>

        {/* Evidence Items Processed */}
        <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Evidence Items Processed</span>
            <FileText className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white tabular-nums">
            {totalEvidenceCount}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <span>Normalized logs</span>
            <span className="mx-1.5">·</span>
            <span>Emails</span>
            <span className="mx-1.5">·</span>
            <span>EDR alerts</span>
          </div>
        </div>

        {/* High-Priority Findings */}
        <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">High-Priority Findings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white tabular-nums">
            {criticalFindings + highFindings}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <span className="text-rose-400 font-mono">{criticalFindings} critical</span>
            <span className="mx-1.5">·</span>
            <span className="text-amber-400 font-mono">{highFindings} high</span>
          </div>
        </div>

        {/* Awaiting Review */}
        <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Awaiting Forensic Review</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white tabular-nums">
            {awaitingReviewCount}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <span>Hypotheses requiring analyst sign-off</span>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Featured Investigation Banner + Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Featured Case Box (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span className="font-mono">{activeInvestigation.caseNumber}</span>
                <span aria-hidden="true">·</span>
                <span className="uppercase text-emerald-400 font-semibold">{activeInvestigation.status}</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Updated {new Date(activeInvestigation.updatedAt).toLocaleTimeString()}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              {activeInvestigation.name}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {activeInvestigation.summary}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block">Lead Analyst</span>
                <span className="text-slate-200 font-medium">{activeInvestigation.leadAnalyst}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Evidence Ingested</span>
                <span className="text-cyan-400 font-mono font-semibold tabular-nums">{activeInvestigation.evidence.length} records</span>
              </div>
              <div>
                <span className="text-slate-500 block">Timeline Sequence</span>
                <span className="text-teal-400 font-mono font-semibold tabular-nums">{activeInvestigation.timeline.length} events</span>
              </div>
              <div>
                <span className="text-slate-500 block">Provenance Graph</span>
                <span className="text-slate-200 font-mono tabular-nums">{activeInvestigation.nodes.length} nodes / {activeInvestigation.edges.length} edges</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Analysis Mode:</span>
              <span className="font-mono text-slate-200">
                {activeInvestigation.lastAnalysisMode === 'demo_rule_engine' ? 'Deterministic Rule Engine' : 'Open-Weight Inference'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToWorkspace}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onNavigateToFindings}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer"
              >
                <span>Review Findings ({activeInvestigation.findings.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Severity Distribution Visualization (1 col) */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Findings Severity Breakdown
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Distribution of correlated attack signals across active case inventory.
            </p>

            {/* Visual Bar Distribution */}
            <div className="w-full h-3 rounded-full bg-slate-950 flex overflow-hidden mb-5">
              <div 
                style={{ width: `${(criticalFindings / Math.max(1, allFindings.length)) * 100}%` }} 
                className="bg-rose-500 transition-all duration-300"
                title={`Critical: ${criticalFindings}`}
              />
              <div 
                style={{ width: `${(highFindings / Math.max(1, allFindings.length)) * 100}%` }} 
                className="bg-amber-500 transition-all duration-300"
                title={`High: ${highFindings}`}
              />
              <div 
                style={{ width: `${(mediumFindings / Math.max(1, allFindings.length)) * 100}%` }} 
                className="bg-cyan-500 transition-all duration-300"
                title={`Medium: ${mediumFindings}`}
              />
              <div 
                style={{ width: `${(lowOrInfoFindings / Math.max(1, allFindings.length)) * 100}%` }} 
                className="bg-slate-500 transition-all duration-300"
                title={`Low / Informational: ${lowOrInfoFindings}`}
              />
            </div>

            {/* Legend with tabular counts */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  <span className="text-slate-300">Critical Severity</span>
                </div>
                <span className="font-mono text-white tabular-nums font-semibold">{criticalFindings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  <span className="text-slate-300">High Severity</span>
                </div>
                <span className="font-mono text-white tabular-nums font-semibold">{highFindings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                  <span className="text-slate-300">Medium Severity</span>
                </div>
                <span className="font-mono text-white tabular-nums font-semibold">{mediumFindings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
                  <span className="text-slate-300">Low / Informational</span>
                </div>
                <span className="font-mono text-white tabular-nums font-semibold">{lowOrInfoFindings}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span>Hypotheses grounded in verbatim evidence citations.</span>
          </div>
        </div>
      </div>

      {/* Recent Investigations Table */}
      <div className="rounded-lg bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Recent Forensic Investigations
            </h3>
            <p className="text-xs text-slate-400">
              Active and archived investigation cases registered in TraceMind.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Case Number</th>
                <th className="px-4 py-3">Investigation Name</th>
                <th className="px-4 py-3">Lead Analyst</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Evidence Items</th>
                <th className="px-4 py-3 text-right">Findings</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {investigations.map((inv) => {
                const isCurrent = inv.id === activeInvestigation.id;
                return (
                  <tr 
                    key={inv.id} 
                    className={`hover:bg-slate-800/40 transition-colors ${isCurrent ? 'bg-cyan-950/20' : ''}`}
                  >
                    <td className="px-4 py-3.5 font-mono text-cyan-400 font-medium whitespace-nowrap">
                      {inv.caseNumber}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{inv.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-cyan-400 font-mono uppercase bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/50">
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      {inv.leadAnalyst}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center text-[11px] font-medium uppercase font-mono ${
                        inv.status === 'active' 
                          ? 'text-emerald-400' 
                          : inv.status === 'in_review' 
                          ? 'text-amber-400' 
                          : 'text-slate-400'
                      }`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-200 tabular-nums">
                      {inv.evidence.length}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-200 tabular-nums">
                      {inv.findings.length}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          onSelectInvestigation(inv);
                          onNavigateToWorkspace();
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-cyan-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                      >
                        {isCurrent ? 'Open Workspace' : 'Switch & Open'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
