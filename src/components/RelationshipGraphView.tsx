/**
 * Interactive Provenance & Relationship Graph
 * Visualizes accounts, hosts, IPs, domains, files, and alerts.
 * Features distinctive edge styling (Observed vs AI-Hypothesis vs Deterministic vs Contradictory),
 * pan/zoom canvas, node dragging, and an evidence inspection drawer.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  X, 
  ExternalLink, 
  ShieldAlert, 
  Server, 
  User, 
  Globe, 
  FileCode, 
  Mail, 
  Terminal, 
  AlertCircle,
  HelpCircle,
  Layers
} from 'lucide-react';
import { 
  Investigation, 
  GraphNode, 
  GraphEdge, 
  EntityType, 
  RelationshipType, 
  EvidenceItem 
} from '../types';

interface RelationshipGraphViewProps {
  investigation: Investigation;
  onViewEvidenceDetail: (item: EvidenceItem) => void;
}

export const RelationshipGraphView: React.FC<RelationshipGraphViewProps> = ({
  investigation,
  onViewEvidenceDetail
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Selection state for inspector
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  // Entity Type Filter
  const [activeTypeFilters, setActiveTypeFilters] = useState<Record<EntityType, boolean>>({
    user: true,
    host: true,
    ip: true,
    domain: true,
    file: true,
    process: true,
    alert: true,
    email: true,
  });

  // Edge Type Filter
  const [activeEdgeFilters, setActiveEdgeFilters] = useState<Record<RelationshipType, boolean>>({
    observed: true,
    deterministic: true,
    hypothesis: true,
    contradictory: true,
    unproven: true,
  });

  // Calculate layout coordinates for nodes (deterministic circular/clustered layout)
  const initialNodes = useMemo(() => {
    const rawNodes = investigation.nodes;
    const width = 850;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;

    // Group nodes by entity type for clean aesthetic clustering
    const angleStep = (2 * Math.PI) / Math.max(1, rawNodes.length);

    return rawNodes.map((node, index) => {
      // Offset by entity type for cyber-forensic radar layout
      let radius = 200;
      if (node.type === 'user' || node.type === 'host') radius = 130;
      if (node.type === 'domain' || node.type === 'ip') radius = 240;
      if (node.type === 'process' || node.type === 'file') radius = 180;

      const angle = index * angleStep;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle) + (Math.sin(index * 2) * 20),
        y: centerY + radius * Math.sin(angle) + (Math.cos(index * 2) * 20)
      };
    });
  }, [investigation.nodes]);

  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);

  // Sync when investigation changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Canvas Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTranslate({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggingNodeId) {
      // Update dragged node position
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - translate.x) / scale;
      const mouseY = (e.clientY - rect.top - translate.y) / scale;

      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: mouseX, y: mouseY } : n));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(2.5, Math.max(0.4, prev + delta)));
  };

  const handleResetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const getNodeIcon = (type: EntityType) => {
    switch (type) {
      case 'user': return <User className="w-3.5 h-3.5" />;
      case 'host': return <Server className="w-3.5 h-3.5" />;
      case 'ip': return <Globe className="w-3.5 h-3.5" />;
      case 'domain': return <Globe className="w-3.5 h-3.5" />;
      case 'file': return <FileCode className="w-3.5 h-3.5" />;
      case 'process': return <Terminal className="w-3.5 h-3.5" />;
      case 'email': return <Mail className="w-3.5 h-3.5" />;
      case 'alert': return <AlertCircle className="w-3.5 h-3.5" />;
      default: return <Server className="w-3.5 h-3.5" />;
    }
  };

  const getNodeColor = (type: EntityType) => {
    switch (type) {
      case 'user': return '#38bdf8'; // sky blue
      case 'host': return '#34d399'; // emerald
      case 'ip': return '#f59e0b'; // amber
      case 'domain': return '#a855f7'; // purple
      case 'file': return '#f43f5e'; // rose
      case 'process': return '#fb923c'; // orange
      case 'email': return '#06b6d4'; // cyan
      case 'alert': return '#ef4444'; // crimson
      default: return '#94a3b8';
    }
  };

  // Node position map for edge rendering
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach(n => {
      if (n.x !== undefined && n.y !== undefined) {
        map.set(n.id, { x: n.x, y: n.y });
      }
    });
    return map;
  }, [nodes]);

  // Filtered nodes
  const visibleNodes = nodes.filter(n => activeTypeFilters[n.type] !== false);
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

  // Filtered edges
  const visibleEdges = investigation.edges.filter(e => {
    if (!visibleNodeIds.has(e.source) || !visibleNodeIds.has(e.target)) return false;
    if (activeEdgeFilters[e.type] === false) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium mb-1">
            <span>Case {investigation.caseNumber}</span>
            <span aria-hidden="true">·</span>
            <span>Attack Provenance Topology</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Entity & Event Provenance Graph
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive topological graph connecting accounts, hosts, IPs, and payloads. Click any node or edge to inspect underlying evidence.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => handleZoom(0.2)}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Graph Position"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
        {/* Edge Styles Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-slate-400 font-medium">Edge Provenance:</span>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-cyan-400 inline-block" />
            <span className="text-slate-300">Observed Log Record</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 border-t-2 border-dashed border-teal-400 inline-block" />
            <span className="text-slate-300">Deterministic Correlation</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 border-t-2 border-dotted border-amber-400 inline-block" />
            <span className="text-amber-300">AI-Proposed Hypothesis</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
            <span className="text-rose-400 font-medium">Contradictory Telemetry</span>
          </div>
        </div>

        {/* Entity Count Badge */}
        <div className="text-slate-400 font-mono text-[11px]">
          Showing {visibleNodes.length} nodes · {visibleEdges.length} relationships
        </div>
      </div>

      {/* Main Graph Canvas Container with Split Inspector Drawer */}
      <div className="relative rounded-lg bg-slate-950 border border-slate-800 h-[620px] overflow-hidden select-none">
        {/* SVG Interactive Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        >
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 850 550"
            className="w-full h-full"
          >
            {/* SVG Filter for glow and markers */}
            <defs>
              <marker
                id="arrow-observed"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
              </marker>

              <marker
                id="arrow-deterministic"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#14b8a6" />
              </marker>

              <marker
                id="arrow-hypothesis"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>

              <marker
                id="arrow-contradictory"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Transform Group */}
            <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
              {/* Background Radar Rings */}
              <circle cx="425" cy="275" r="130" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="425" cy="275" r="200" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="425" cy="275" r="260" fill="none" stroke="#0f172a" strokeWidth="1" />

              {/* Render Edges */}
              {visibleEdges.map((edge) => {
                const sPos = nodePositionMap.get(edge.source);
                const tPos = nodePositionMap.get(edge.target);
                if (!sPos || !tPos) return null;

                const isSelected = selectedEdge?.id === edge.id;
                let strokeColor = '#06b6d4';
                let strokeDash = '';
                let markerId = 'arrow-observed';

                if (edge.type === 'deterministic') {
                  strokeColor = '#14b8a6';
                  strokeDash = '6,4';
                  markerId = 'arrow-deterministic';
                } else if (edge.type === 'hypothesis') {
                  strokeColor = '#f59e0b';
                  strokeDash = '2,4';
                  markerId = 'arrow-hypothesis';
                } else if (edge.type === 'contradictory') {
                  strokeColor = '#ef4444';
                  strokeDash = '8,3';
                  markerId = 'arrow-contradictory';
                }

                // Midpoint for label
                const midX = (sPos.x + tPos.x) / 2;
                const midY = (sPos.y + tPos.y) / 2;

                return (
                  <g key={edge.id} className="cursor-pointer" onClick={() => setSelectedEdge(edge)}>
                    <line
                      x1={sPos.x}
                      y1={sPos.y}
                      x2={tPos.x}
                      y2={tPos.y}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3.5 : 1.8}
                      strokeDasharray={strokeDash}
                      markerEnd={`url(#${markerId})`}
                      opacity={isSelected ? 1 : 0.75}
                      className="transition-all hover:opacity-100"
                    />

                    {/* Edge Label Pill */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-45"
                        y="-10"
                        width="90"
                        height="20"
                        rx="4"
                        fill="#030712"
                        stroke={strokeColor}
                        strokeWidth="1"
                        opacity="0.9"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="9"
                        fontFamily="monospace"
                        className="pointer-events-none"
                      >
                        {edge.relationship}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Render Nodes */}
              {visibleNodes.map((node) => {
                if (node.x === undefined || node.y === undefined) return null;
                const isSelected = selectedNode?.id === node.id;
                const color = getNodeColor(node.type);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingNodeId(node.id);
                    }}
                    onClick={() => {
                      setSelectedNode(node);
                      setSelectedEdge(null);
                    }}
                  >
                    {/* Outer Ring on selection */}
                    {isSelected && (
                      <circle
                        r="24"
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        className="animate-spin"
                        style={{ animationDuration: '8s' }}
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      r="16"
                      fill="#0b1329"
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all hover:scale-110"
                    />

                    {/* Node Type Dot */}
                    <circle
                      r="4"
                      fill={color}
                    />

                    {/* Label below node */}
                    <text
                      y="28"
                      textAnchor="middle"
                      fill="#f1f5f9"
                      fontSize="11"
                      fontWeight="600"
                      className="pointer-events-none drop-shadow-md"
                    >
                      {node.label}
                    </text>
                    <text
                      y="40"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      className="pointer-events-none uppercase"
                    >
                      {node.type}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Selected Node / Edge Inspection Drawer (Right Slide-over) */}
        {(selectedNode || selectedEdge) && (
          <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-slate-950/95 backdrop-blur-md border-l border-slate-800 p-5 overflow-y-auto space-y-4 shadow-xl z-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-cyan-400 font-bold">
                  {selectedNode ? 'NODE INSPECTOR' : 'RELATIONSHIP INSPECTOR'}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedEdge(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inspector content for Selected Node */}
            {selectedNode && (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block font-mono">Entity Identifier</span>
                  <div className="text-base font-bold text-white mt-0.5 break-all">
                    {selectedNode.label}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold"
                      style={{ 
                        color: getNodeColor(selectedNode.type),
                        backgroundColor: `${getNodeColor(selectedNode.type)}20`,
                        border: `1px solid ${getNodeColor(selectedNode.type)}40`
                      }}
                    >
                      {selectedNode.type}
                    </span>
                    {selectedNode.severity && (
                      <span className="text-slate-400 font-mono text-[10px]">
                        Severity: {selectedNode.severity}
                      </span>
                    )}
                  </div>
                </div>

                {/* Associated Evidence Records */}
                <div>
                  <span className="text-slate-400 font-semibold block mb-2">
                    Supporting Evidence Records ({selectedNode.evidenceIds.length}):
                  </span>
                  <div className="space-y-2">
                    {selectedNode.evidenceIds.map((evId) => {
                      const item = investigation.evidence.find(e => e.id === evId);
                      return (
                        <div 
                          key={evId}
                          className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-cyan-400 font-semibold">{evId}</span>
                            {item && (
                              <button
                                onClick={() => onViewEvidenceDetail(item)}
                                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>Inspect Excerpt</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {item && (
                            <p className="text-slate-300 text-[11px] line-clamp-2">
                              {item.title}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Inspector content for Selected Edge */}
            {selectedEdge && (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 uppercase text-[10px] block font-mono">Relationship Label</span>
                  <div className="text-base font-bold text-white mt-0.5">
                    {selectedEdge.relationship}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold bg-slate-900 text-cyan-300 border border-slate-800">
                      Type: {selectedEdge.type}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      Confidence: {(selectedEdge.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">
                    Correlated Entities:
                  </span>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                    <div>Source: <span className="text-cyan-400">{selectedEdge.source}</span></div>
                    <div>Target: <span className="text-teal-400">{selectedEdge.target}</span></div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">
                    Provenance Explanation:
                  </span>
                  <p className="text-slate-300 leading-relaxed text-xs p-2.5 rounded bg-slate-900 border border-slate-800">
                    {selectedEdge.explanation}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-2">
                    Evidence Citations:
                  </span>
                  <div className="space-y-1.5">
                    {selectedEdge.evidenceIds.map((evId) => {
                      const item = investigation.evidence.find(e => e.id === evId);
                      return (
                        <div key={evId} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="font-mono text-cyan-400">{evId}</span>
                          {item && (
                            <button
                              onClick={() => onViewEvidenceDetail(item)}
                              className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Raw</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
