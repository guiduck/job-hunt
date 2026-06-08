import { processNextProspectingJob } from "./jobs/process-prospecting-job";

async function main() {
  await processNextProspectingJob();
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "freelance_worker_failed",
      errorMessage: error instanceof Error ? error.message : "Unknown worker error"
    })
  );
  process.exit(1);
});
