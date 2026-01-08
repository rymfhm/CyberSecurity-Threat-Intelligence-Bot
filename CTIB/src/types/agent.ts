import type { ThreatDocument, EnrichedThreatDocument } from "./document";

export interface Agent {
  name: string;
  description: string;
}

export interface IngestionAgent extends Agent {
  ingest(): Promise<ThreatDocument[]>;
}

export interface EnrichmentAgent extends Agent {
  enrich(document: ThreatDocument): Promise<EnrichedThreatDocument>;
  enrichBatch(documents: ThreatDocument[]): Promise<EnrichedThreatDocument[]>;
}

export interface IndexingAgent extends Agent {
  index(document: EnrichedThreatDocument): Promise<void>;
  indexBatch(documents: EnrichedThreatDocument[]): Promise<void>;
}

export interface QueryResult {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    sourceUrl?: string;
    score: number;
  }>;
}

export interface AnalystAssistantAgent extends Agent {
  query(question: string, options?: {
    maxResults?: number;
    filters?: {
      severity?: string[];
      products?: string[];
      dateRange?: { start: string; end: string };
    };
  }): Promise<QueryResult>;
}




