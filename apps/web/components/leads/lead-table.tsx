import Link from "next/link";
import { TemperatureBadge, WebsiteStatusBadge } from "./lead-badges";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type LeadRow = {
  id: string;
  businessName: string;
  city: string;
  phone: string | null;
  websiteUrl: string | null;
  websiteStatus: string;
  leadScore: number;
  temperature: string;
  commercialStatus: string;
};

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Business</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Website</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>
              <div className="font-medium">{lead.businessName}</div>
              <div className="text-xs text-slate-500">{lead.city}</div>
            </TableCell>
            <TableCell>{lead.phone ?? "No phone"}</TableCell>
            <TableCell>
              <WebsiteStatusBadge status={lead.websiteStatus} />
            </TableCell>
            <TableCell>{lead.leadScore}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <TemperatureBadge temperature={lead.temperature} />
                <span className="text-xs text-slate-400">{lead.commercialStatus}</span>
              </div>
            </TableCell>
            <TableCell>
              <Button size="sm" variant="secondary" asChild>
                <Link href={`/leads/${lead.id}`}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
