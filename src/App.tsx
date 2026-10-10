/**
 * TraceMind AI — Main Application Entry Point
 * Evidence-Driven Cyberattack Reconstruction Platform
 */

import React, { useState } from 'react';
import { 
  Navigation, 
  ActiveTab 
} from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { WorkspaceView } from './components/WorkspaceView';
import { EvidenceExplorerView } from './components/EvidenceExplorerView';
import { TimelineView } from './components/TimelineView';
import { RelationshipGraphView } from './components/RelationshipGraphView';
import { FindingsView } from './components/FindingsView';
import { BenchmarkLabView } from './components/BenchmarkLabView';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { NewInvestigationModal } from './components/NewInvestigationModal';
import { EvidenceDetailModal } from './components/EvidenceDetailModal';

import { 
  Investigation, 
  EvidenceItem, 
  ModelProviderConfig, 
  FindingStatus 
} from './types';
import { getSampleInvestigationsList } from './services/sampleData';
import { runAnalysisPipeline } from './services/analysisPipeline';
import { AlertCircle, CheckCircle2, ChevronRight, Shield } from 'lucide-react';

export default function App() {
  // Application State
  const [investigations, setInvestigations] = useState<Investigation[]>(() => getSampleInvestigationsList());
  const [activeInvestigationId, setActiveInvestigationId] = useState<string>(investigations[0]?.id || 'INV-2026-0042');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Model Provider Configuration
  const [modelConfig, setModelConfig] = useState<ModelProviderConfig>({
    mode: 'demo',
    endpointUrl: 'http://localhost:11434/v1',
    modelIdentifier: 'llama3.3:70b',
    temperature: 0.1,
    timeoutSeconds: 30,
    providerStatus: 'ready'
  });

  // Modals state
  const [isNewInvestigationOpen, setIsNewInvestigationOpen] = useState(false);
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const [inspectedEvidence, setInspectedEvidence] = useState<EvidenceItem | null>(null);

  // Analysis execution state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineToast, setPipelineToast] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // Active investigation reference
  const activeInvestigation = investigations.find(inv => inv.id === activeInvestigationId) || investigations[0];

  // Update active investigation
  const handleUpdateInvestigation = (updated: Investigation) => {
    setInvestigations(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
  };

  // Run forensic analysis
  const handleRunAnalysis = async () => {
    if (!activeInvestigation) return;
    setIsAnalyzing(true);
    setPipelineToast(null);

    try {
      const result = await runAnalysisPipeline(activeInvestigation, modelConfig);

      if (result.error) {
        setPipelineToast({
          type: 'error',
          message: result.error
        });
      } else {
        handleUpdateInvestigation(result.investigation);
        setPipelineToast({
          type: 'success',
          message: `Attack sequence reconstructed in ${result.durationMs}ms using ${
            result.modeUsed === 'demo_rule_engine' 
              ? 'Deterministic Rule Engine' 
              : `Open-Weight Model (${modelConfig.modelIdentifier})`
          }: Generated ${result.timelineCount} timeline events, ${result.findingsCount} findings.`
        });
      }
    } catch (err) {
      setPipelineToast({
        type: 'error',
        message: `Pipeline analysis error: ${(err as Error).message}`
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Create new investigation
  const handleCreateInvestigation = (newInv: Investigation) => {
    setInvestigations(prev => [newInv, ...prev]);
    setActiveInvestigationId(newInv.id);
    setActiveTab('workspace');
    setPipelineToast({
      type: 'success',
      message: `Investigation '${newInv.name}' initialized.`
    });
  };

  // Update a finding's status
  const handleUpdateFindingStatus = (findingId: string, newStatus: FindingStatus) => {
    if (!activeInvestigation) return;
    const updatedFindings = activeInvestigation.findings.map(f => 
      f.id === findingId ? { ...f, status: newStatus } : f
    );
    handleUpdateInvestigation({
      ...activeInvestigation,
      findings: updatedFindings,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3-Zone Top Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewInvestigation={() => setIsNewInvestigationOpen(true)}
        onOpenModelSettings={() => setIsModelSettingsOpen(true)}
        modelConfig={modelConfig}
        activeInvestigationName={activeInvestigation?.name || ''}
      />

      {/* Context Breadcrumb Sub-Header (Only visible on non-dashboard tabs) */}
      {activeTab !== 'dashboard' && activeInvestigation && (
        <div className="bg-slate-900/40 border-b border-slate-800/60 px-4 lg:px-6 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className="hover:text-cyan-400 cursor-pointer"
              >
                Cases
              </button>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="font-mono text-cyan-400 font-medium">{activeInvestigation.caseNumber}</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-white font-medium truncate max-w-xs sm:max-w-md">{activeInvestigation.name}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px] shrink-0">
              <span>{activeInvestigation.evidence.length} Evidence</span>
              <span aria-hidden="true">·</span>
              <span>{activeInvestigation.timeline.length} Events</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-400">{activeInvestigation.findings.length} Findings</span>
            </div>
          </div>
        </div>
      )}

      {/* Global Pipeline Toast Notification */}
      {pipelineToast && (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-4 w-full">
          <div className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
            pipelineToast.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {pipelineToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="font-mono text-[11px]">{pipelineToast.message}</span>
            </div>
            <button
              onClick={() => setPipelineToast(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer px-1.5 py-0.5 rounded"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main View Port */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <DashboardView
            investigations={investigations}
            activeInvestigation={activeInvestigation}
            onSelectInvestigation={(inv) => setActiveInvestigationId(inv.id)}
            onStartNewInvestigation={() => setIsNewInvestigationOpen(true)}
            onNavigateToWorkspace={() => setActiveTab('workspace')}
            onNavigateToFindings={() => setActiveTab('findings')}
          />
        )}

        {activeTab === 'workspace' && activeInvestigation && (
          <WorkspaceView
            investigation={activeInvestigation}
            modelConfig={modelConfig}
            onUpdateInvestigation={handleUpdateInvestigation}
            onRunAnalysis={handleRunAnalysis}
            isAnalyzing={isAnalyzing}
            onViewEvidenceDetail={(item) => setInspectedEvidence(item)}
            onOpenModelSettings={() => setIsModelSettingsOpen(true)}
          />
        )}

        {activeTab === 'evidence' && activeInvestigation && (
          <EvidenceExplorerView
            investigation={activeInvestigation}
            onViewEvidenceDetail={(item) => setInspectedEvidence(item)}
            onSelectFinding={(_findingId) => setActiveTab('findings')}
          />
        )}

        {activeTab === 'timeline' && activeInvestigation && (
          <TimelineView
            investigation={activeInvestigation}
            onViewEvidenceDetail={(item) => setInspectedEvidence(item)}
          />
        )}

        {activeTab === 'graph' && activeInvestigation && (
          <RelationshipGraphView
            investigation={activeInvestigation}
            onViewEvidenceDetail={(item) => setInspectedEvidence(item)}
          />
        )}

        {activeTab === 'findings' && activeInvestigation && (
          <FindingsView
            investigation={activeInvestigation}
            onUpdateFindingStatus={handleUpdateFindingStatus}
            onViewEvidenceDetail={(item) => setInspectedEvidence(item)}
          />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkLabView />
        )}
      </main>

      {/* Modals */}
      <ModelSettingsModal
        isOpen={isModelSettingsOpen}
        onClose={() => setIsModelSettingsOpen(false)}
        config={modelConfig}
        onSaveConfig={setModelConfig}
      />

      <NewInvestigationModal
        isOpen={isNewInvestigationOpen}
        onClose={() => setIsNewInvestigationOpen(false)}
        onCreateInvestigation={handleCreateInvestigation}
      />

      <EvidenceDetailModal
        evidenceItem={inspectedEvidence}
        onClose={() => setInspectedEvidence(null)}
      />
    </div>
  );
}
