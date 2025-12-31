import type { DocumentChunk, SearchResult } from "./document.js";

export interface VectorStore {
  /**
   * Initialize the vector store (create collection, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Add a single chunk to the vector store
   */
  addChunk(chunk: DocumentChunk, embedding: number[]): Promise<void>;

  /**
   * Add multiple chunks to the vector store
   */
  addChunks(chunks: Array<{ chunk: DocumentChunk; embedding: number[] }>): Promise<void>;

  /**
   * Search for similar chunks
   */
  search(
    queryEmbedding: number[],
    options?: {
      limit?: number;
      filters?: Record<string, any>;
      minScore?: number;
    }
  ): Promise<SearchResult[]>;

  /**
   * Delete all data (useful for reindexing)
   */
  clear(): Promise<void>;

  /**
   * Get stats about the vector store
   */
  getStats(): Promise<{ count: number }>;
}



