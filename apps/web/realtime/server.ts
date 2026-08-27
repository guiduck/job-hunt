import { createServer } from "node:http";
import Redis from "ioredis";
import { WebSocket, WebSocketServer } from "ws";
import {
  WHATSAPP_REALTIME_CHANNEL,
  type WhatsAppRealtimeEvent
} from "../lib/freelance/whatsapp-realtime";

const port = Number(process.env.WHATSAPP_REALTIME_PORT ?? 3001);
const redisUrl = process.env.REDIS_URL ?? "redis://redis:6379";
const configuredOrigin = process.env.FREELANCE_WEB_APP_BASE_URL
  ? new URL(process.env.FREELANCE_WEB_APP_BASE_URL).origin
  : null;

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }
  response.writeHead(404);
  response.end();
});

const wss = new WebSocketServer({ server, path: "/ws" });
const subscriber = new Redis(redisUrl, {
  maxRetriesPerRequest: null
});
const aliveSockets = new WeakSet<WebSocket>();

wss.on("connection", (socket, request) => {
  const origin = request.headers.origin ?? null;
  if (configuredOrigin && origin !== configuredOrigin) {
    socket.close(1008, "Origin not allowed");
    return;
  }

  aliveSockets.add(socket);
  socket.on("pong", () => {
    aliveSockets.add(socket);
  });
  socket.send(JSON.stringify({ type: "whatsapp.ready" }));
});

subscriber.on("error", (error) => {
  console.error("WhatsApp realtime Redis subscriber error", error.message);
});

subscriber.on("message", (_channel, rawEvent) => {
  let event: WhatsAppRealtimeEvent;
  try {
    event = JSON.parse(rawEvent) as WhatsAppRealtimeEvent;
  } catch {
    return;
  }
  if (event.type !== "whatsapp.updated") return;

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: event.type, reason: event.reason }));
    }
  }
});

const heartbeat = setInterval(() => {
  for (const socket of wss.clients) {
    if (!aliveSockets.has(socket)) {
      socket.terminate();
      continue;
    }
    aliveSockets.delete(socket);
    socket.ping();
  }
}, 30_000);

async function shutdown() {
  clearInterval(heartbeat);
  for (const client of wss.clients) {
    client.close(1001, "Server shutting down");
  }
  await subscriber.quit().catch(() => undefined);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

await subscriber.subscribe(WHATSAPP_REALTIME_CHANNEL);
server.listen(port, "0.0.0.0", () => {
  console.log(`WhatsApp realtime server listening on port ${port}`);
});
