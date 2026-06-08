import type { OwnerScope } from "./repositories";

export function getCurrentUserScope(): OwnerScope {
  return {
    userId: process.env.DEFAULT_FREELANCE_USER_ID || "local-operator"
  };
}
