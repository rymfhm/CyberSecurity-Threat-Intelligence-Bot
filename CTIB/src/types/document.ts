export type SourceType = "CVE" | "vendor_advisory" | "forum_post" | "blog_article";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ThreatDocument {
  id: string; // e.g., CVE-2025-12345 or some generated ID
  title: string;
  sourceType: SourceType;
  sourceUrl?: string;
  publishedDate?: string; // ISO
  severity?: Severity;
  cvssScore?: number;
  vendors?: string[];
  products?: string[];
  cwe?: string;
  rawText: string;
  tags?: string[];
  threatType?: string; // e.g., "RCE", "Privilege Escalation"
  ingestedAt: string; // ISO
}

export interface EnrichedThreatDocument extends ThreatDocument {
  tags: string[];
  threatType: string;
  inferredProducts?: string[];
  summary?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  metadata: {
    title: string;
    sourceType: SourceType;
    sourceUrl?: string;
    publishedDate?: string;
    severity?: Severity;
    cvssScore?: number;
    vendors?: string[];
    products?: string[];
    tags?: string[];
    threatType?: string;
  };
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}



