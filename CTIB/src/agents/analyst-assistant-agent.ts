import type { QueryResult } from "../types/agent.js";
import type { AnalystAssistantAgent as IAnalystAssistantAgent } from "../types/agent.js";
import type { VectorStore } from "../types/vector-store.js";
import { OpenAIClient } from "../lib/openai-client.js";

export class AnalystAssistantAgent implements IAnalystAssistantAgent {
  name = "Analyst Assistant Agent";
  description = "Handles user queries using RAG (Retrieval-Augmented Generation)";

  private vectorStore: VectorStore;
  private openai: OpenAIClient;

  constructor(vectorStore: VectorStore) {
    this.vectorStore = vectorStore;
    this.openai = new OpenAIClient();
  }

  async query(
    question: string,
    options?: {
      maxResults?: number;
      filters?: {
        severity?: string[];
        products?: string[];
        dateRange?: { start: string; end: string };
      };
    }
  ): Promise<QueryResult> {
    // Generate embedding for the query
    const queryEmbedding = await this.openai.generateEmbedding(question);

    // Search vector store
    const searchResults = await this.vectorStore.search(queryEmbedding, {
      limit: options?.maxResults || 10,
      filters: options?.filters as any,
      minScore: 0.5, // Minimum similarity score
    });

    if (searchResults.length === 0) {
      return {
        answer: "I couldn't find any relevant threat intelligence documents to answer your question. Please try rephrasing or check if data has been ingested.",
        sources: [],
      };
    }

    // Build context from retrieved chunks
    const context = searchResults
      .map((result, index) => {
        const chunk = result.chunk;
        return `[Source ${index + 1}]
ID: ${chunk.documentId}
Title: ${chunk.metadata.title}
Severity: ${chunk.metadata.severity || "Unknown"}
CVSS Score: ${chunk.metadata.cvssScore || "N/A"}
Products: ${chunk.metadata.products?.join(", ") || "Unknown"}
Threat Type: ${chunk.metadata.threatType || "Unknown"}
Content: ${chunk.text}`;
      })
      .join("\n\n");

    // Generate answer using LLM with context
    const answer = await this.openai.chat([
      {
        role: "system",
        content: `You are a cybersecurity threat intelligence analyst assistant. Answer questions based on the provided threat intelligence documents. Be accurate, cite specific CVE IDs and details when relevant, and always ground your answers in the provided context. If the context doesn't contain enough information, say so.`,
      },
      {
        role: "user",
        content: `Question: ${question}\n\nRelevant Threat Intelligence Context:\n${context}\n\nPlease provide a comprehensive answer based on the context above.`,
      },
    ]);

    // Extract unique sources
    const sourceMap = new Map<string, {
      id: string;
      title: string;
      sourceUrl?: string;
      score: number;
    }>();

    for (const result of searchResults) {
      const chunk = result.chunk;
      if (!sourceMap.has(chunk.documentId)) {
        sourceMap.set(chunk.documentId, {
          id: chunk.documentId,
          title: chunk.metadata.title || chunk.documentId,
          sourceUrl: chunk.metadata.sourceUrl,
          score: result.score,
        });
      } else {
        // Update score to highest if this chunk has a better score
        const existing = sourceMap.get(chunk.documentId)!;
        if (result.score > existing.score) {
          existing.score = result.score;
        }
      }
    }

    const sources = Array.from(sourceMap.values()).sort((a, b) => b.score - a.score);

    return {
      answer,
      sources,
    };
  }
}



