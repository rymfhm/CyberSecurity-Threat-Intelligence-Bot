import { NextResponse } from "next/server";
import { getOrchestrator } from "@/lib/agent-orchestrator";

export async function GET() {
  try {
    const orchestrator = getOrchestrator();
    await orchestrator.initialize();
    const stats = await orchestrator.getVectorStore().getStats();

    return NextResponse.json({
      status: "healthy",
      vectorStore: {
        chunkCount: stats.count,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



