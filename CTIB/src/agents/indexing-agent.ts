import type { EnrichedThreatDocument } from "../types/document.js";
import type { IndexingAgent } from "../types/agent.js";
import type { VectorStore } from "../types/vector-store.js";
import { TextChunker } from "../lib/text-chunker.js";
import { OpenAIClient } from "../lib/openai-client.js";

export class VectorIndexingAgent implements IndexingAgent {
  name = "Vector Indexing Agent";
  description = "Chunks documents and indexes them in the vector store";

  private vectorStore: VectorStore;
  private chunker: TextChunker;
  private openai: OpenAIClient;

  constructor(vectorStore: VectorStore) {
    this.vectorStore = vectorStore;
    this.chunker = new TextChunker({ chunkSize: 1000, chunkOverlap: 200 });
    this.openai = new OpenAIClient();
  }

  async index(document: EnrichedThreatDocument): Promise<void> {
    const chunks = this.chunker.chunk(document);
    
    if (chunks.length === 0) {
      console.warn(`No chunks created for document ${document.id}`);
      return;
    }

    // Generate embeddings for all chunks
    const texts = chunks.map((chunk) => chunk.text);
    const embeddings = await this.openai.generateEmbeddings(texts);

    // Prepare chunks with embeddings
    const chunksWithEmbeddings = chunks.map((chunk, index) => ({
      chunk,
      embedding: embeddings[index],
    }));

    // Add to vector store
    await this.vectorStore.addChunks(chunksWithEmbeddings);
    
    console.log(`Indexed document ${document.id} (${chunks.length} chunks)`);
  }

  async indexBatch(documents: EnrichedThreatDocument[]): Promise<void> {
    console.log(`Indexing ${documents.length} documents...`);
    
    // Process in smaller batches to manage memory
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const batchPromises = batch.map((doc) => this.index(doc));
      await Promise.all(batchPromises);
      
      console.log(`Indexed ${Math.min(i + batchSize, documents.length)}/${documents.length} documents`);
    }
    
    console.log("Indexing complete");
  }
}



