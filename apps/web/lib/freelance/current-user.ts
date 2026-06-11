import type { OwnerScope } from "./repositories";
import { getFreelanceCurrentUser } from "@/lib/auth/session";

export async function getCurrentUserScope(): Promise<OwnerScope> {
  const currentUser = await getFreelanceCurrentUser();
  return {
    userId: currentUser?.id || process.env.DEFAULT_FREELANCE_USER_ID || "local-operator"
  };
}
