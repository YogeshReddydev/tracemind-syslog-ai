/**
 * Synthetic Sample Forensics Dataset: "Operation Glass Lantern"
 * Defensive cybersecurity demonstration records using RFC 5737 test IP blocks and example domains
 */

import { Investigation, EvidenceItem } from '../types';
import { createEvidenceItem } from './normalization';
import { executeRuleEngineAnalysis } from './ruleEngine';

export function createOperationGlassLanternEvidence(): EvidenceItem[] {
  return [
    createEvidenceItem({
      id: 'EVD-101',
      sourceType: 'email',
      sourceReference: 'Exchange-MessageTracking-Logs/SRV-MAIL-01',
      title: 'Inbound Suspicious Email with Dual-Extension Attachment',
      rawContent: `Timestamp: 2026-10-08T18:32:00Z
Sender: hr-benefits@internal-portal-notice.com
Recipient: elena.rostova@acme-defense.internal
Subject: Urgent: Updated 401(k) Policy Agreement
Message-ID: <20261008183200.4192.msg@internal-portal-notice.com>
SPF: SoftFail (domain internal-portal-notice.com does not match sender IP 203.0.113.72)
DKIM: None
Attachment: Benefits_Summary_2026.pdf.exe
Attachment-Size: 1,482,110 bytes
Attachment-SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
Content-Type: multipart/mixed; boundary="frontier"
Body: "Dear Elena, Please review and acknowledge the updated 2026 retirement contribution terms in the attached PDF by Friday 5 PM."`,
      fileFormat: 'text'
    }),

    createEvidenceItem({
      id: 'EVD-102',
      sourceType: 'auth_log',
      sourceReference: 'Okta-IDP-AuditLog-Partition-West',
      title: 'Baseline Standard Daytime SSO Login (Elena Rostova)',
      rawContent: `Timestamp: 2026-10-08T08:14:22Z
Event: user.session.start
Actor: elena.rostova@acme-defense.internal
Client-IP: 192.0.2.45
Geolocation: Austin, TX, US (Corporate HQ Subnet)
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0
Auth-Factor: Okta Verify Push (MFA Succeeded)
Outcome: SUCCESS
Session-ID: sess_98124ab87cd10`,
      fileFormat: 'text'
    }),

    createEvidenceItem({
      id: 'EVD-103',
      sourceType: 'auth_log',
      sourceReference: 'Okta-IDP-AuditLog-Partition-West',
      title: 'Anomalous Off-Hours External Authentication (Elena Rostova)',
      rawContent: `Timestamp: 2026-10-09T02:41:10Z
Event: user.session.start
Actor: elena.rostova@acme-defense.internal
Client-IP: 198.51.100.89
Geolocation: Bucharest, RO (Unusual ASN / VPN Gateway)
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Auth-Factor: Single-Factor Password (Legacy Protocol Bypass)
Outcome: SUCCESS
Anomaly-Flags: [OFF_HOURS_DIVERGENCE, UNFAMILIAR_COUNTRY, LEGACY_AUTH_ENDPOINT]
Session-ID: sess_33100fc921a88`,
      fileFormat: 'text'
    }),

    createEvidenceItem({
      id: 'EVD-104',
      sourceType: 'endpoint_edr',
      sourceReference: 'CrowdStrike-Falcon-Host-WS-SEC-4091',
      title: 'EDR Alert: Encoded PowerShell Process Spawned by Word/Explorer',
      rawContent: `Timestamp: 2026-10-09T02:45:18Z
Agent-ID: ag_4091_win11
Endpoint-Hostname: WS-SEC-4091
Assigned-User: ACME\\elena.rostova
Severity: CRITICAL
Detection: SuspiciousScriptInterpreterExecution
Parent-Process: explorer.exe (PID 4112)
CommandLine: powershell.exe -nop -w hidden -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAEkATwAuAE0AZQBtAG8AcgB5AFMAdAByAGUAYQBt...
Process-Hash-SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
Child-Sockets: Established connection target 198.51.100.89:443
Remediation-Status: Queued for analyst approval`,
      fileFormat: 'text'
    }),

    createEvidenceItem({
      id: 'EVD-105',
      sourceType: 'firewall',
      sourceReference: 'PaloAlto-Edge-GW01-TrafficLogs',
      title: 'Firewall Policy Drop / Connection Reset (198.51.100.89)',
      rawContent: `Timestamp: 2026-10-09T02:46:00Z
Device: PA-5220-EDGE-GW01
Rule-Matched: BLOCK_SUSPICIOUS_THREAT_INTEL_EGRESS
Source-IP: 192.0.2.45
Source-Port: 49812
Dest-IP: 198.51.100.89
Dest-Port: 443
Protocol: TCP
Action: RESET-SERVER (TCP RST)
Bytes-Transferred: 840
Session-End-Reason: threat-prevention-signature-drop
Note: Discrepancy observed - edge firewall claims session was severed, but endpoint agent recorded persistent stream at 02:48:02Z. Check sensor clock skew (+2m12s NTP drift).`,
      fileFormat: 'text'
    }),

    createEvidenceItem({
      id: 'EVD-106',
      sourceType: 'network_dns',
      sourceReference: 'Infoblox-Recursive-DNS-Austin-Cluster',
      title: 'Recursive DNS Query for Dynamic C2 Staging Domain',
      rawContent: `Timestamp: 2026-10-09T02:48:02Z
Resolver-IP: 192.0.2.2
Client-Source-IP: 192.0.2.45 (WS-SEC-4091)
Query-Name: c2-relay.lantern-mesh.org
Query-Type: A
Response-Code: NOERROR
Answers: [198.51.100.89, 203.0.113.114]
TTL: 60 seconds
Threat-Intel-Score: 91/100 (Domain newly registered 11 days ago via privacy proxy)`,
      fileFormat: 'text'
    }),

    createEvidenceItem({
      id: 'EVD-107',
      sourceType: 'syslog',
      sourceReference: 'Linux-Syslog-Storage-Agent-01',
      title: 'Scheduled Enterprise Backup Synchronization (Benign Event)',
      rawContent: `Timestamp: 2026-10-09T03:00:00Z
Hostname: WS-SEC-4091
Service: backblaze-agent[8814]
Message: Scheduled Nightly Volume Backup initiated under service account svc-backup-agent.
Target: backup.corporate-storage.internal:443
Data-Volume-Transferred: 4,210,882,900 bytes (4.2 GB)
Encryption: AES-256-GCM (Mutual TLS with Enterprise Root CA)
Status: COMPLETED_SUCCESSFULLY in 14.2 minutes
Integrity-Checksum: verified_nominal`,
      fileFormat: 'text'
    })
  ];
}

