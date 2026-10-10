/**
 * Investigation Workspace
 * Evidence ingestion (text paste, JSON/CSV file uploads, preset templates),
 * processing status, analyst notes, and analysis execution
 */

import React, { useState } from 'react';
import { 
  Play, 
  RefreshCw, 
  FileUp, 
  Trash2, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Database, 
  HelpCircle,
  PlusCircle,
  Eye,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { Investigation, EvidenceItem, ModelProviderConfig } from '../types';
import { 
  createEvidenceItem, 
  parseJsonEvidence, 
  parseCsvEvidence, 
  detectPromptInjection 
} from '../services/normalization';
import { 
  createOperationGlassLanternEvidence, 
  createOperationCobaltRavenEvidence, 
  DIGITALOCEAN_OPENSOURCE_REFERENCE_DOC 
} from '../services/sampleData';
import { generateMarkdownReport, downloadFile } from '../services/reportExporter';

interface WorkspaceViewProps {
  investigation: Investigation;
  modelConfig: ModelProviderConfig;
  onUpdateInvestigation: (updated: Investigation) => void;
  onRunAnalysis: () => Promise<void>;
  isAnalyzing: boolean;
  onViewEvidenceDetail: (item: EvidenceItem) => void;
  onOpenModelSettings: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  investigation,
  modelConfig,
  onUpdateInvestigation,
  onRunAnalysis,
  isAnalyzing,
  onViewEvidenceDetail,
  onOpenModelSettings
}) => {
  // Ingestion form state
  const [ingestionTab, setIngestionTab] = useState<'text' | 'file' | 'presets'>('text');
  const [rawText, setRawText] = useState('');
  const [sourceType, setSourceType] = useState<EvidenceItem['sourceType']>('syslog');
  const [sourceRef, setSourceRef] = useState('');
  const [title, setTitle] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [notes, setNotes] = useState(investigation.notes || '');

  // Handle Text Ingestion
  const handleAddTextEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setValidationWarning(null);

    if (!rawText.trim()) {
      setValidationError('Please paste log, email, or alert content.');
      return;
    }

    // Check prompt injection defensive detection
    const injectionCheck = detectPromptInjection(rawText);
    if (injectionCheck.hasInjection) {
      setValidationWarning(
        `Adversarial Instruction Pattern Detected (${injectionCheck.patternsDetected.join(', ')}). TraceMind will neutralize this text and treat it strictly as untrusted forensic evidence.`
      );
    }

    const newItem = createEvidenceItem({
      sourceType,
      sourceReference: sourceRef || `Manual-Input-${sourceType}`,
      title: title || `${sourceType.toUpperCase()} Record`,
      rawContent: rawText,
      fileFormat: 'text'
    });

    const updated = {
      ...investigation,
      evidence: [newItem, ...investigation.evidence],
      updatedAt: new Date().toISOString()
    };

    onUpdateInvestigation(updated);
    setRawText('');
    setTitle('');
    setSourceRef('');
  };

  // Handle File Upload (JSON / CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    setValidationWarning(null);

    if (file.size > 5 * 1024 * 1024) {
      setValidationError('File exceeds 5MB size limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const filename = file.name.toLowerCase();
      let format: EvidenceItem['fileFormat'] = 'text';
      let parsedRaw = content;

      if (filename.endsWith('.json')) {
        format = 'json';
        const parsed = parseJsonEvidence(content);
        if (!parsed.valid) {
          setValidationError(`JSON parsing failed: ${parsed.error}`);
          return;
        }
        parsedRaw = JSON.stringify(parsed.data, null, 2);
      } else if (filename.endsWith('.csv')) {
        format = 'csv';
        const parsed = parseCsvEvidence(content);
        if (!parsed.valid) {
          setValidationError(`CSV parsing failed: ${parsed.error}`);
          return;
        }
        parsedRaw = content;
      }

      // Check injection
      const injectionCheck = detectPromptInjection(parsedRaw);
      if (injectionCheck.hasInjection) {
        setValidationWarning(
          `Adversarial string detected in uploaded file. Content has been neutralized into static evidence.`
        );
      }

      const newItem = createEvidenceItem({
        sourceType: filename.includes('mail') ? 'email' : filename.includes('auth') ? 'auth_log' : 'syslog',
        sourceReference: file.name,
        title: `Ingested File: ${file.name}`,
        rawContent: parsedRaw,
        fileFormat: format
      });

      const updated = {
        ...investigation,
        evidence: [newItem, ...investigation.evidence],
        updatedAt: new Date().toISOString()
      };

      onUpdateInvestigation(updated);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Load Preset Synthetic Data
  const handleLoadSyntheticDataset = () => {
    const syntheticItems = createOperationGlassLanternEvidence();
    const updated = {
      ...investigation,
      evidence: [...syntheticItems],
      updatedAt: new Date().toISOString()
    };
    onUpdateInvestigation(updated);
    setValidationWarning(null);
    setValidationError(null);
  };

  // Load Operation Cobalt Raven (Cloud & doctl Compromise)
  const handleLoadCobaltRavenDataset = () => {
    const cobaltItems = createOperationCobaltRavenEvidence();
    const updated = {
      ...investigation,
      evidence: [...cobaltItems],
      updatedAt: new Date().toISOString()
    };
    onUpdateInvestigation(updated);
    setValidationWarning(null);
    setValidationError(null);
  };

  // Ingest DigitalOcean Open-Source Tooling Catalog Reference
  const handleIngestOpenSourceCatalog = () => {
    const catalogItem = createEvidenceItem({
      id: `EVD-REF-${Math.floor(100 + Math.random() * 900)}`,
      sourceType: 'incident_report',
      sourceReference: 'DigitalOcean-OpenSource-Catalog-Reference',
      title: 'DigitalOcean Open-Source Infrastructure Tooling Reference Document',
      rawContent: DIGITALOCEAN_OPENSOURCE_REFERENCE_DOC,
      fileFormat: 'text'
    });
    const updated = {
      ...investigation,
      evidence: [catalogItem, ...investigation.evidence],
      updatedAt: new Date().toISOString()
    };
    onUpdateInvestigation(updated);
  };

  // Delete an evidence item
  const handleDeleteEvidence = (id: string) => {
    const updated = {
      ...investigation,
      evidence: investigation.evidence.filter(e => e.id !== id),
      updatedAt: new Date().toISOString()
    };
    onUpdateInvestigation(updated);
  };

  // Clear all evidence
  const handleClearAllEvidence = () => {
    if (window.confirm('Are you sure you want to clear all evidence for this investigation?')) {
      const updated: Investigation = {
        ...investigation,
        evidence: [],
        timeline: [],
        nodes: [],
        edges: [],
        findings: [],
        updatedAt: new Date().toISOString()
      };
      onUpdateInvestigation(updated);
    }
  };

  // Save notes
  const handleSaveNotes = () => {
    onUpdateInvestigation({
      ...investigation,
      notes,
      updatedAt: new Date().toISOString()
    });
  };

  // Export report
  const handleExportMarkdown = () => {
    const md = generateMarkdownReport(investigation);
    downloadFile(`TraceMind_Report_${investigation.caseNumber}.md`, md, 'text/markdown');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Investigation Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <span className="text-cyan-400 font-semibold">{investigation.caseNumber}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">Lead: {investigation.leadAnalyst}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 uppercase font-semibold">{investigation.status}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {investigation.name}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing || investigation.evidence.length === 0}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer shadow-sm ${
              isAnalyzing || investigation.evidence.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Reconstructing Attack Sequence...' : 'Run Analysis Pipeline'}</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md transition-colors cursor-pointer"
            title="Download Forensic Markdown Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Model Mode Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-300">
            Active Engine Mode:
            <strong className="text-white ml-1 font-mono">
              {modelConfig.mode === 'open_weight' 
                ? `Open-Weight Model (${modelConfig.modelIdentifier})` 
                : 'Deterministic Forensic Rule Engine (Verifiable Local Engine)'}
            </strong>
          </span>
        </div>
        <button
          onClick={onOpenModelSettings}
          className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 cursor-pointer self-start sm:self-auto"
        >
          Configure Model Provider / Endpoints
        </button>
      </div>

      {/* 2-Column Workspace Grid: Ingestion Panel (Left) & Evidence Inventory (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ingestion & Notes (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Evidence Ingestion Card */}
          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Ingest Digital Evidence
              </h2>
              {/* Segmented control for ingestion method */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-md border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setIngestionTab('text')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    ingestionTab === 'text' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw Text
                </button>
                <button
                  type="button"
                  onClick={() => setIngestionTab('file')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    ingestionTab === 'file' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setIngestionTab('presets')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    ingestionTab === 'presets' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Presets
                </button>
              </div>
            </div>

            {/* Validation Alerts */}
            {validationError && (
              <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {validationWarning && (
              <div className="p-3 rounded bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>{validationWarning}</span>
              </div>
            )}

            {/* Tab A: Raw Text Ingestion */}
            {ingestionTab === 'text' && (
              <form onSubmit={handleAddTextEvidence} className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Source Type</label>
                    <select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value as EvidenceItem['sourceType'])}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="auth_log">Authentication Log</option>
                      <option value="email">Suspicious Email</option>
                      <option value="endpoint_edr">Endpoint / EDR Alert</option>
                      <option value="network_dns">DNS / Network Event</option>
                      <option value="firewall">Perimeter Firewall</option>
                      <option value="syslog">System / Application Log</option>
                      <option value="incident_report">Analyst Incident Report</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Source Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. Syslog-Host-01"
                      value={sourceRef}
                      onChange={(e) => setSourceRef(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 text-xs">Record Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="Brief descriptive title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 text-xs">Raw Forensic Content / Log Lines</label>
                  <textarea
                    rows={6}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste log entries, RFC email headers, JSON snippets, or EDR alerts..."
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Defensive safety: Content is sanitized against prompt injection.
                  </span>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Ingest Record</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab B: File Upload */}
            {ingestionTab === 'file' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-lg p-6 text-center transition-colors">
                  <FileUp className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-200 mb-1">
                    Upload Forensic File (JSON, CSV, or Text)
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Maximum file size: 5MB. Never executes active payloads.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded cursor-pointer transition-colors">
                    <span>Select File</span>
                    <input
                      type="file"
                      accept=".json,.csv,.txt,.log"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Tab C: Quick Presets */}
            {ingestionTab === 'presets' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-400 text-xs">
                  Load pre-validated forensic collections for scenario testing and demonstration:
                </p>

                {/* Preset 1: Operation Glass Lantern */}
                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Operation Glass Lantern</span>
                    <span className="text-[10px] text-cyan-400 font-mono">7 Records</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Spearphishing dropper, encoded PowerShell stager, C2 domain resolution, verified benign backup, and firewall vs EDR sensor contradiction.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadSyntheticDataset}
                    className="w-full mt-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium rounded transition-colors cursor-pointer text-xs"
                  >
                    Load Operation Glass Lantern Bundle
                  </button>
                </div>

                {/* Preset 2: Operation Cobalt Raven (Cloud / DigitalOcean API) */}
                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Operation Cobalt Raven (Cloud & doctl)</span>
                    <span className="text-[10px] text-teal-400 font-mono">5 Records</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Compromised personal access token, anomalous doctl CLI execution, automated pydo recon, captainslog rsyslog snapshot deletion, and VPC edge firewall drop discrepancy.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadCobaltRavenDataset}
                    className="w-full mt-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-medium rounded transition-colors cursor-pointer text-xs"
                  >
                    Load Operation Cobalt Raven Bundle
                  </button>
                </div>

                {/* Preset 3: Ingest Open-Source Tooling Catalog Reference */}
                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">DigitalOcean Open-Source Catalog Document</span>
                    <span className="text-[10px] text-amber-400 font-mono">Reference Doc</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Ingest technical reference catalog (doctl, pydo, dots, captainslog, logtalez, bind_exporter, NetBox) as an evidence item for tool cross-referencing.
                  </p>
                  <button
                    type="button"
                    onClick={handleIngestOpenSourceCatalog}
                    className="w-full mt-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium rounded transition-colors cursor-pointer text-xs"
                  >
                    Add Open-Source Reference to Case
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Investigation Notes Card */}
          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Analyst Working Notes
              </h3>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
              >
                Save Notes
              </button>
            </div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record forensic hypothesis notes, verified IPs, or questions for peer review..."
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Evidence Inventory (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-lg bg-slate-900/70 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Ingested Evidence Inventory ({investigation.evidence.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Normalized forensic records available for reconstruction.
                </p>
              </div>

              {investigation.evidence.length > 0 && (
                <button
                  onClick={handleClearAllEvidence}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {investigation.evidence.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <Database className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>No evidence items currently loaded.</p>
                <p className="mt-1">Add raw logs on the left or load the Operation Glass Lantern preset.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-[640px] overflow-y-auto">
                {investigation.evidence.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3.5 hover:bg-slate-850/50 transition-colors flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-semibold">{item.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-300 uppercase font-medium">{item.sourceType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-400 truncate max-w-[180px]">{item.sourceReference}</span>
                      </div>

                      <div className="text-white font-medium line-clamp-1">
                        {item.title}
                      </div>

                      <p className="text-slate-400 text-[11px] font-mono line-clamp-2">
                        {item.summary}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span>
                          {item.indicators.length} extracted indicators
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Timestamp: {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Uncertain/Missing'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onViewEvidenceDetail(item)}
                        title="Inspect raw evidence and indicators"
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvidence(item.id)}
                        title="Remove evidence item"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
