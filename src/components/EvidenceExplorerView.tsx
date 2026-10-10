/**
 * Evidence Explorer View
 * Searchable, filterable inventory of forensic evidence items with indicator tags and excerpts
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  Hash, 
  Globe, 
  User, 
  Laptop, 
  Clock, 
  ArrowUpDown,
  AlertTriangle
} from 'lucide-react';
import { Investigation, EvidenceItem, ExtractedIndicator } from '../types';

interface EvidenceExplorerViewProps {
  investigation: Investigation;
  onViewEvidenceDetail: (item: EvidenceItem) => void;
  onSelectFinding: (findingId: string) => void;
}

export const EvidenceExplorerView: React.FC<EvidenceExplorerViewProps> = ({
  investigation,
  onViewEvidenceDetail,
  onSelectFinding
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtered evidence list
  const filteredEvidence = useMemo(() => {
    return investigation.evidence.filter((item) => {
      // Source type filter
      if (selectedSourceType !== 'all' && item.sourceType !== selectedSourceType) {
        return false;
      }
      // Confidence filter
      if (selectedConfidence !== 'all' && item.timestampConfidence !== selectedConfidence) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(query);
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesRef = item.sourceReference.toLowerCase().includes(query);
        const matchesContent = item.rawContent.toLowerCase().includes(query);
        const matchesIndicator = item.indicators.some(ind => ind.value.toLowerCase().includes(query));
        return matchesId || matchesTitle || matchesRef || matchesContent || matchesIndicator;
      }
      return true;
    }).sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [investigation.evidence, searchQuery, selectedSourceType, selectedConfidence, sortOrder]);

  // Find findings referencing an evidence item
  const getRelatedFindings = (evidenceId: string) => {
    return investigation.findings.filter(f => f.supportingEvidenceIds.includes(evidenceId));
  };

  const sourceTypes = [
    { id: 'all', label: 'All Sources' },
    { id: 'auth_log', label: 'Authentication Logs' },
    { id: 'email', label: 'Emails' },
    { id: 'endpoint_edr', label: 'Endpoint / EDR' },
    { id: 'network_dns', label: 'Network DNS' },
    { id: 'firewall', label: 'Firewall' },
    { id: 'syslog', label: 'System Logs' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium mb-1">
            <span>Case {investigation.caseNumber}</span>
            <span aria-hidden="true">·</span>
            <span>Forensic Inventory</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Evidence Explorer
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed breakdown of {investigation.evidence.length} ingested records with extracted observables and provenance citations.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search indicators, IPs, files, text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 placeholder:text-slate-500 w-64 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-md text-xs cursor-pointer transition-colors"
            title="Toggle timestamp sorting order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Source Type Filter Tabs (segmented) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
        {sourceTypes.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedSourceType(tab.id)}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedSourceType === tab.id
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Evidence Cards List */}
      <div className="space-y-4">
        {filteredEvidence.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs rounded-lg border border-slate-800 bg-slate-900/40">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>No evidence records matched your search or filters.</p>
          </div>
        ) : (
          filteredEvidence.map((item) => {
            const relatedFindings = getRelatedFindings(item.id);

            return (
              <div 
                key={item.id}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
              >
                {/* Top Row: ID, Source, Timestamp, Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                      {item.id}
                    </span>
                    <span className="text-slate-300 font-medium uppercase">{item.sourceType}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400 font-mono text-[11px] truncate max-w-xs">{item.sourceReference}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {item.timestamp ? new Date(item.timestamp).toUTCString() : 'Timestamp Missing / Uncertain'}
                      </span>
                    </div>

                    <button
                      onClick={() => onViewEvidenceDetail(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors cursor-pointer text-xs font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Raw Excerpt</span>
                    </button>
                  </div>
                </div>

                {/* Title & Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {item.summary}
                  </p>
                </div>

                {/* Raw Excerpt Preview Box */}
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {item.rawContent.substring(0, 320)}
                  {item.rawContent.length > 320 ? ' ...' : ''}
                </div>

                {/* Indicators Strip & Related Findings */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60 text-xs">
                  {/* Extracted Indicators */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">Indicators:</span>
                    {item.indicators.slice(0, 5).map((ind) => (
                      <span 
                        key={ind.id} 
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700/60"
                        title={`${ind.type.toUpperCase()}: ${ind.value}`}
                      >
                        {ind.value}
                      </span>
                    ))}
                    {item.indicators.length > 5 && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        +{item.indicators.length - 5} more
                      </span>
                    )}
                  </div>

                  {/* Related Findings Citations */}
                  <div className="flex items-center gap-1.5">
                    {relatedFindings.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px]">Cited in:</span>
                        {relatedFindings.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => onSelectFinding(f.id)}
                            className="font-mono text-[10px] text-cyan-400 hover:underline cursor-pointer"
                          >
                            {f.id}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No direct attack finding linked</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
