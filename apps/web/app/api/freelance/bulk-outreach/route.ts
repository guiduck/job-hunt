import { NextResponse } from "next/server";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import {
  bulkOutreachErrorResponse,
  createBulkOutreachBatch
} from "@/lib/freelance/bulk-outreach-service";

export async function POST(request: Request) {
  try {
    const result = await createBulkOutreachBatch(await getCurrentUserScope(), await request.json());
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const response = bulkOutreachErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
