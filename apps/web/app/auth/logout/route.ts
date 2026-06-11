import { redirect } from "next/navigation";
import { clearFreelanceAuthSession } from "@/lib/auth/session";

export async function POST() {
  await clearFreelanceAuthSession();
  redirect("/dashboard");
}
