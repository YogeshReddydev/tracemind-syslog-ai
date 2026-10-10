/**
 * Evidence Detail Modal
 * Safe forensic viewer displaying raw text, extracted indicators, and prompt injection audit
 */

import React from 'react';
import { 
  X, 
  FileText, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  Tag, 
  Database,
  ShieldAlert
} from 'lucide-react';
import { EvidenceItem } from '../types';
import { detectPromptInjection } from '../services/normalization';

interface EvidenceDetailModalProps {
  evidenceItem: EvidenceItem | null;
  onClose: () => void;
}

export const EvidenceDetailModal: React.FC<EvidenceDetailModalProps> = ({
  evidenceItem,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!evidenceItem) return null;

  const injectionCheck = detectPromptInjection(evidenceItem.rawContent);

  const handleCopy = () => {
    navigator.clipboard.writeText(evidenceItem.rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 text-xs">
              {evidenceItem.id}
            </span>
            <span className="text-white font-semibold text-sm">
              {evidenceItem.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950 p-3 rounded border border-slate-850">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Source Type</span>
            <span className="text-slate-200 font-medium uppercase">{evidenceItem.sourceType}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Reference</span>
            <span className="text-slate-200 font-mono text-[11px] truncate block" title={evidenceItem.sourceReference}>
              {evidenceItem.sourceReference}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Timestamp</span>
            <span className="text-slate-200 font-mono text-[11px]">
              {evidenceItem.timestamp ? new Date(evidenceItem.timestamp).toUTCString() : 'Uncertain / Missing'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">File Size</span>
            <span className="text-slate-200 font-mono text-[11px] tabular-nums">
              {evidenceItem.sizeBytes} bytes
            </span>
          </div>
        </div>

        {/* Prompt Injection Audit Warning if detected */}
        {injectionCheck.hasInjection && (
          <div className="p-3 rounded bg-amber-950/60 border border-amber-800/80 text-xs text-amber-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Adversarial Injection Pattern Detected:</strong>
              <span>
                Evidence text contains command overrides: {injectionCheck.patternsDetected.join(', ')}.
                TraceMind has treated this as static untrusted log data without execution.
              </span>
            </div>
          </div>
        )}

        {/* Extracted Indicators Badges */}
        <div className="space-y-1.5 text-xs">
          <span className="text-slate-400 font-semibold block">
            Extracted Observables ({evidenceItem.indicators.length}):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded bg-slate-950 border border-slate-850">
            {evidenceItem.indicators.map((ind) => (
              <span
                key={ind.id}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700"
                title={`${ind.type}: ${ind.context || ind.value}`}
              >
                <strong className="text-cyan-400 mr-1">{ind.type}:</strong>
                {ind.value}
              </span>
            ))}
          </div>
        </div>

        {/* Raw Forensic Content with Copy Button */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold">
              Verbatim Log Content:
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Content</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3.5 rounded bg-slate-950 border border-slate-850 font-mono text-xs text-slate-200 overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed">
            {evidenceItem.rawContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
