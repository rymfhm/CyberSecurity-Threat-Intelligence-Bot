import type { ThreatDocument, EnrichedThreatDocument } from "../types/document.js";
import type { EnrichmentAgent } from "../types/agent.js";
import { OpenAIClient } from "../lib/openai-client.js";

export class LLMEnrichmentAgent implements EnrichmentAgent {
  name = "LLM Enrichment Agent";
  description = "Enriches threat documents using LLM to add tags, threat types, and inferred products";

  private openai: OpenAIClient;

  constructor() {
    this.openai = new OpenAIClient();
  }

  async enrich(document: ThreatDocument): Promise<EnrichedThreatDocument> {
    const prompt = this.buildEnrichmentPrompt(document);
    
    try {
      const response = await this.openai.chat([
        {
          role: "system",
          content: "You are a cybersecurity expert that analyzes threat intelligence documents. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ]);

      const enrichment = this.parseEnrichmentResponse(response);
      
      return {
        ...document,
        tags: enrichment.tags || [],
        threatType: enrichment.threatType || "Unknown",
        inferredProducts: enrichment.inferredProducts || [],
        summary: enrichment.summary,
      };
    } catch (error) {
      console.error(`Error enriching document ${document.id}:`, error);
      // Return document with minimal enrichment on error
      return {
        ...document,
        tags: [],
        threatType: "Unknown",
        inferredProducts: [],
      };
    }
  }

  async enrichBatch(documents: ThreatDocument[]): Promise<EnrichedThreatDocument[]> {
    const enriched: EnrichedThreatDocument[] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const batchPromises = batch.map((doc) => this.enrich(doc));
      const batchResults = await Promise.all(batchPromises);
      enriched.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < documents.length) {
        await this.delay(1000);
      }
    }
    
    return enriched;
  }

  private buildEnrichmentPrompt(document: ThreatDocument): string {
    return `Analyze the following cybersecurity threat document and provide enrichment information in JSON format.

Document ID: ${document.id}
Title: ${document.title}
Description: ${document.rawText.substring(0, 2000)}
CWE: ${document.cwe || "Not specified"}
CVSS Score: ${document.cvssScore || "Not specified"}
Severity: ${document.severity || "Not specified"}
Existing Products: ${document.products?.join(", ") || "None"}

Provide a JSON response with the following structure:
{
  "tags": ["tag1", "tag2", ...],  // Array of relevant tags like "rce", "privilege_escalation", "sql_injection", "xss", "dos", "authentication_bypass", etc.
  "threatType": "RCE" | "Privilege Escalation" | "SQL Injection" | "XSS" | "DoS" | "Information Disclosure" | "Authentication Bypass" | "Code Execution" | "Path Traversal" | "Other",
  "inferredProducts": ["product1", "product2", ...],  // Additional products/software that might be affected (beyond what's already listed)
  "summary": "Brief 1-2 sentence summary of the vulnerability"
}

Only respond with valid JSON, no additional text.`;
  }

  private parseEnrichmentResponse(response: string): {
    tags?: string[];
    threatType?: string;
    inferredProducts?: string[];
    summary?: string;
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          threatType: parsed.threatType || "Unknown",
          inferredProducts: Array.isArray(parsed.inferredProducts) ? parsed.inferredProducts : [],
          summary: parsed.summary,
        };
      }
    } catch (error) {
      console.error("Error parsing enrichment response:", error);
    }

    return {
      tags: [],
      threatType: "Unknown",
      inferredProducts: [],
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}



