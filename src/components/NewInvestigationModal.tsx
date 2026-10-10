/**
 * New Investigation Modal
 * Creates a new case with user-specified case parameters, priority, and optional starter evidence
 */

import React, { useState } from 'react';
import { X, FolderPlus, ShieldAlert } from 'lucide-react';
import { Investigation } from '../types';
import { createOperationGlassLanternEvidence } from '../services/sampleData';

interface NewInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateInvestigation: (inv: Investigation) => void;
}

export const NewInvestigationModal: React.FC<NewInvestigationModalProps> = ({
  isOpen,
  onClose,
  onCreateInvestigation
}) => {
  const [name, setName] = useState('');
  const [caseNumber, setCaseNumber] = useState(`SEC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [leadAnalyst, setLeadAnalyst] = useState('Alex Morgan, Incident Responder');
  const [summary, setSummary] = useState('');
  const [includeGlassLanternData, setIncludeGlassLanternData] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initialEvidence = includeGlassLanternData ? createOperationGlassLanternEvidence() : [];

    const newInv: Investigation = {
      id: `INV-${Date.now()}`,
      name: name.trim(),
      caseNumber: caseNumber.trim(),
      leadAnalyst: leadAnalyst.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: summary.trim() || 'Active cyberattack reconstruction investigation.',
      evidence: initialEvidence,
      timeline: [],
      nodes: [],
      edges: [],
      findings: [],
      notes: '',
      lastAnalysisMode: 'demo_rule_engine',
      isSampleInvestigation: false
    };

    onCreateInvestigation(newInv);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Create New Investigation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">
              Investigation Title / Operation Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Incident 2026-44: Lateral Movement Assessment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Case Tracking ID
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Lead Incident Responder
              </label>
              <input
                type="text"
                value={leadAnalyst}
                onChange={(e) => setLeadAnalyst(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">
              Scope & Incident Summary
            </label>
            <textarea
              rows={3}
              placeholder="Describe trigger alerts, affected subnets, or threat vector hypotheses..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={includeGlassLanternData}
                onChange={(e) => setIncludeGlassLanternData(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Seed case with Operation Glass Lantern synthetic evidence bundle</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold transition-colors cursor-pointer"
            >
              Initialize Investigation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
