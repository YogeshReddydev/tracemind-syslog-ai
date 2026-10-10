/**
 * Benchmark Lab View
 * Rigorous evaluation area executing documented test suites against the analysis pipeline.
 * Measures Precision, Recall, False-Positive Rate, Adversarial Injection Defense, and Execution Latency.
 */

import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Clock, 
  BarChart3, 
  Cpu, 
  RotateCcw,
  Info,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { 
  BENCHMARK_TEST_SUITE, 
  runBenchmarkSuite 
} from '../services/benchmarkSuite';
import { BenchmarkRunResult, BenchmarkMetrics } from '../types';

export const BenchmarkLabView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkRunResult[] | null>(null);
  const [metrics, setMetrics] = useState<BenchmarkMetrics | null>(null);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    try {
      const evaluation = await runBenchmarkSuite();
      setResults(evaluation.results);
      setMetrics(evaluation.metrics);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setMetrics(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium mb-1">
            <span>Evaluation & Verification</span>
            <span aria-hidden="true">·</span>
            <span>Ground Truth Test Matrix</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Forensic Pipeline Benchmark Lab
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical evaluation testbed testing false-positive suppression, timestamp window correlation, sensor contradictions, and adversarial prompt-injection isolation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {results && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded transition-colors cursor-pointer"
            >
              Reset Results
            </button>
          )}

          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer shadow-sm ${
              isRunning
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Executing Test Cases...' : 'Run Benchmark Suite'}</span>
          </button>
        </div>
      </div>

      {/* Measured Quantitative Metrics Strip */}
      {metrics ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-cyan-400">
              Measured Benchmark Evaluation Results
            </span>
            <span className="font-mono text-[11px]">
              Executed at {new Date(metrics.evaluatedAt).toLocaleTimeString()} · Real Measurements (Not Simulated)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Accuracy Pass Rate */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Pass Rate</span>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {((metrics.passedTests / metrics.totalTests) * 100).toFixed(0)}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {metrics.passedTests} / {metrics.totalTests} passed
              </span>
            </div>

            {/* Precision */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Precision</span>
              <div className="text-2xl font-bold font-mono text-teal-400 tabular-nums">
                {(metrics.precision * 100).toFixed(0)}%
              </div>
              <span className="text-[10px] text-slate-500">TP / (TP + FP)</span>
            </div>

            {/* Recall */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Recall</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
                {(metrics.recall * 100).toFixed(0)}%
              </div>
              <span className="text-[10px] text-slate-500">TP / (TP + FN)</span>
            </div>

            {/* False Positive Rate */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">False-Positive Rate</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {(metrics.falsePositiveRate * 100).toFixed(0)}%
              </div>
              <span className="text-[10px] text-slate-500">Benign misclassified</span>
            </div>

            {/* Prompt Injection Defense */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Injection Defense</span>
              <div className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">
                {(metrics.injectionDefenseRate * 100).toFixed(0)}%
              </div>
              <span className="text-[10px] text-slate-500">Payloads neutralized</span>
            </div>

            {/* Average Latency */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Avg Latency</span>
              <div className="text-2xl font-bold font-mono text-slate-200 tabular-nums">
                {metrics.avgLatencyMs}ms
              </div>
              <span className="text-[10px] text-slate-500">Per test case</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="text-xs">
              <span className="text-white font-medium block">Test Suite Ready for Execution</span>
              <span className="text-slate-400">
                Click "Run Benchmark Suite" above to execute all 7 ground-truth test cases and measure actual precision, recall, and safety metrics.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Documented Test Cases Matrix */}
      <div className="rounded-lg bg-slate-900/70 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Documented Ground-Truth Benchmark Cases ({BENCHMARK_TEST_SUITE.length})
            </h2>
            <p className="text-xs text-slate-400">
              Defined test scenarios with verified expected outcomes and adversarial injection tests.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {BENCHMARK_TEST_SUITE.map((testCase, idx) => {
            const runResult = results?.find(r => r.testId === testCase.id);

            return (
              <div 
                key={testCase.id}
                className="p-4 hover:bg-slate-850/40 transition-colors space-y-2 text-xs"
              >
                {/* Top Row: Case ID, Category, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60 text-xs">
                      {testCase.id}
                    </span>
                    <span className="text-white font-semibold text-xs">
                      {testCase.name}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400 uppercase font-mono text-[10px]">
                      {testCase.category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Execution Status Badge */}
                  <div>
                    {runResult ? (
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                          runResult.passed
                            ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60'
                            : 'text-rose-400 bg-rose-950/80 border border-rose-800/60'
                        }`}>
                          {runResult.passed ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>PASSED</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>FAILED</span>
                            </>
                          )}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          {runResult.latencyMs}ms
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">
                        Not evaluated yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-300 text-xs leading-relaxed">
                  {testCase.description}
                </p>

                {/* Ground Truth Expectation & Sample Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                  <div className="p-2 rounded bg-slate-950 border border-slate-850">
                    <span className="text-slate-500 font-medium block mb-0.5">Ground Truth Expectation:</span>
                    <div className="text-slate-200">
                      Should Flag Attack: <strong className="font-mono text-cyan-400">{testCase.expectedOutcome.shouldFlagAttack ? 'YES' : 'NO (Benign)'}</strong>
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      Expected Severity: <span className="font-mono">{testCase.expectedOutcome.expectedSeverity}</span>
                      {testCase.expectedOutcome.mitreTechniqueExpected && ` · MITRE ${testCase.expectedOutcome.mitreTechniqueExpected}`}
                    </div>
                  </div>

                  {runResult ? (
                    <div className="p-2 rounded bg-slate-950 border border-slate-850">
                      <span className="text-slate-500 font-medium block mb-0.5">Evaluation Output:</span>
                      <p className="text-slate-300 font-mono text-[10px]">
                        {runResult.notes}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-slate-950 border border-slate-850 text-slate-500 italic">
                      Click "Run Benchmark Suite" to evaluate against active pipeline.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
