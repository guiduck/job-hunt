import type { ChannelReadinessStatus, OutreachChannel } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { getEmailReadiness } from "@/lib/providers/email-provider";
import { getWhatsAppReadiness } from "@/lib/providers/whatsapp-provider";
import { channelSettingsSchema } from "@/lib/validation/freelance";
import { freelanceRepositories, requireOwnerScope, type OwnerScope } from "./repositories";

function readinessFor(channel: OutreachChannel) {
  return channel === "email" ? getEmailReadiness() : getWhatsAppReadiness();
}

async function persistReadiness(scope: OwnerScope, channel: OutreachChannel) {
  const readiness = readinessFor(channel);
  const existing = await freelanceRepositories.outreachChannelSettings.findUnique({
    where: { userId_channel: { userId: scope.userId, channel } }
  });
  return freelanceRepositories.outreachChannelSettings.upsert({
    where: { userId_channel: { userId: scope.userId, channel } },
    update: {
      providerName: readiness.providerName,
      status: readiness.status as ChannelReadinessStatus,
      enabled: existing?.enabled ?? readiness.status === "ready",
      displayAddress: existing?.displayAddress ?? undefined,
      displayName: existing?.displayName ?? undefined,
      dailyLimit: readiness.dailyLimit,
      remainingToday: readiness.remainingToday,
      limitResetAt: readiness.limitResetAt ? new Date(readiness.limitResetAt) : null,
      requiredEnvVars: readiness.requiredEnvVars as unknown as Prisma.InputJsonArray,
      missingEnvVars: readiness.missingEnvVars as unknown as Prisma.InputJsonArray,
      diagnosticCode: readiness.diagnosticCode,
      diagnosticMessage: readiness.diagnosticMessage,
      lastCheckedAt: new Date()
    },
    create: {
      userId: scope.userId,
      channel,
      providerName: readiness.providerName,
      status: readiness.status as ChannelReadinessStatus,
      enabled: readiness.status === "ready",
      dailyLimit: readiness.dailyLimit,
      remainingToday: readiness.remainingToday,
      limitResetAt: readiness.limitResetAt ? new Date(readiness.limitResetAt) : null,
      requiredEnvVars: readiness.requiredEnvVars as unknown as Prisma.InputJsonArray,
      missingEnvVars: readiness.missingEnvVars as unknown as Prisma.InputJsonArray,
      diagnosticCode: readiness.diagnosticCode,
      diagnosticMessage: readiness.diagnosticMessage,
      lastCheckedAt: new Date()
    }
  });
}

export async function getChannelSettings(scope: OwnerScope) {
  requireOwnerScope(scope);
  const items = await Promise.all([
    persistReadiness(scope, "email"),
    persistReadiness(scope, "whatsapp")
  ]);
  return items;
}

export async function updateChannelSetting(scope: OwnerScope, payload: unknown) {
  const { userId } = requireOwnerScope(scope);
  const input = channelSettingsSchema.parse(payload);
  const readiness = readinessFor(input.channel);
  return freelanceRepositories.outreachChannelSettings.upsert({
    where: { userId_channel: { userId, channel: input.channel } },
    update: {
      enabled: input.enabled,
      providerName: input.providerName ?? readiness.providerName,
      displayName: input.displayName,
      displayAddress: input.displayAddress,
      status: readiness.status as ChannelReadinessStatus,
      dailyLimit: readiness.dailyLimit,
      remainingToday: readiness.remainingToday,
      requiredEnvVars: readiness.requiredEnvVars as unknown as Prisma.InputJsonArray,
      missingEnvVars: readiness.missingEnvVars as unknown as Prisma.InputJsonArray,
      diagnosticCode: readiness.diagnosticCode,
      diagnosticMessage: readiness.diagnosticMessage,
      lastCheckedAt: new Date()
    },
    create: {
      userId,
      channel: input.channel,
      enabled: input.enabled ?? readiness.status === "ready",
      providerName: input.providerName ?? readiness.providerName,
      displayName: input.displayName,
      displayAddress: input.displayAddress,
      status: readiness.status as ChannelReadinessStatus,
      dailyLimit: readiness.dailyLimit,
      remainingToday: readiness.remainingToday,
      requiredEnvVars: readiness.requiredEnvVars as unknown as Prisma.InputJsonArray,
      missingEnvVars: readiness.missingEnvVars as unknown as Prisma.InputJsonArray,
      diagnosticCode: readiness.diagnosticCode,
      diagnosticMessage: readiness.diagnosticMessage,
      lastCheckedAt: new Date()
    }
  });
}
