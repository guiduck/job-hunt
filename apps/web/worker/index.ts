import { loadLocalEnv } from "../scripts/env";

loadLocalEnv();

const pollIntervalMs = Number(process.env.FREELANCE_WORKER_POLL_INTERVAL_MS ?? 5000);
const runOnce = process.env.FREELANCE_WORKER_RUN_ONCE === "1";

async function main() {
  const { processNextProspectingJob } = await import("./jobs/process-prospecting-job");

  do {
    await processNextProspectingJob();
    if (runOnce) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  } while (true);
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
