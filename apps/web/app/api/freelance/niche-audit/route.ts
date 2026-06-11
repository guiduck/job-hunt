import { NextResponse } from "next/server";
import { runCatalogAudit } from "@/lib/freelance/niche-audit-service";
import { nicheAuditQuerySchema } from "@/lib/validation/niche-catalog";

export async function GET(request: Request) {
  const query = nicheAuditQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const report = await runCatalogAudit({ persist: query.fresh });
  return NextResponse.json(report);
}

