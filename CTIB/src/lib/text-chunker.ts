import type { EnrichedThreatDocument, DocumentChunk } from "../types/document";

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export class TextChunker {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(options: ChunkOptions = {}) {
    this.chunkSize = options.chunkSize || 1000;
    this.chunkOverlap = options.chunkOverlap || 200;
  }

  chunk(document: EnrichedThreatDocument): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const text = document.rawText;
    const textLength = text.length;

    if (textLength <= this.chunkSize) {
      // Document is small enough to be a single chunk
      chunks.push(this.createChunk(document, text, 0));
      return chunks;
    }

    let start = 0;
    let chunkIndex = 0;

    while (start < textLength) {
      const end = Math.min(start + this.chunkSize, textLength);
      let chunkText = text.slice(start, end);

      // Try to break at sentence boundaries for better chunking
      if (end < textLength) {
        const lastPeriod = chunkText.lastIndexOf(".");
        const lastNewline = chunkText.lastIndexOf("\n");
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > this.chunkSize * 0.5) {
          chunkText = chunkText.slice(0, breakPoint + 1);
        }
      }

      chunks.push(this.createChunk(document, chunkText, chunkIndex));

      // Move start position with overlap
      start = start + chunkText.length - this.chunkOverlap;
      chunkIndex++;
    }

    return chunks;
  }

  private createChunk(
    document: EnrichedThreatDocument,
    text: string,
    chunkIndex: number
  ): DocumentChunk {
    return {
      id: `${document.id}_chunk_${chunkIndex}`,
      documentId: document.id,
      chunkIndex,
      text: text.trim(),
      metadata: {
        title: document.title,
        sourceType: document.sourceType,
        sourceUrl: document.sourceUrl,
        publishedDate: document.publishedDate,
        severity: document.severity,
        cvssScore: document.cvssScore,
        vendors: document.vendors,
        products: document.products || document.inferredProducts,
        tags: document.tags,
        threatType: document.threatType,
      },
    };
  }
}




