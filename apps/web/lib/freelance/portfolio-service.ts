import { nichePortfolioUpsertSchema } from "@/lib/validation/portfolio";
import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";

export class PortfolioServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "PortfolioServiceError";
  }
}

export type PortfolioEntryDto = {
  nicheId: string;
  nicheName: string;
  nicheSlug: string;
  nicheEnabled: boolean;
  nicheLifecycleStatus: string;
  projectName: string | null;
  repositoryUrl: string | null;
  demoUrl: string | null;
  notes: string | null;
  updatedAt: string | null;
};

export async function listNichePortfolio(scope: OwnerScope): Promise<PortfolioEntryDto[]> {
  const { userId } = requireOwnerScope(scope);
  const niches = await freelanceRepositories.niches.findMany({
    orderBy: [{ enabled: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: {
      portfolioExamples: {
        where: { userId },
        take: 1
      }
    }
  });

  return niches.map((niche) => {
    const example = niche.portfolioExamples[0];
    return {
      nicheId: niche.id,
      nicheName: niche.displayName ?? niche.name,
      nicheSlug: niche.slug,
      nicheEnabled: niche.enabled,
      nicheLifecycleStatus: niche.lifecycleStatus,
      projectName: example?.projectName ?? null,
      repositoryUrl: example?.repositoryUrl ?? null,
      demoUrl: example?.demoUrl ?? null,
      notes: example?.notes ?? null,
      updatedAt: example?.updatedAt.toISOString() ?? null
    };
  });
}

export async function upsertNichePortfolioExample(
  scope: OwnerScope,
  nicheId: string,
  payload: unknown
) {
  const { userId } = requireOwnerScope(scope);
  const input = nichePortfolioUpsertSchema.parse(payload);
  const niche = await freelanceRepositories.niches.findUnique({ where: { id: nicheId } });
  if (!niche) {
    throw new PortfolioServiceError("Niche not found.", 404);
  }

  const data = {
    projectName: input.projectName || null,
    repositoryUrl: input.repositoryUrl || null,
    demoUrl: input.demoUrl || null,
    notes: input.notes || null
  };
  const example = await freelanceRepositories.nichePortfolioExamples.upsert({
    where: { userId_nicheId: { userId, nicheId } },
    update: data,
    create: { userId, nicheId, ...data }
  });

  return {
    ...data,
    nicheId,
    updatedAt: example.updatedAt.toISOString()
  };
}

export async function deleteNichePortfolioExample(scope: OwnerScope, nicheId: string) {
  const { userId } = requireOwnerScope(scope);
  await freelanceRepositories.nichePortfolioExamples.deleteMany({ where: { userId, nicheId } });
  return { nicheId, deleted: true };
}
