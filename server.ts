import http from "node:http";

import next from "next";
import { Server } from "socket.io";

import { getRoomManager } from "@/lib/server/room-manager";
import type { ClientIntentMap, ServerEventMap } from "@/lib/types";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = Number(process.env.PORT ?? 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const roomManager = getRoomManager();
  const server = http.createServer((req, res) => handle(req, res));
  const io = new Server(server, {
    path: "/socket.io",
  });

  const emitSnapshot = (roomCode: string) => {
    const room = roomManager.getRoom(roomCode);
    [...room.seats.filter(Boolean), ...room.spectators].forEach(
      (participant) => {
        if (!participant?.connected) {
          return;
        }
        io.to(participant.sessionId).emit(
          "state",
          roomManager.buildSnapshot(roomCode, participant.sessionId),
        );
      },
    );
  };

  roomManager.setBroadcaster(emitSnapshot);

  io.on("connection", (socket) => {
    const sendError = (message: string) => {
      socket.emit("toast", {
        kind: "error",
        message,
      } satisfies ServerEventMap["toast"]);
    };

    const bind = (roomCode: string, sessionId: string) => {
      socket.join(roomCode);
      socket.join(sessionId);
      socket.data.roomCode = roomCode;
      socket.data.sessionId = sessionId;
    };

    const withHandler = <T extends keyof ClientIntentMap>(
      event: T,
      handler: (payload: ClientIntentMap[T]) => string,
    ) => {
      socket.on(
        event as string,
        ((payload: ClientIntentMap[T]) => {
          try {
            const roomCode = handler(payload);
            bind(roomCode, payload.sessionId);
            emitSnapshot(roomCode);
          } catch (error) {
            sendError(
              error instanceof Error ? error.message : "Something went wrong.",
            );
          }
        }) as (...args: unknown[]) => void,
      );
    };

    withHandler(
      "create_room",
      (payload) => roomManager.createRoom(payload).code,
    );
    withHandler("join_room", (payload) => roomManager.joinRoom(payload).code);
    withHandler(
      "rejoin_room",
      (payload) => roomManager.rejoinRoom(payload).code,
    );
    withHandler(
      "set_display_name",
      (payload) => roomManager.setDisplayName(payload).code,
    );
    withHandler(
      "set_match_target",
      (payload) => roomManager.setMatchTarget(payload).code,
    );
    withHandler(
      "set_series_target",
      (payload) => roomManager.setSeriesTarget(payload).code,
    );
    withHandler(
      "start_series",
      (payload) => roomManager.startSeries(payload).code,
    );
    withHandler(
      "declare_trump",
      (payload) => roomManager.declareTrump(payload).code,
    );
    withHandler(
      "discard_cards",
      (payload) => roomManager.discardCards(payload).code,
    );
    withHandler(
      "resolve_refill",
      (payload) => roomManager.resolveRefill(payload).code,
    );
    withHandler("play_card", (payload) => roomManager.playCard(payload).code);
    withHandler("play_again", (payload) => roomManager.playAgain(payload).code);
    withHandler(
      "toggle_surrender",
      (payload) => roomManager.toggleSurrender(payload).code,
    );
    withHandler(
      "end_paused_match",
      (payload) => roomManager.endPausedMatch(payload).code,
    );

    socket.on("leave_room", (payload: ClientIntentMap["leave_room"]) => {
      roomManager.leaveRoom(payload);
      emitSnapshot(payload.roomCode);
    });

    socket.on("disconnect", () => {
      if (socket.data.roomCode && socket.data.sessionId) {
        roomManager.disconnect(socket.data.roomCode, socket.data.sessionId);
        emitSnapshot(socket.data.roomCode);
      }
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
