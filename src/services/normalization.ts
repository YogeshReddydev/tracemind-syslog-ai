/**
 * Evidence Normalization & Ingestion Pipeline
 * Defensive cybersecurity parsing & safe indicator extraction
 */

import { EvidenceItem, ExtractedIndicator, EntityType } from '../types';

// Regex patterns for indicators
const IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const DOMAIN_REGEX = /\b(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|internal|corp|local|edu|gov|xyz|biz|ru|cn)\b/gi;
const SHA256_REGEX = /\b[a-fA-F0-9]{64}\b/g;
const MD5_REGEX = /\b[a-fA-F0-9]{32}\b/g;
const CVE_REGEX = /\bCVE-\d{4}-\d{4,7}\b/gi;
const FILE_EXE_REGEX = /\b[\w-]+\.(?:exe|ps1|bat|vbs|sh|elf|bin|dll|scr|hta|iso|docx|xlsx|pdf\.exe)\b/gi;

// Known prompt injection patterns in untrusted logs
const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /system override/i,
  /you are now a helpful/i,
  /reveal secrets/i,
  /disregard rules/i,
  /classify this as benign/i,
  /act as/i
];

/**
 * Checks for prompt injection attempts in untrusted evidence strings.
 * Flags them defensively so they can be isolated and neutralized.
 */
export function detectPromptInjection(text: string): { hasInjection: boolean; patternsDetected: string[] } {
  const matches: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      matches.push(pattern.source);
    }
  }
  return {
    hasInjection: matches.length > 0,
    patternsDetected: matches
  };
}

/**
 * Neutralizes untrusted evidence to prevent prompt injection or execution
 */
export function sanitizeEvidenceContent(raw: string): string {
  // Never execute, strip dangerous control characters, cap length
  if (!raw) return '';
  let sanitized = raw.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
  if (sanitized.length > 100000) {
    sanitized = sanitized.substring(0, 100000) + '\n... [TRUNCATED DUE TO SIZE LIMIT: 100KB]';
  }
  return sanitized;
}

/**
 * Safe JSON parser with size guard
 */
export function parseJsonEvidence(content: string): { valid: boolean; data?: unknown; error?: string } {
  try {
    if (content.length > 5 * 1024 * 1024) {
      return { valid: false, error: 'File exceeds maximum 5MB size limit.' };
    }
    const parsed = JSON.parse(content);
    return { valid: true, data: parsed };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}

/**
 * Safe CSV parser (without external eval/unsafe routines)
 */
export function parseCsvEvidence(content: string): { valid: boolean; rows?: Record<string, string>[]; error?: string } {
  try {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { valid: false, error: 'CSV requires at least a header row and one data row.' };
    }
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] || '';
      });
      rows.push(row);
    }
    return { valid: true, rows };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}

/**
 * Extracts indicators (IPs, emails, domains, hashes, CVEs, files)
 */
