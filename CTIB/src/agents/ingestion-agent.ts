import axios from "axios";
import type { ThreatDocument } from "../types/document";
import type { IngestionAgent } from "../types/agent";

interface NVDCveItem {
  id: string;
  sourceIdentifier: string;
  published: string;
  lastModified: string;
  vulnStatus: string;
  descriptions: Array<{ lang: string; value: string }>;
  metrics?: {
    cvssMetricV31?: Array<{
      cvssData: {
        baseScore: number;
        baseSeverity: string;
      };
    }>;
    cvssMetricV30?: Array<{
      cvssData: {
        baseScore: number;
        baseSeverity: string;
      };
    }>;
    cvssMetricV2?: Array<{
      cvssData: {
        baseScore: number;
      };
    }>;
  };
  weaknesses?: Array<{
    description: Array<{ lang: string; value: string }>;
  }>;
  references?: Array<{ url: string }>;
  configurations?: Array<{
    nodes: Array<{
      cpeMatch: Array<{
        criteria: string;
        matchCriteriaId: string;
      }>;
    }>;
  }>;
}

interface NVDResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  format: string;
  version: string;
  timestamp: string;
  vulnerabilities: Array<{
    cve: NVDCveItem;
  }>;
}

export class NVDIngestionAgent implements IngestionAgent {
  name = "NVD Ingestion Agent";
  description = "Fetches CVE data from the NVD (National Vulnerability Database)";

  private baseUrl = "https://services.nvd.nist.gov/rest/json/cves/2.0";
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.NVD_API_KEY;
  }

  /**
   * Ingest CVE data from NVD for the last N days
   */
  async ingest(days: number = 30): Promise<ThreatDocument[]> {
    const documents: ThreatDocument[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    console.log(`Fetching CVEs from ${startDateStr} to ${endDateStr}`);

    let startIndex = 0;
    const resultsPerPage = 2000;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${this.baseUrl}?pubStartDate=${startDateStr}T00:00:00.000&pubEndDate=${endDateStr}T23:59:59.999&startIndex=${startIndex}&resultsPerPage=${resultsPerPage}`;
        
        const headers: Record<string, string> = {};
        if (this.apiKey) {
          headers["apiKey"] = this.apiKey;
        }

        const response = await axios.get<NVDResponse>(url, {
          headers,
          timeout: 30000,
        });

        const data = response.data;

        for (const vuln of data.vulnerabilities) {
          const cve = vuln.cve;
          const document = this.convertCveToDocument(cve);
          documents.push(document);
        }

        console.log(`Fetched ${documents.length} CVEs so far...`);

        if (data.vulnerabilities.length < resultsPerPage) {
          hasMore = false;
        } else {
          startIndex += resultsPerPage;
          // Rate limiting: NVD API has rate limits
          await this.delay(6000); // 6 second delay between requests
        }
      } catch (error) {
        console.error("Error fetching from NVD:", error);
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          console.warn("Rate limited by NVD API. Please add NVD_API_KEY to .env for higher rate limits.");
          await this.delay(30000); // Wait 30 seconds if rate limited
        } else {
          throw error;
        }
      }
    }

    console.log(`Ingested ${documents.length} CVE documents`);
    return documents;
  }

  private convertCveToDocument(cve: NVDCveItem): ThreatDocument {
    // Get description (prefer English)
    const description = cve.descriptions.find((d) => d.lang === "en")?.value || 
                       cve.descriptions[0]?.value || 
                       "No description available";

    // Extract CVSS score and severity
    let cvssScore: number | undefined;
    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;

    if (cve.metrics?.cvssMetricV31?.[0]) {
      const metric = cve.metrics.cvssMetricV31[0];
      cvssScore = metric.cvssData.baseScore;
      severity = this.mapSeverity(metric.cvssData.baseSeverity);
    } else if (cve.metrics?.cvssMetricV30?.[0]) {
      const metric = cve.metrics.cvssMetricV30[0];
      cvssScore = metric.cvssData.baseScore;
      severity = this.mapSeverity(metric.cvssData.baseSeverity);
    } else if (cve.metrics?.cvssMetricV2?.[0]) {
      cvssScore = cve.metrics.cvssMetricV2[0].cvssData.baseScore;
      severity = cvssScore >= 7.0 ? "HIGH" : cvssScore >= 4.0 ? "MEDIUM" : "LOW";
    }

    // Extract CWE
    const cwe = cve.weaknesses?.[0]?.description?.find((d) => d.lang === "en")?.value;
    const cweMatch = cwe?.match(/CWE-\d+/);
    const cweId = cweMatch ? cweMatch[0] : undefined;

    // Extract vendors and products from configurations
    const vendors = new Set<string>();
    const products = new Set<string>();

    if (cve.configurations) {
      for (const config of cve.configurations) {
        for (const node of config.nodes) {
          for (const cpeMatch of node.cpeMatch) {
            const cpe = cpeMatch.criteria;
            // CPE format: cpe:2.3:a:vendor:product:version:...
            const parts = cpe.split(":");
            if (parts.length >= 5) {
              if (parts[3]) vendors.add(parts[3]);
              if (parts[4]) products.add(parts[4]);
            }
          }
        }
      }
    }

    // Get reference URL
    const sourceUrl = cve.references?.[0]?.url || 
                     `https://nvd.nist.gov/vuln/detail/${cve.id}`;

    return {
      id: cve.id,
      title: `${cve.id}: ${description.substring(0, 100)}...`,
      sourceType: "CVE",
      sourceUrl,
      publishedDate: cve.published,
      severity,
      cvssScore,
      vendors: Array.from(vendors).slice(0, 10), // Limit to 10 vendors
      products: Array.from(products).slice(0, 20), // Limit to 20 products
      cwe: cweId,
      rawText: description,
      ingestedAt: new Date().toISOString(),
    };
  }

  private mapSeverity(baseSeverity: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    switch (baseSeverity.toUpperCase()) {
      case "CRITICAL":
        return "CRITICAL";
      case "HIGH":
        return "HIGH";
      case "MEDIUM":
        return "MEDIUM";
      case "LOW":
        return "LOW";
      default:
        return "MEDIUM";
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}




