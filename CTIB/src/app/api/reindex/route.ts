import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator } from "@/lib/agent-orchestrator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const days = body.days || 30;

    // Run reindexing in the background (fire and forget for now)
    // In production, you might want to use a job queue
    const orchestrator = getOrchestrator();
    await orchestrator.initialize();

    // Start reindexing asynchronously
    orchestrator.reindex(days).catch((error) => {
      console.error("Reindexing failed:", error);
    });

    return NextResponse.json({
      message: "Reindexing started",
      days,
      status: "processing",
    });
  } catch (error) {
    console.error("Error starting reindex:", error);
    return NextResponse.json(
      {
        error: "Failed to start reindexing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}