export function extractIndicators(text: string): ExtractedIndicator[] {
  const indicators: ExtractedIndicator[] = [];
  const seen = new Set<string>();

  const add = (type: EntityType, value: string, context?: string) => {
    const normalized = value.trim().toLowerCase();
    const key = `${type}:${normalized}`;
    if (!seen.has(key) && normalized.length > 2) {
      seen.add(key);
      indicators.push({
        id: `ind-${Math.random().toString(36).substring(2, 9)}`,
        type,
        value: value.trim(),
        context
      });
    }
  };

  // 1. IP Addresses
  const ips = text.match(IP_REGEX) || [];
  for (const ip of ips) {
    // Exclude basic invalid masks
    if (ip !== '0.0.0.0' && ip !== '255.255.255.255') {
      add('ip', ip, 'Network endpoint');
    }
  }

  // 2. Email Addresses
  const emails = text.match(EMAIL_REGEX) || [];
  for (const email of emails) {
    add('email', email, 'Communication account');
    // Also extract user identity from email
    const [user] = email.split('@');
    if (user && user.length > 2) {
      add('user', user, `User handle extracted from ${email}`);
    }
  }

  // 3. Hashes
  const sha256s = text.match(SHA256_REGEX) || [];
  for (const hash of sha256s) {
    add('file', hash, 'SHA-256 binary hash');
  }
  const md5s = text.match(MD5_REGEX) || [];
  for (const hash of md5s) {
    add('file', hash, 'MD5 binary hash');
  }

  // 4. Domains (avoid double matching plain IPs)
  const domains = text.match(DOMAIN_REGEX) || [];
  for (const d of domains) {
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(d)) {
      add('domain', d, 'Network domain');
    }
  }

  // 5. Hostnames in common formats like WS-SEC-4091 or SERVER-DC-01
  const hostMatches = text.match(/\b(?:WS|SRV|HOST|DC|DESKTOP|LAPTOP)-[A-Za-z0-9_-]+\b/g) || [];
  for (const host of hostMatches) {
    add('host', host, 'Workstation / server asset');
  }

  // 6. Suspicious executable files
  const files = text.match(FILE_EXE_REGEX) || [];
  for (const file of files) {
    add('file', file, 'Payload / executable artifact');
  }

  // 7. CVEs
  const cves = text.match(CVE_REGEX) || [];
  for (const cve of cves) {
    add('alert', cve.toUpperCase(), 'Vulnerability reference');
  }

  return indicators;
}

/**
 * Attempts to extract or normalize timestamp from evidence
 */
export function extractTimestamp(text: string): { timestamp?: string; confidence: 'exact' | 'uncertain' | 'missing' } {
  // ISO 8601 regex: e.g. 2026-10-09T08:14:22Z or 2026-10-09 08:14:22
  const isoMatch = text.match(/\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/);
  if (isoMatch) {
    try {
      const parsed = new Date(isoMatch[0].replace(' ', 'T'));
      if (!isNaN(parsed.getTime())) {
        return { timestamp: parsed.toISOString(), confidence: 'exact' };
      }
    } catch {
      // Fall through
    }
  }

  // Syslog date regex: e.g. Oct 09 02:41:10
  const syslogMatch = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})\b/);
  if (syslogMatch) {
    try {
      const currentYear = new Date().getFullYear();
      const candidate = `${syslogMatch[1]} ${syslogMatch[2]}, ${currentYear} ${syslogMatch[3]} UTC`;
      const parsed = new Date(candidate);
      if (!isNaN(parsed.getTime())) {
        return { timestamp: parsed.toISOString(), confidence: 'uncertain' };
      }
    } catch {
      // Fall through
    }
  }

  // Look for relative or approximate time keywords
  if (/(approx|around|window of|between|circa|estimated)/i.test(text)) {
    return { confidence: 'uncertain' };
  }

  return { confidence: 'missing' };
}

/**
 * Creates a normalized EvidenceItem
 */
export function createEvidenceItem(params: {
  id?: string;
  sourceType: EvidenceItem['sourceType'];
  sourceReference: string;
  title: string;
  rawContent: string;
  fileFormat?: EvidenceItem['fileFormat'];
}): EvidenceItem {
  const safeContent = sanitizeEvidenceContent(params.rawContent);
  const { timestamp, confidence } = extractTimestamp(safeContent);
  const indicators = extractIndicators(safeContent);

  // Quick summary line
  const firstLine = safeContent.split('\n')[0]?.trim() || '';
  const summary = firstLine.length > 120 ? firstLine.substring(0, 117) + '...' : firstLine;

  return {
    id: params.id || `EVD-${Math.floor(100 + Math.random() * 900)}`,
    sourceType: params.sourceType,
    sourceReference: params.sourceReference || 'Manual Ingestion',
    timestamp,
    timestampConfidence: confidence,
    title: params.title || `Forensic Record ${params.sourceType}`,
    rawContent: safeContent,
    summary: summary || `${params.sourceType} artifact with ${indicators.length} extracted indicators`,
    fileFormat: params.fileFormat || 'text',
    indicators,
    status: 'ingested',
    sizeBytes: new TextEncoder().encode(safeContent).length,
    addedAt: new Date().toISOString()
  };
}