/**
 * Builds the initial Operation Glass Lantern investigation
 */
export function createOperationGlassLanternInvestigation(): Investigation {
  const evidence = createOperationGlassLanternEvidence();
  const ruleResult = executeRuleEngineAnalysis(evidence);

  return {
    id: 'INV-2026-0042',
    name: 'Operation Glass Lantern',
    caseNumber: 'SEC-2026-GL-891',
    leadAnalyst: 'Marcus Vance, Principal Incident Responder',
    status: 'active',
    createdAt: '2026-10-09T03:15:00Z',
    updatedAt: new Date().toISOString(),
    summary: 'Multi-stage intrusion investigation involving credential misuse, spearphishing delivery of an encoded PowerShell stager, and high-frequency C2 domain resolution from workstation WS-SEC-4091.',
    evidence,
    timeline: ruleResult.timeline,
    nodes: ruleResult.nodes,
    edges: ruleResult.edges,
    findings: ruleResult.findings,
    notes: 'Primary objective: Validate whether C2 channel achieved persistence before endpoint containment was applied. Resolve firewall vs EDR sensor timestamp contradiction.',
    lastAnalysisMode: 'demo_rule_engine',
    isSampleInvestigation: true
  };
}

export const DIGITALOCEAN_OPENSOURCE_REFERENCE_DOC = `---
title: Open-Source Software
description: DigitalOcean's open source projects on GitHub, including API client libraries, Prometheus exporters, and infrastructure tooling.
product: Reference
url: https://docs.digitalocean.com/reference/opensource/
last_updated: "2026-09-03"
---

# Open-Source Software

We use and contribute to open source software. Here are some things we've worked on:

| Project | Description |
|---|---|
| bind_exporter | Prometheus exporter for BIND. |
| captainslog | A syslog protocol tool. |
| ceph_exporter | Prometheus exporter that scrapes meta information about a Ceph cluster. |
| doctl | Control your DigitalOcean resources from the command-line. |
| dots | Official TypeScript client for DigitalOcean API v2. |
| Droplet Kit | Ruby library for DigitalOcean API v2.0 (deprecated). |
| go-libvirt | Go client to communicate with libvirt using its RPC protocol. |
| go-netbox | Go API client for DigitalOcean's NetBox IPAM and DCIM service. |
| go-qemu | Go packages for interacting with QEMU instances using QEMU Machine Protocol. |
| godo | Official Go client library for DigitalOcean API v2.0. |
| logtalez | Library and command-line client for retrieving log streams from rsyslog. |
| NetBox | IPAM and DCIM tool. |
| pydo | Official Python client library to interact with and manage DigitalOcean resources. |`;

