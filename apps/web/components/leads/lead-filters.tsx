import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { commercialStatuses, leadTemperatures, websiteStatuses } from "@/lib/freelance/constants";

export function LeadFilters({
  defaults
}: {
  defaults: Record<string, string | undefined>;
}) {
  return (
    <form className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_120px]">
      <label className="text-xs font-medium text-slate-400">
        Search
        <Input name="q" defaultValue={defaults.q} placeholder="Business, niche, city" />
      </label>
      <label className="text-xs font-medium text-slate-400">
        Website
        <Select name="websiteStatus" defaultValue={defaults.websiteStatus ?? ""}>
          <option value="">Any</option>
          {websiteStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </label>
      <label className="text-xs font-medium text-slate-400">
        Status
        <Select name="commercialStatus" defaultValue={defaults.commercialStatus ?? ""}>
          <option value="">Any</option>
          {commercialStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </label>
      <label className="text-xs font-medium text-slate-400">
        Temperature
        <Select name="temperature" defaultValue={defaults.temperature ?? ""}>
          <option value="">Any</option>
          {leadTemperatures.map((temperature) => (
            <option key={temperature} value={temperature}>
              {temperature}
            </option>
          ))}
        </Select>
      </label>
      <Button className="self-end" type="submit">
        <Search className="h-4 w-4" aria-hidden="true" />
        Filter
      </Button>
    </form>
  );
}
