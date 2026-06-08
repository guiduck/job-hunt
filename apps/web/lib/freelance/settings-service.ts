import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";

export async function getSellerSettings(scope: OwnerScope) {
  const { userId } = requireOwnerScope(scope);
  return freelanceRepositories.settings.findUnique({
    where: { userId }
  });
}