export function createOperationCobaltRavenEvidence(): EvidenceItem[] {
  return [
    createEvidenceItem({
      id: 'EVD-201',
      sourceType: 'auth_log',
      sourceReference: 'DigitalOcean-Cloud-Audit-Gateway/NYC3',
      title: 'Anomalous doctl CLI Execution via Compromised API Token',
      rawContent: `Timestamp: 2026-10-09T04:14:22Z
Event: api.v2.request
Actor: devops-service-token (dop_v1_8819afb201f)
Client-IP: 198.51.100.144
User-Agent: doctl/1.120.0-linux-amd64
Action: compute.droplets.list
Resource-Target: project_prj_9941
Outcome: 200_OK
Geo-Location: Bucharest, RO (Unusual ASN / External Datacenter)
Anomaly: Token invoked from outside authorized corporate IP whitelist 192.0.2.0/24`,
      fileFormat: 'text'
    }),

    createEvidenceItem({
      id: 'EVD-202',
      sourceType: 'endpoint_edr',
      sourceReference: 'DigitalOcean-Droplet-Host-prod-api-01',
      title: 'Automated Python (pydo) Script Enumerating VPC and Storage',
      rawContent: `Timestamp: 2026-10-09T04:16:05Z
Host: prod-api-01
PID: 9144
Process: python3 -m pydo_recon
CommandLine: python3 -c "import pydo; client = pydo.Client(token='dop_v1_8819afb201f'); print(client.droplets.list())"
Action: Memory dump and private VPC subnet IP scan
Threat-Detection: CredentialTheftAutomatedReconnaissance
Severity: HIGH`,
      fileFormat: 'text'
    }),

    createEvidenceItem({
      id: 'EVD-203',
      sourceType: 'syslog',
      sourceReference: 'rsyslog-captainslog-streamer-02',
      title: 'Syslog Stream (captainslog / logtalez): Snapshot Deletion Call',
      rawContent: `Timestamp: 2026-10-09T04:18:30Z
Service: captainslog[4190]
Message: DigitalOcean API audit stream via logtalez. Action: compute.snapshots.delete snapshot_id=98124 requested by dop_v1_8819afb201f. Status: SUCCESS. Volume snapshot destroyed.`,
      fileFormat: 'text'
    }),

    createEvidenceItem({
      id: 'EVD-204',
      sourceType: 'firewall',
      sourceReference: 'DigitalOcean-VPC-Cloud-Firewall-NYC3',
      title: 'VPC Edge Firewall Drop / Policy Discrepancy (198.51.100.144)',
      rawContent: `Timestamp: 2026-10-09T04:12:00Z
Device: DO-VPC-EDGE-FW01
Rule: DROP_UNAUTHORIZED_EXTERNAL_CIDR
Source-IP: 198.51.100.144
Dest-IP: 192.0.2.10
Dest-Port: 443
Action: TCP-DROP
Note: Discrepancy observed - edge firewall claims session dropped at 04:12 UTC, but API gateway recorded token acceptance at 04:14 UTC via public REST edge.`,
      fileFormat: 'text'
    }),

    createEvidenceItem({
      id: 'EVD-205',
      sourceType: 'incident_report',
      sourceReference: 'DigitalOcean-OpenSource-Catalog-Reference',
      title: 'DigitalOcean Open-Source Tooling Inventory Reference',
      rawContent: DIGITALOCEAN_OPENSOURCE_REFERENCE_DOC,
      fileFormat: 'text'
    })
  ];
}

export function createOperationCobaltRavenInvestigation(): Investigation {
  const evidence = createOperationCobaltRavenEvidence();
  const ruleResult = executeRuleEngineAnalysis(evidence);

  return {
    id: 'INV-2026-0039',
    name: 'Operation Cobalt Raven',
    caseNumber: 'SEC-2026-CR-402',
    leadAnalyst: 'Sarah Chen, Senior Threat Hunter',
    status: 'active',
    createdAt: '2026-10-07T14:20:00Z',
    updatedAt: new Date().toISOString(),
    summary: 'Cloud control-plane intrusion involving leaked DigitalOcean Personal Access Token, automated doctl / pydo discovery, snapshot destruction, and VPC telemetry inconsistencies.',
    evidence,
    timeline: ruleResult.timeline,
    nodes: ruleResult.nodes,
    edges: ruleResult.edges,
    findings: ruleResult.findings,
    notes: 'Investigating token leak vector (suspected public git commit). Cross-referencing authorized open-source tooling against doctl user-agent audit.',
    lastAnalysisMode: 'demo_rule_engine',
    isSampleInvestigation: true
  };
}

/**
 * Realistic recent investigations list for the dashboard
 */
export function getSampleInvestigationsList(): Investigation[] {
  const glassLantern = createOperationGlassLanternInvestigation();
  const cobaltRaven = createOperationCobaltRavenInvestigation();

  const ransomPrep: Investigation = {
    id: 'INV-2026-0031',
    name: 'Ransomware Pre-Stage Assessment',
    caseNumber: 'SEC-2026-RP-119',
    leadAnalyst: 'David Okafor, Forensics Lead',
    status: 'closed',
    createdAt: '2026-10-02T09:00:00Z',
    updatedAt: '2026-10-05T17:30:00Z',
    summary: 'Containment and post-mortem analysis of vssadmin shadow copy deletion attempts intercepted on finance file server.',
    evidence: [],
    timeline: [],
    nodes: [],
    edges: [],
    findings: [],
    notes: 'Volume shadow copies preserved. Host re-imaged and restored.',
    lastAnalysisMode: 'demo_rule_engine',
    isSampleInvestigation: true
  };

  return [glassLantern, cobaltRaven, ransomPrep];
}
