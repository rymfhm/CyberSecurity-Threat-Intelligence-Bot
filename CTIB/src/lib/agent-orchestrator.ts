import { ChromaVectorStore } from "./chroma-store";
import { NVDIngestionAgent } from "../agents/ingestion-agent";
import { LLMEnrichmentAgent } from "../agents/enrichment-agent";
import { VectorIndexingAgent } from "../agents/indexing-agent";
import { AnalystAssistantAgent } from "../agents/analyst-assistant-agent";
import type { VectorStore } from "../types/vector-store";

/**
 * Lightweight orchestrator that manages agent lifecycle and coordination
 */
export class AgentOrchestrator {
  private vectorStore: VectorStore;
  private ingestionAgent: NVDIngestionAgent;
  private enrichmentAgent: LLMEnrichmentAgent;
  private indexingAgent: VectorIndexingAgent;
  private analystAgent: AnalystAssistantAgent;

  constructor() {
    this.vectorStore = new ChromaVectorStore();
    this.ingestionAgent = new NVDIngestionAgent();
    this.enrichmentAgent = new LLMEnrichmentAgent();
    this.indexingAgent = new VectorIndexingAgent(this.vectorStore);
    this.analystAgent = new AnalystAssistantAgent(this.vectorStore);
  }

  async initialize(): Promise<void> {
    await this.vectorStore.initialize();
  }

  getAnalystAgent(): AnalystAssistantAgent {
    return this.analystAgent;
  }

  getVectorStore(): VectorStore {
    return this.vectorStore;
  }

  /**
   * Run the full pipeline: ingest -> enrich -> index
   */
  async runIngestionPipeline(days: number = 30): Promise<{
    ingested: number;
    enriched: number;
    indexed: number;
  }> {
    console.log("Starting ingestion pipeline...");

    // Step 1: Ingest
    console.log("Step 1: Ingesting data...");
    const documents = await this.ingestionAgent.ingest(days);
    console.log(`Ingested ${documents.length} documents`);

    // Step 2: Enrich
    console.log("Step 2: Enriching documents...");
    const enrichedDocuments = await this.enrichmentAgent.enrichBatch(documents);
    console.log(`Enriched ${enrichedDocuments.length} documents`);

    // Step 3: Index
    console.log("Step 3: Indexing documents...");
    await this.indexingAgent.indexBatch(enrichedDocuments);
    console.log(`Indexed ${enrichedDocuments.length} documents`);

    const stats = await this.vectorStore.getStats();
    console.log(`Total chunks in vector store: ${stats.count}`);

    return {
      ingested: documents.length,
      enriched: enrichedDocuments.length,
      indexed: enrichedDocuments.length,
    };
  }

  /**
   * Clear and reindex all data
   */
  async reindex(days: number = 30): Promise<void> {
    console.log("Clearing existing index...");
    await this.vectorStore.clear();
    await this.runIngestionPipeline(days);
  }
}

// Singleton instance
let orchestratorInstance: AgentOrchestrator | null = null;

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}




