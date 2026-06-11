import { Badge } from "@/components/ui/badge";

export function WebsiteStatusBadge({ status }: { status: string }) {
  const tone = status === "no_site" || status === "weak_site" ? "warning" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function TemperatureBadge({ temperature }: { temperature: string }) {
  const tone = temperature === "hot" ? "danger" : temperature === "warm" ? "warning" : "neutral";
  return <Badge tone={tone}>{temperature}</Badge>;
}
