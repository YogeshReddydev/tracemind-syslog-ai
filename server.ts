/**
 * TraceMind AI Express Backend Server
 * Hosts secure inference proxy for Open-Weight models, benchmark execution, and Vite dev middleware
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'tracemind-forensic-engine',
    timestamp: new Date().toISOString()
  });
});

// 1. Test Open-Weight Model Connection
app.post('/api/models/test-connection', async (req: Request, res: Response) => {
  const { endpointUrl, modelIdentifier, apiKey } = req.body;

  if (!endpointUrl) {
    return res.status(400).json({
      connected: false,
      error: 'Missing endpoint URL. Provide a valid HTTP/HTTPS endpoint (e.g. http://localhost:11434/v1 or http://localhost:8000/v1).'
    });
  }

  const cleanUrl = endpointUrl.replace(/\/+$/, '');
  const modelsEndpoint = cleanUrl.endsWith('/v1') ? `${cleanUrl}/models` : `${cleanUrl}/v1/models`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(modelsEndpoint, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const modelsList: string[] = Array.isArray(data?.data) 
        ? data.data.map((m: { id?: string }) => m.id || 'unknown') 
        : [];

      return res.json({
        connected: true,
        message: `Inference endpoint reached successfully. Found ${modelsList.length} loaded model(s).`,
        modelsAvailable: modelsList.slice(0, 10)
      });
    } else {
      return res.status(response.status).json({
        connected: false,
        error: `Endpoint returned HTTP ${response.status}: ${response.statusText}`
      });
    }
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({
      connected: false,
      error: `Could not reach endpoint at ${cleanUrl}. Error: ${errorMsg}. Ensure your open-weight inference server (e.g. vLLM or Ollama) is actively running.`
    });
  }
});

// 2. Open-Weight Model Analysis Proxy
app.post('/api/analyze', async (req: Request, res: Response) => {
  const { evidence, config, systemPrompt } = req.body;

  if (!config?.endpointUrl) {
    return res.status(400).json({
      success: false,
      error: 'Inference endpointUrl is not configured.'
    });
  }

  const cleanUrl = config.endpointUrl.replace(/\/+$/, '');
  const chatEndpoint = cleanUrl.endsWith('/v1') ? `${cleanUrl}/chat/completions` : `${cleanUrl}/v1/chat/completions`;

  const evidenceSummary = Array.isArray(evidence)
    ? evidence.map((e: { id: string; sourceType: string; sourceReference: string; rawContent: string }) => 
        `[EVIDENCE_ID: ${e.id} | TYPE: ${e.sourceType} | SOURCE: ${e.sourceReference}]\n${e.rawContent}\n`
      ).join('\n---\n')
    : '';

  const userPrompt = `Reconstruct the cyberattack sequence from the following UNTRUSTED forensic records.
Output strictly valid JSON with this exact schema:
{
  "timeline": [
    {
      "id": "tl-1",
      "evidenceId": "EVD-...",
      "timestamp": "ISO-8601 or undefined",
      "timestampDisplay": "...",
      "timestampConfidence": "exact" | "uncertain" | "missing",
      "eventTitle": "...",
      "description": "...",
      "severity": "critical" | "high" | "medium" | "low" | "informational",
      "confidenceScore": 0.0 - 1.0,
      "mitreAttack": { "id": "T...", "name": "...", "tactic": "..." },
      "entities": [{ "type": "user|host|ip|domain|file|process|alert|email", "value": "..." }],
      "isContradictory": false
    }
  ],
  "nodes": [
    { "id": "type:value", "label": "...", "type": "user|host|ip|domain|file|process|alert|email", "evidenceIds": ["EVD-..."], "severity": "critical|high|medium|low|informational" }
  ],
  "edges": [
    { "id": "edge-1", "source": "type:value", "target": "type:value", "relationship": "...", "type": "observed|deterministic|hypothesis|contradictory|unproven", "evidenceIds": ["EVD-..."], "explanation": "...", "confidence": 0.0 - 1.0 }
  ],
  "findings": [
    {
      "id": "FIND-001",
      "title": "...",
      "severity": "critical|high|medium|low|informational",
      "confidenceScore": 0.0 - 1.0,
      "confidenceExplanation": "...",
      "supportingEvidenceIds": ["EVD-..."],
      "evidenceExcerpts": [{ "evidenceId": "EVD-...", "source": "...", "quote": "..." }],
      "reasoningSummary": "...",
      "alternativeBenignExplanations": ["..."],
      "whatWouldDisproveThis": {
        "evidenceGaps": ["..."],
        "competingHypotheses": ["..."],
        "recommendedVerifications": ["..."]
      },
      "recommendedDefensiveActions": ["..."],
      "status": "new"
    }
  ]
}

FORENSIC EVIDENCE RECORDS:
${evidenceSummary}`;

  const controller = new AbortController();
  const timeoutMs = (config.timeoutSeconds || 30) * 1000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const payload = {
      model: config.modelIdentifier || 'llama3',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: config.temperature ?? 0.1,
      response_format: { type: 'json_object' }
    };

    const inferenceRes = await fetch(chatEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!inferenceRes.ok) {
      const errText = await inferenceRes.text();
      return res.status(inferenceRes.status).json({
        success: false,
        error: `Inference endpoint responded with HTTP ${inferenceRes.status}: ${errText}`
      });
    }

    const jsonRes = await inferenceRes.json();
    const content = jsonRes.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({
        success: false,
        error: 'Model returned empty response content.'
      });
    }

    // Parse and validate JSON
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch {
      // Try extracting json between triple backticks if present
      const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        parsedData = JSON.parse(match[1]);
      } else {
        throw new Error('Response is not valid JSON');
      }
    }

    return res.json({
      success: true,
      timeline: parsedData.timeline || [],
      nodes: parsedData.nodes || [],
      edges: parsedData.edges || [],
      findings: parsedData.findings || [],
      modelIdentifier: config.modelIdentifier,
      promptTokens: jsonRes.usage?.prompt_tokens,
      completionTokens: jsonRes.usage?.completion_tokens
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({
      success: false,
      error: `Failed during model inference: ${errorMsg}`
    });
  }
});

// Vite Middleware & Static Serving Setup
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TraceMind AI forensic platform listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
