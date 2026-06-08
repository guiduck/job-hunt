import { createFreelanceMapsProvider } from "@/lib/providers/provider-factory";

export async function processNextProspectingJob() {
  const provider = createFreelanceMapsProvider();
  console.log(
    JSON.stringify({
      event: "freelance_worker_idle",
      providerName: provider.name
    })
  );
  return { processed: false, providerName: provider.name };
}
