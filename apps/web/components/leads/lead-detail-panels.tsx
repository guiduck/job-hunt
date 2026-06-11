import type { FreelanceLead } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildGoogleMapsSearchUrl,
  getOwnedWebsiteUrl,
  getSocialProfileUrl
} from "@/lib/freelance/url-classification";

export function BusinessInfoPanel({ lead }: { lead: FreelanceLead }) {
  const websiteUrl = getOwnedWebsiteUrl(lead.websiteUrl);
  const socialUrl = lead.socialUrl ?? getSocialProfileUrl(lead.websiteUrl);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business info</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        <p>
          <span className="text-slate-500">Address</span>
          <br />
          {lead.address ?? "Not captured"}
        </p>
        <p>
          <span className="text-slate-500">Contact</span>
          <br />
          {[lead.phone, lead.whatsapp, lead.email].filter(Boolean).join(" / ") || "Not captured"}
        </p>
        <p>
          <span className="text-slate-500">Website</span>
          <br />
          {websiteUrl ? (
            <a className="text-cyan-300" href={websiteUrl} target="_blank" rel="noreferrer">
              {websiteUrl}
            </a>
          ) : (
            "No website"
          )}
        </p>
        <p>
          <span className="text-slate-500">Social</span>
          <br />
          {socialUrl ? (
            <a className="text-cyan-300" href={socialUrl} target="_blank" rel="noreferrer">
              {socialUrl}
            </a>
          ) : (
            "Not captured"
          )}
        </p>
        <p>
          <span className="text-slate-500">Reviews</span>
          <br />
          {lead.googleRating ? `${lead.googleRating} (${lead.googleReviewCount ?? 0})` : "No rating"}
        </p>
      </CardContent>
    </Card>
  );
}

export function SourceEvidencePanel({ lead }: { lead: FreelanceLead }) {
  const mapsUrl =
    lead.sourceUrl ??
    buildGoogleMapsSearchUrl([lead.businessName, lead.address, lead.city, lead.region, lead.country]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Source evidence</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{lead.sourceEvidence}</p>
        <p className="mt-2 text-xs text-slate-500">{lead.sourceQuery}</p>
        <a className="mt-2 block text-xs text-cyan-300" href={mapsUrl} target="_blank" rel="noreferrer">
          Open Google Maps verification
        </a>
      </CardContent>
    </Card>
  );
}
