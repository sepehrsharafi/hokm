import { describe, expect, it } from "vitest";

import { RoomManager } from "@/lib/server/room-manager";

describe("RoomManager", () => {
  it("creates a room with the host in seat 0", () => {
    const manager = new RoomManager();
    const room = manager.createRoom({
      displayName: "Host",
      sessionId: "session-host",
      pointTarget: 7,
    });

    expect(room.seats[0]?.displayName).toBe("Host");
    expect(room.pointTarget).toBe(7);
    expect(room.seriesTarget).toBe(7);
  });

  it("fills open seats and rejects a fifth player", () => {
    const manager = new RoomManager();
    const room = manager.createRoom({
      displayName: "Host",
      sessionId: "s0",
      pointTarget: 7,
    });

    manager.joinRoom({ roomCode: room.code, displayName: "P1", sessionId: "s1" });
    manager.joinRoom({ roomCode: room.code, displayName: "P2", sessionId: "s2" });
    manager.joinRoom({ roomCode: room.code, displayName: "P3", sessionId: "s3" });

    expect(() =>
      manager.joinRoom({ roomCode: room.code, displayName: "P4", sessionId: "s4" }),
    ).toThrow(/full/i);
  });

  it("allows spectating when the table is full", () => {
    const manager = new RoomManager();
    const room = manager.createRoom({
      displayName: "Host",
      sessionId: "s0",
      pointTarget: 7,
    });

    manager.joinRoom({ roomCode: room.code, displayName: "P1", sessionId: "s1" });
    manager.joinRoom({ roomCode: room.code, displayName: "P2", sessionId: "s2" });
    manager.joinRoom({ roomCode: room.code, displayName: "P3", sessionId: "s3" });
    manager.joinRoom({
      roomCode: room.code,
      displayName: "Spec",
      sessionId: "s4",
      spectate: true,
    });

    const snapshot = manager.buildSnapshot(room.code, "s4");
    expect(snapshot.player.isSpectator).toBe(true);
    expect(snapshot.player.seat).toBeNull();
    expect(snapshot.game.spectators[0]?.displayName).toBe("Spec");
  });

  it("allows only the host to change the point target", () => {
    const manager = new RoomManager();
    const room = manager.createRoom({
      displayName: "Host",
      sessionId: "s0",
      pointTarget: 7,
    });
    manager.joinRoom({ roomCode: room.code, displayName: "Guest", sessionId: "s1" });

    expect(() =>
      manager.setMatchTarget({
        roomCode: room.code,
        sessionId: "s1",
        pointTarget: 3,
      }),
    ).toThrow(/host/i);

    manager.setMatchTarget({
      roomCode: room.code,
      sessionId: "s0",
      pointTarget: 3,
    });

    expect(manager.getRoom(room.code).pointTarget).toBe(3);
  });

  it("allows only the host to change the series target", () => {
    const manager = new RoomManager();
    const room = manager.createRoom({
      displayName: "Host",
      sessionId: "s0",
      pointTarget: 7,
    });
    manager.joinRoom({ roomCode: room.code, displayName: "Guest", sessionId: "s1" });

    expect(() =>
      manager.setSeriesTarget({
        roomCode: room.code,
        sessionId: "s1",
        seriesTarget: 3,
      }),
    ).toThrow(/host/i);

    manager.setSeriesTarget({
      roomCode: room.code,
      sessionId: "s0",
      seriesTarget: 3,
    });

    expect(manager.getRoom(room.code).seriesTarget).toBe(3);
  });

  it("requires both teammates to surrender before ending the series", () => {
    const manager = new RoomManager();
    const room = manager.createRoom({
      displayName: "Host",
      sessionId: "s0",
      pointTarget: 7,
    });

    manager.joinRoom({ roomCode: room.code, displayName: "P1", sessionId: "s1" });
    manager.joinRoom({ roomCode: room.code, displayName: "P2", sessionId: "s2" });
    manager.joinRoom({ roomCode: room.code, displayName: "P3", sessionId: "s3" });
    manager.startSeries({ roomCode: room.code, sessionId: "s0" });

    manager.toggleSurrender({ roomCode: room.code, sessionId: "s0" });
    expect(manager.buildSnapshot(room.code, "s0").game.stage).not.toBe("SERIES_OVER");

    manager.toggleSurrender({ roomCode: room.code, sessionId: "s2" });
    expect(manager.buildSnapshot(room.code, "s0").game.stage).toBe("SERIES_OVER");
  });
});
