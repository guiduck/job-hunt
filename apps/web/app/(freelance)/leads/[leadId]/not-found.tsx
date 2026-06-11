import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadNotFound() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Lead not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>The selected lead is unavailable or outside the current internal workspace.</p>
          <Button asChild>
            <Link href="/leads">Back to leads</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
