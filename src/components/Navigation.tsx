/**
 * Top Navigation Bar
 * Follows the 3-zone contract:
 * Zone 1: Single brand wordmark
 * Zone 2: Clean single-line nav links
 * Zone 3: Primary action button and model status
 */

import React from 'react';
import { 
  ShieldAlert, 
  Settings2, 
  Plus, 
  Cpu
} from 'lucide-react';
import { ModelProviderConfig } from '../types';

export type ActiveTab = 
  | 'dashboard' 
  | 'workspace' 
  | 'evidence' 
  | 'timeline' 
  | 'graph' 
  | 'findings' 
  | 'benchmark';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenNewInvestigation: () => void;
  onOpenModelSettings: () => void;
  modelConfig: ModelProviderConfig;
  activeInvestigationName: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenNewInvestigation,
  onOpenModelSettings,
  modelConfig,
  activeInvestigationName
}) => {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'evidence', label: 'Evidence Explorer' },
    { id: 'timeline', label: 'Attack Timeline' },
    { id: 'graph', label: 'Provenance Graph' },
    { id: 'findings', label: 'Findings & Report' },
    { id: 'benchmark', label: 'Benchmark Lab' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-8 max-w-7xl mx-auto">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <button 
            onClick={() => onTabChange('dashboard')}
            className="text-left group cursor-pointer"
          >
            <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors whitespace-nowrap">
              TraceMind AI
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean single-line prose links) */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 ${
                  isActive
                    ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400 -mb-[1px]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Mode Status & Primary Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mode Indicator / Config Trigger */}
          <button
            onClick={onOpenModelSettings}
            title="Configure Open-Weight LLM or Demo Mode"
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">
              {modelConfig.mode === 'open_weight' ? `Open-Weight (${modelConfig.modelIdentifier})` : 'Demo Engine (Deterministic)'}
            </span>
            <Settings2 className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onOpenNewInvestigation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-cyan-950"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Investigation</span>
          </button>
        </div>
      </div>

      {/* Sub-bar for mobile/tablet responsive tabs & active case breadcrumb */}
      <div className="xl:hidden flex items-center justify-between gap-2 overflow-x-auto pt-2.5 mt-2 border-t border-slate-800/60 no-scrollbar">
        <div className="flex items-center gap-4 text-xs">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`whitespace-nowrap py-1 ${
                activeTab === item.id
                  ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
