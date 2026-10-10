/**
 * Attack Timeline View
 * Interactive chronological reconstruction of cyberattack events with MITRE ATT&CK mapping,
 * confidence scores, uncertain-timestamp handling, and evidence provenance citations.
 */

import React, { useState } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  ExternalLink, 
  Filter, 
  Info,
  Calendar,
  CheckCircle,
  HelpCircle,
  AlertOctagon
} from 'lucide-react';
import { Investigation, TimelineEvent, SeverityLevel, EvidenceItem } from '../types';

interface TimelineViewProps {
  investigation: Investigation;
  onViewEvidenceDetail: (item: EvidenceItem) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  investigation,
  onViewEvidenceDetail
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [showOnlyContradictions, setShowOnlyContradictions] = useState(false);

  const events = investigation.timeline;

  const filteredEvents = events.filter((ev) => {
    if (selectedSeverity !== 'all' && ev.severity !== selectedSeverity) {
      return false;
    }
    if (showOnlyContradictions && !ev.isContradictory) {
      return false;
    }
    return true;
  });

  const getSeverityBadgeClass = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/70';
      case 'high':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/70';
      case 'medium':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/70';
      case 'low':
        return 'text-teal-400 bg-teal-950/60 border-teal-800/70';
      case 'informational':
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const handleEvidenceClick = (evidenceId: string) => {
    const item = investigation.evidence.find(e => e.id === evidenceId);
    if (item) {
      onViewEvidenceDetail(item);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium mb-1">
            <span>Case {investigation.caseNumber}</span>
            <span aria-hidden="true">·</span>
            <span>Chronological Correlation</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Attack Sequence Timeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological attack reconstruction preserving sensor timestamp uncertainties and telemetry discrepancies.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="informational">Informational / Benign</option>
          </select>

          <button
            onClick={() => setShowOnlyContradictions(prev => !prev)}
            className={`px-3 py-1.5 rounded border transition-colors cursor-pointer font-medium ${
              showOnlyContradictions
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Sensor Contradictions Only
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs rounded-lg border border-slate-800 bg-slate-900/40">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p>No timeline events found matching the selected filters.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-4 lg:ml-6 pl-6 space-y-8">
          {filteredEvents.map((event, index) => {
            const hasExactTime = event.timestampConfidence === 'exact';
            const isUncertain = event.timestampConfidence === 'uncertain';
            const isMissing = event.timestampConfidence === 'missing';

            return (
              <div key={event.id} className="relative group">
                {/* Node icon anchor on timeline line */}
                <div className={`absolute -left-[33px] top-1.5 w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center ${
                  event.severity === 'critical'
                    ? 'border-rose-500'
                    : event.severity === 'high'
                    ? 'border-amber-500'
                    : event.severity === 'medium'
                    ? 'border-cyan-500'
                    : 'border-slate-600'
                }`} />

                {/* Event Card (Single-elevation, hairline border) */}
                <div className={`p-4 rounded-lg bg-slate-900/70 border transition-all ${
                  event.isContradictory
                    ? 'border-rose-800/80 bg-rose-950/15'
                    : 'border-slate-800 hover:border-slate-700'
                }`}>
                  {/* Top Bar: Timestamp and Status Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-mono text-slate-200 font-semibold">
                        {event.timestampDisplay}
                      </span>
                      {isUncertain && (
                        <span className="text-[10px] text-amber-400 font-mono bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/50" title="Sensor clock drift window identified">
                          Estimated Window
                        </span>
                      )}
                      {isMissing && (
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                          Unrecorded Time
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Severity Badge */}
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold border ${getSeverityBadgeClass(event.severity)}`}>
                        {event.severity}
                      </span>

                      {/* Confidence Score */}
                      <span className="font-mono text-slate-400 text-[11px]">
                        Conf: {(event.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Event Title */}
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    {event.eventTitle}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {event.description}
                  </p>

                  {/* Contradiction Alert Box */}
                  {event.isContradictory && event.contradictionNotes && (
                    <div className="p-3 mb-3 rounded bg-rose-950/40 border border-rose-800/70 text-xs text-rose-300 flex items-start gap-2">
                      <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <strong className="block font-semibold mb-0.5 text-rose-200">
                          Forensic Telemetry Contradiction
                        </strong>
                        <span>{event.contradictionNotes}</span>
                      </div>
                    </div>
                  )}

                  {/* MITRE ATT&CK Mapping & Evidence Citation */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/60 text-xs">
                    {/* MITRE ATT&CK Tag */}
                    {event.mitreAttack ? (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500 font-medium">MITRE:</span>
                        <span className="font-mono text-cyan-400 font-semibold">
                          {event.mitreAttack.id}
                        </span>
                        <span className="text-slate-400">
                          {event.mitreAttack.name} ({event.mitreAttack.tactic})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">Uncategorized Event</span>
                    )}

                    {/* Evidence ID Reference */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[11px]">Source Record:</span>
                      <button
                        onClick={() => handleEvidenceClick(event.evidenceId)}
                        className="flex items-center gap-1 font-mono text-xs text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                        title="Inspect underlying evidence record"
                      >
                        <span>{event.evidenceId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Entities Involved */}
                  {event.entities && event.entities.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px]">
                      <span className="text-slate-500">Entities:</span>
                      {event.entities.map((ent, idx) => (
                        <span 
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono text-[10px] border border-slate-700/50"
                        >
                          {ent.type}:{ent.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
