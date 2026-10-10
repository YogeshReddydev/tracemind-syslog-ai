# TraceMind AI — Evidence-Driven Cyberattack Reconstruction Platform

TraceMind AI is a defensive cybersecurity and digital forensics application that correlates heterogeneous forensic logs, alerts, emails, and network events into verifiable attack timelines, provenance graphs, and hypothesis-tested investigation reports.

---

## Key Capabilities

1. **Evidence Normalization & Ingestion Pipeline**
   - Ingests authentication logs, suspicious emails (RFC MIME/headers), endpoint EDR detections, recursive DNS queries, perimeter firewall drops, and analyst incident reports.
   - Safe parsing for structured **JSON** and **CSV** files with 5MB file-size limits.
   - Automated indicator extraction: IPv4 addresses, domains, email accounts, binary hashes (MD5, SHA-256), hostnames, executable artifacts, and CVE identifiers.
   - **Adversarial Prompt-Injection Defense**: Treats all supplied evidence strictly as untrusted data strings. Inspects and neutralizes embedded command overrides (e.g. `[SYSTEM OVERRIDE: ignore previous rules]`), preserving forensic integrity.

2. **Model Provider Abstraction (Two Explicit Modes)**
   - **A. Open-Weight Model Mode**:
     - Connects to OpenAI-compatible inference endpoints (e.g., local **Ollama** at `http://localhost:11434/v1`, **vLLM** at `http://localhost:8000/v1`, HuggingFace TGI, or remote endpoints hosting models such as `Llama-3.3-70B-Instruct`, `Qwen-2.5-72B`, or `Mistral-Small`).
     - Extracts structured observations and proposes attack path hypotheses.
     - Transparently indicates when the provider is offline or unreachable with actionable diagnostics. Never silently falls back to proprietary closed models.
   - **B. Development / Demo Mode**:
     - Fully offline, deterministic rule engine applying cyber-forensic correlation logic.
     - Transparently stamps findings as `Deterministic Rule Engine` to prevent confusing simulation with language model inference.

3. **Built-in Synthetic Investigation: "Operation Glass Lantern"**
   - Fictional case (`SEC-2026-GL-891`) featuring synthetic RFC 5737 example IP addresses and internal domain names.
   - Includes standard daytime SSO auth, anomalous off-hours login (`198.51.100.89`), spearphishing dual-extension email (`Benefits_Summary_2026.pdf.exe`), EDR encoded PowerShell execution (`WS-SEC-4091`), fast-flux DNS C2 resolution (`lantern-mesh.org`), verified benign IT backup transfer (`backblaze-agent` 4.2GB transfer), and an edge sensor telemetry contradiction (firewall TCP RST at 02:46 vs EDR socket at 02:48).

4. **Interactive Attack Sequence Timeline**
   - Chronological event cards mapped to **MITRE ATT&CK** techniques (e.g., T1566.001, T1078.004, T1059.001, T1071.004).
   - Preserves timestamp uncertainties (`Exact`, `Estimated Window / Clock Drift`, and `Unrecorded Time`) without fabricating exact event timestamps.
   - Highlights sensor contradictions with dedicated investigation callouts.

5. **Entity & Event Provenance Graph**
   - Interactive SVG canvas with zoom, pan, node dragging, and radar ring clustering.
   - Distinctive visual edge styling:
     - **Observed Log Record**: Solid cyan line.
     - **Deterministic Correlation**: Dashed teal line.
     - **AI-Proposed Hypothesis**: Dotted amber line.
     - **Contradictory Telemetry**: Dashed crimson line with alert marker.
   - Inspection Drawer displaying supporting evidence records, citations, and confidence scores for selected nodes and relationships.

6. **Findings & Hypothesis Testing with "What Would Disprove This?"**
   - Findings include confidence scores, explanations, and verbatim evidence quotes.
   - Identifies alternative benign explanations for every finding.
   - **"What Would Disprove This?" section**: enumerates missing telemetry gaps, competing hypotheses, and concrete verification steps.
   - Analyst disposition workflow: `New` → `Reviewing` → `Confirmed` → `Dismissed`.
   - Export full case reports in **Markdown** or structured **JSON**.

7. **Benchmark Lab**
   - Ground-truth evaluation testbed with 7 documented test cases:
     1. Benign Administrative Backup (False-Positive Control)
     2. Suspicious Off-Hours Auth Anomaly
     3. Spearphishing with Dual-Extension Dropper
     4. Timestamp Correlation with Clock Drift Window
     5. Contradictory Telemetry (Firewall RST vs Active Socket)
     6. Missing Telemetry Gaps & Unrecorded Timestamps
     7. Adversarial Prompt-Injection Embedded in Forensic Evidence
   - Computes measured **Precision**, **Recall**, **False-Positive Rate**, **Injection Defense Rate**, and **Execution Latency**.

---

## Architecture & Security Model

- **Full-Stack Execution**: Express backend (`server.ts`) hosting secure model inference proxies and API routes, mounted alongside Vite middleware.
- **Defensive Containment**: No uploaded file is ever executed or detoured to external command interpreters.
- **Credential Safety**: Inference endpoints and API keys are stored in backend environment variables or secure server-side proxies, never exposed in client bundles.
- **Typography & Theme**: Built in strict adherence to the universal frontend constitution with dark navy (`#030712`), slate panels, cyan/teal accents, JetBrains Mono tabular figures, and zero marketing slop.

---

## Open-Weight Inference Setup Guide

To connect your own local or remote open-weight inference endpoint:

1. **Using Ollama (Local)**:
   ```bash
   ollama run llama3.3:70b
   ```
   In TraceMind AI, click **Settings (top bar)**:
   - Mode: `Open-Weight Model Mode`
   - Endpoint URL: `http://localhost:11434/v1`
   - Model Identifier: `llama3.3:70b`
   - Click **Test Connection** → **Apply Settings**.

2. **Using vLLM (Local / GPU Server)**:
   ```bash
   vllm serve Qwen/Qwen2.5-32B-Instruct --port 8000
   ```
   In TraceMind AI:
   - Endpoint URL: `http://localhost:8000/v1`
   - Model Identifier: `Qwen/Qwen2.5-32B-Instruct`
   - Click **Test Connection** → **Apply Settings**.

3. **Using Remote Open-Weight Hosts (Together AI, Groq, OpenRouter)**:
   - Endpoint URL: `https://api.together.xyz/v1`
   - Model Identifier: `meta-llama/Llama-3.3-70B-Instruct-Turbo`
   - Bearer Token: `<YOUR_KEY>`
