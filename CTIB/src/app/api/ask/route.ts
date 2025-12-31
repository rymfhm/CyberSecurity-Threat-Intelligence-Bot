import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator } from "@/lib/agent-orchestrator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, maxResults, filters } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required and must be a string" },
        { status: 400 }
      );
    }

    const orchestrator = getOrchestrator();
    await orchestrator.initialize();

    const analystAgent = orchestrator.getAnalystAgent();
    const result = await analystAgent.query(question, {
      maxResults: maxResults || 10,
      filters,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error handling query:", error);
    return NextResponse.json(
      {
        error: "Failed to process query",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



