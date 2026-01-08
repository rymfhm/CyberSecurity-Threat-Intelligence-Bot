import { ChromaClient } from "chromadb";
import type { VectorStore } from "../types/vector-store";
import type { DocumentChunk, SearchResult } from "../types/document";

export class ChromaVectorStore implements VectorStore {
  private client: ChromaClient;
  private collectionName: string;
  private collection: any = null;

  constructor() {
    const url = process.env.CHROMADB_URL;
    this.collectionName = process.env.CHROMADB_COLLECTION_NAME || "threat_intelligence";
    
    // Use in-memory mode if no URL is specified or if URL is explicitly set to empty
    if (!url || url === "" || url === "undefined") {
      console.log("Using ChromaDB in-memory mode (no server URL configured)");
      // Create in-memory client - no path means in-memory
      this.client = new ChromaClient();
    } else {
      this.client = new ChromaClient({ path: url });
    }
  }

  async initialize(): Promise<void> {
    try {
      // Try to get existing collection
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
      });
    } catch (error) {
      // Create new collection if it doesn't exist
      try {
        this.collection = await this.client.createCollection({
          name: this.collectionName,
        });
      } catch (createError) {
        console.error("Error initializing ChromaDB collection:", createError);
        throw createError;
      }
    }
  }

  async addChunk(chunk: DocumentChunk, embedding: number[]): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    const id = `${chunk.documentId}_chunk_${chunk.chunkIndex}`;
    
    await this.collection.add({
      ids: [id],
      embeddings: [embedding],
      documents: [chunk.text],
      metadatas: [{
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex.toString(),
        title: chunk.metadata.title || "",
        sourceType: chunk.metadata.sourceType || "",
        sourceUrl: chunk.metadata.sourceUrl || "",
        publishedDate: chunk.metadata.publishedDate || "",
        severity: chunk.metadata.severity || "",
        cvssScore: chunk.metadata.cvssScore?.toString() || "",
        vendors: JSON.stringify(chunk.metadata.vendors || []),
        products: JSON.stringify(chunk.metadata.products || []),
        tags: JSON.stringify(chunk.metadata.tags || []),
        threatType: chunk.metadata.threatType || "",
      }],
    });
  }

  async addChunks(chunks: Array<{ chunk: DocumentChunk; embedding: number[] }>): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    if (chunks.length === 0) return;

    const ids = chunks.map(({ chunk }) => `${chunk.documentId}_chunk_${chunk.chunkIndex}`);
    const embeddings = chunks.map(({ embedding }) => embedding);
    const documents = chunks.map(({ chunk }) => chunk.text);
    const metadatas = chunks.map(({ chunk }) => ({
      documentId: chunk.documentId,
      chunkIndex: chunk.chunkIndex.toString(),
      title: chunk.metadata.title || "",
      sourceType: chunk.metadata.sourceType || "",
      sourceUrl: chunk.metadata.sourceUrl || "",
      publishedDate: chunk.metadata.publishedDate || "",
      severity: chunk.metadata.severity || "",
      cvssScore: chunk.metadata.cvssScore?.toString() || "",
      vendors: JSON.stringify(chunk.metadata.vendors || []),
      products: JSON.stringify(chunk.metadata.products || []),
      tags: JSON.stringify(chunk.metadata.tags || []),
      threatType: chunk.metadata.threatType || "",
    }));

    await this.collection.add({
      ids,
      embeddings,
      documents,
      metadatas,
    });
  }

  async search(
    queryEmbedding: number[],
    options?: {
      limit?: number;
      filters?: Record<string, any>;
      minScore?: number;
    }
  ): Promise<SearchResult[]> {
    if (!this.collection) {
      await this.initialize();
    }

    const limit = options?.limit || 10;
    const where: Record<string, any> = {};

    // Build filter query if filters provided
    if (options?.filters) {
      if (options.filters.severity) {
        where.severity = { $in: options.filters.severity };
      }
      if (options.filters.products) {
        // Note: ChromaDB string matching on JSON array is limited
        // This is a simplified filter - you might need to adjust based on your needs
        where.products = { $contains: options.filters.products[0] };
      }
    }

    const queryOptions: any = {
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
    };

    if (Object.keys(where).length > 0) {
      queryOptions.where = where;
    }

    const results = await this.collection.query(queryOptions);

    const searchResults: SearchResult[] = [];

    if (results.ids && results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const id = results.ids[0][i];
        const distance = results.distances?.[0]?.[i] ?? 0;
        const metadata = results.metadatas?.[0]?.[i] || {};
        const document = results.documents?.[0]?.[i] || "";

        // Convert distance to similarity score (1 - distance for cosine similarity)
        const score = 1 - distance;

        if (options?.minScore && score < options.minScore) {
          continue;
        }

        // Parse metadata back to proper types
        const chunk: DocumentChunk = {
          id,
          documentId: metadata.documentId || "",
          chunkIndex: parseInt(metadata.chunkIndex || "0"),
          text: document,
          metadata: {
            title: metadata.title || "",
            sourceType: (metadata.sourceType as any) || "CVE",
            sourceUrl: metadata.sourceUrl || undefined,
            publishedDate: metadata.publishedDate || undefined,
            severity: (metadata.severity as any) || undefined,
            cvssScore: metadata.cvssScore ? parseFloat(metadata.cvssScore) : undefined,
            vendors: metadata.vendors ? JSON.parse(metadata.vendors) : undefined,
            products: metadata.products ? JSON.parse(metadata.products) : undefined,
            tags: metadata.tags ? JSON.parse(metadata.tags) : undefined,
            threatType: metadata.threatType || undefined,
          },
        };

        searchResults.push({ chunk, score });
      }
    }

    return searchResults;
  }

  async clear(): Promise<void> {
    try {
      await this.client.deleteCollection({ name: this.collectionName });
    } catch (error) {
      // Collection might not exist, which is fine
      console.warn("Error deleting collection (might not exist):", error);
    }
    this.collection = null;
    await this.initialize();
  }

  async getStats(): Promise<{ count: number }> {
    if (!this.collection) {
      await this.initialize();
    }

    const count = await this.collection.count();
    return { count };
  }
}




