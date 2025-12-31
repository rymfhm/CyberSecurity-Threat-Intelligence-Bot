import OpenAI from "openai";

export class OpenAIClient {
  private client: OpenAI;
  private model: string;
  private embeddingModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: texts,
      });
      return response.data.map((item) => item.embedding);
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw error;
    }
  }

  async chat(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Error in chat completion:", error);
      throw error;
    }
  }
}



