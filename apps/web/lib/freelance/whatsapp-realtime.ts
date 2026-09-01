import Redis from "ioredis";

export const WHATSAPP_REALTIME_CHANNEL = "freelance:whatsapp:updates";

export type WhatsAppRealtimeEvent = {
  type: "whatsapp.updated";
  userId: string;
  conversationId: string;
  reason: "inbound" | "outbound" | "status";
  occurredAt: string;
};

const globalForRedis = globalThis as typeof globalThis & {
  whatsappRedisPublisher?: Redis;
};

function getPublisher() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;
  if (!globalForRedis.whatsappRedisPublisher) {
    globalForRedis.whatsappRedisPublisher = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    });
    globalForRedis.whatsappRedisPublisher.on("error", (error) => {
      console.error("WhatsApp Redis publisher error", error.message);
    });
  }
  return globalForRedis.whatsappRedisPublisher;
}

export async function publishWhatsAppRealtimeEvent(
  event: Omit<WhatsAppRealtimeEvent, "type" | "occurredAt">
) {
  const publisher = getPublisher();
  if (!publisher) return false;

  try {
    if (publisher.status === "wait") {
      await publisher.connect();
    }
    await publisher.publish(
      WHATSAPP_REALTIME_CHANNEL,
      JSON.stringify({
        type: "whatsapp.updated",
        occurredAt: new Date().toISOString(),
        ...event
      } satisfies WhatsAppRealtimeEvent)
    );
    return true;
  } catch (error) {
    console.error(
      "Unable to publish WhatsApp realtime event",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}
