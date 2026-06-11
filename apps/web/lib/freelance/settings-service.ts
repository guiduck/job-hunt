import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";
import { sellerSettingsSchema } from "@/lib/validation/freelance";

export async function getSellerSettings(scope: OwnerScope) {
  const { userId } = requireOwnerScope(scope);
  return freelanceRepositories.settings.findUnique({
    where: { userId }
  });
}

export async function upsertSellerSettings(scope: OwnerScope, payload: unknown) {
  const { userId } = requireOwnerScope(scope);
  const input = sellerSettingsSchema.parse(payload);
  return freelanceRepositories.settings.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input }
  });
}
