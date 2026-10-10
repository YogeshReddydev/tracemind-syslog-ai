/**
 * Model Provider Settings Modal
 * Configures Open-Weight Model Mode (Ollama, vLLM, HuggingFace TGI, OpenAI-compatible)
 * versus Deterministic Development / Demo Engine.
 */

import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  ExternalLink,
  Shield,
  Layers,
  HelpCircle
} from 'lucide-react';
import { ModelProviderConfig } from '../types';
import { testOpenWeightConnection } from '../services/openWeightClient';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ModelProviderConfig;
  onSaveConfig: (updated: ModelProviderConfig) => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [mode, setMode] = useState<ModelProviderConfig['mode']>(config.mode);
  const [endpointUrl, setEndpointUrl] = useState(config.endpointUrl);
  const [modelIdentifier, setModelIdentifier] = useState(config.modelIdentifier);
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [temperature, setTemperature] = useState(config.temperature);
  const [timeoutSeconds, setTimeoutSeconds] = useState(config.timeoutSeconds);

  // Testing connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    message: string;
    latencyMs?: number;
    modelsAvailable?: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const result = await testOpenWeightConnection({
      mode: 'open_weight',
      endpointUrl,
      modelIdentifier,
      apiKey,
      temperature,
      timeoutSeconds,
      providerStatus: 'testing'
    });

    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = () => {
    onSaveConfig({
      mode,
      endpointUrl,
      modelIdentifier,
      apiKey,
      temperature,
      timeoutSeconds,
      providerStatus: testResult?.connected ? 'connected' : mode === 'demo' ? 'ready' : 'unavailable',
      lastError: testResult && !testResult.connected ? testResult.message : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-xl w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              AI Model Provider Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (Segmented control) */}
        <div className="space-y-1.5 text-xs">
          <label className="text-slate-400 font-medium block">
            Select Analysis Engine Mode:
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('demo')}
              className={`p-2.5 rounded-md text-left transition-colors cursor-pointer ${
                mode === 'demo'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-xs text-white">Development / Demo Mode</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Deterministic rule engine. No API endpoint or tokens required.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('open_weight')}
              className={`p-2.5 rounded-md text-left transition-colors cursor-pointer ${
                mode === 'open_weight'
                  ? 'bg-cyan-950/80 border border-cyan-700/60 text-cyan-200 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-xs text-cyan-300">Open-Weight Model Mode</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Ollama, vLLM, or OpenAI-compatible endpoint hosting open weights.
              </div>
            </button>
          </div>
        </div>

        {/* Mode Description & Inputs */}
        {mode === 'demo' ? (
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-semibold">
              <Shield className="w-4 h-4" />
              <span>Transparent Forensic Rule Engine</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              In this mode, all correlations, timeline sequences, and findings are generated by a deterministic rule engine adhering strictly to cyber-forensic logic.
            </p>
            <p className="text-slate-400 text-[11px]">
              Findings are transparently labeled as rule-generated, ensuring zero hallucinations while illustrating complete provenance tracking.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Endpoint URL */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                OpenAI-Compatible Inference Endpoint URL
              </label>
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="e.g. http://localhost:11434/v1 or https://api.together.xyz/v1"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Works with Ollama (port 11434), vLLM (port 8000), LocalAI, or remote open-weight hosts.
              </span>
            </div>

            {/* Model Identifier */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={modelIdentifier}
                  onChange={(e) => setModelIdentifier(e.target.value)}
                  placeholder="e.g. llama3.3:70b or mistral-7b"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Bearer Token / API Key (Optional)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Leave blank for local Ollama"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Test Connection Button & Status Box */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Verify Inference Availability:</span>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !endpointUrl}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-medium cursor-pointer transition-colors"
                >
                  <Play className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`p-2.5 rounded text-xs flex items-start gap-2 ${
                  testResult.connected
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                    : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                }`}>
                  {testResult.connected ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div className="space-y-0.5 font-mono text-[11px]">
                    <div>{testResult.message}</div>
                    {testResult.modelsAvailable && testResult.modelsAvailable.length > 0 && (
                      <div className="text-slate-400 text-[10px]">
                        Available models: {testResult.modelsAvailable.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <span className="text-slate-500 text-[11px]">
            Secrets remain server-side and are never exposed in browser logs.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold transition-colors cursor-pointer"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
