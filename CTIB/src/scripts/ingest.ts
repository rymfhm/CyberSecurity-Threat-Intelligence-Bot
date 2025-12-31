import { getOrchestrator } from "../lib/agent-orchestrator.js";

async function main() {
  console.log("Starting ingestion pipeline...\n");

  try {
    const orchestrator = getOrchestrator();
    await orchestrator.initialize();

    // Get days from command line argument or default to 30
    const days = process.argv[2] ? parseInt(process.argv[2], 10) : 30;
    
    if (isNaN(days) || days <= 0) {
      console.error("Invalid days argument. Please provide a positive number.");
      process.exit(1);
    }

    console.log(`Fetching CVEs from the last ${days} days...\n`);

    const result = await orchestrator.runIngestionPipeline(days);

    console.log("\n✅ Ingestion pipeline completed successfully!");
    console.log(`   - Ingested: ${result.ingested} documents`);
    console.log(`   - Enriched: ${result.enriched} documents`);
    console.log(`   - Indexed: ${result.indexed} documents`);
  } catch (error) {
    console.error("\n❌ Ingestion pipeline failed:", error);
    process.exit(1);
  }
}

main();



