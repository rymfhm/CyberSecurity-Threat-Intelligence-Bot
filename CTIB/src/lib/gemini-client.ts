import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: string;
  private embeddingModel: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    this.model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    this.embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
      const result = await model.embedContent(text);
      // The embedding is in result.embedding.values array
      return Array.from(result.embedding.values || []);
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
      const embeddings: number[][] = [];
      
      // Process embeddings sequentially (Gemini API handles batching differently)
      for (const text of texts) {
        const result = await model.embedContent(text);
        embeddings.push(Array.from(result.embedding.values || []));
      }
      
      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw error;
    }
  }

  async chat(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>): Promise<string> {
    try {
      // Combine system and user messages into a single prompt
      // Gemini models handle system context by including it in the prompt
      let systemPrompt = "";
      let userPrompt = "";
      
      for (const msg of messages) {
        if (msg.role === "system") {
          systemPrompt += msg.content + "\n\n";
        } else if (msg.role === "user") {
          userPrompt = msg.content;
        }
      }
      
      const fullPrompt = systemPrompt + userPrompt;
      
      const model = this.genAI.getGenerativeModel({ 
        model: this.model,
      });
      
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("Error in chat completion:", error);
      throw error;
    }
  }
}

