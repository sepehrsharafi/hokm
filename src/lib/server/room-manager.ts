import { randomUUID } from "node:crypto";

import {
  activeSeats,
  displaySuit,
  HokmEngine,
  labelForSeat,
  teamLabel,
  teamOf,
} from "@/lib/hokm/engine";
import { saveResult } from "@/lib/server/results-store";
import type {
  ClientIntentMap,
  MatchTarget,
  PauseState,
  PlayerMode,
  PlayerPrivateState,
  PublicMatchState,
  PublicRoundState,
  PublicSeriesState,
  ResultsSnapshot,
  RoomSnapshot,
  RoomSummary,
  RoundState,
  Seat,
  SeatAssignment,
  SeriesTarget,
  SpectatorSession,
  SurrenderState,
  Team,
} from "@/lib/types";

type ActiveRoom = {
  code: string;
  hostSeat: Seat;
  mode: PlayerMode;
  pointTarget: MatchTarget;
  seriesTarget: SeriesTarget;
  seats: Array<SeatAssignment | null>;
  spectators: SpectatorSession[];
  engine: HokmEngine | null;
  pause: PauseState | null;
  surrender: SurrenderState | null;
  started: boolean;
  shareResultId: string | null;
  lastMessage: string | null;
  matchSummaries: string[];
  transitionTimer: NodeJS.Timeout | null;
};

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const makeRoomCode = () =>
  Array.from({ length: 4 }, () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)]).join("");

const seatsForMode = (mode: PlayerMode) => activeSeats(mode);

const requiredSurrenderVotes = (mode: PlayerMode, team: Team) => (mode === 2 ? 1 : team === "A" || team === "B" ? 2 : 2);

const teamNamesFromSeats = (mode: PlayerMode, seats: Array<SeatAssignment | null>) => ({
  A: seats
    .filter((entry) => entry && teamOf(entry.seat, mode) === "A")
    .map((entry) => entry?.displayName ?? ""),
  B: seats
    .filter((entry) => entry && teamOf(entry.seat, mode) === "B")
    .map((entry) => entry?.displayName ?? ""),
});

const summaryForRoom = (room: ActiveRoom): RoomSummary => ({
  code: room.code,
  seatCount: seatsForMode(room.mode).filter((seat) => room.seats[seat]).length,
  spectatorCount: room.spectators.filter((entry) => entry.connected).length,
  started: room.started,
  mode: room.mode,
  pointTarget: room.pointTarget,
  seriesTarget: room.seriesTarget,
});

const seatName = (room: ActiveRoom, seat: Seat) => room.seats[seat]?.displayName ?? "Player";

const emptySurrenderState = (): SurrenderState => ({
  votes: { A: [], B: [] },
});

const openSeats = (room: ActiveRoom) => seatsForMode(room.mode).filter((seat) => room.seats[seat] === null);

const humanizeMessage = (room: ActiveRoom, message: string | undefined) => {
  if (!message) {
    return message;
  }

  let nextMessage = message;
  seatsForMode(room.mode).forEach((seat) => {
    const label = labelForSeat(seat, room.mode);
    nextMessage = nextMessage.replaceAll(label, seatName(room, seat));
  });

  const teamNames = teamNamesFromSeats(room.mode, room.seats);
  nextMessage = nextMessage.replaceAll("Team A", teamNames.A.join(" / ") || "Team A");
  nextMessage = nextMessage.replaceAll("Team B", teamNames.B.join(" / ") || "Team B");
  return nextMessage;
};

const redactRound = (round: RoundState, viewerSeat: Seat | null): PublicRoundState => {
  const handCounts = {
    0: round.hands[0].length,
    1: round.hands[1].length,
    2: round.hands[2].length,
    3: round.hands[3].length,
  } as Record<Seat, number>;

  let refillPreview = null;
  if (round.mode === 2 && viewerSeat !== null) {
    if (round.drawnCard && round.refillTurnSeat === viewerSeat) {
      refillPreview = {
        seat: viewerSeat,
        firstCard: round.drawnCard,
        secondCard: null,
        keptCardCode: null,
        decision: "pending",
      };
    } else if (round.refillPreview?.seat === viewerSeat) {
      refillPreview = round.refillPreview;
    }
  }

  return {
    mode: round.mode,
    hakemSeat: round.hakemSeat,
    dealerSeat: round.dealerSeat,
    trumpSuit: round.trumpSuit,
    phase: round.phase,
    handCounts,
    stockCount: round.stock.length,
    deadPileCount: round.deadPile.length,
    refillTurnSeat: round.refillTurnSeat,
    refillPreview,
    trickCounts: round.trickCounts,
    trickNumber: round.trickNumber,
    trick: round.trick,
    roundWinner: round.roundWinner,
    awardedPoints: round.awardedPoints,
    summary: round.summary,
  };
};

const redactSeries = (
  room: ActiveRoom,
  viewerSeat: Seat | null,
): PublicSeriesState | null => {
  const series = room.engine?.series;
  if (!series) {
    return null;
  }

  const currentMatch: PublicMatchState | null = series.currentMatch
    ? {
        mode: series.currentMatch.mode,
        pointTarget: series.currentMatch.pointTarget,
        points: series.currentMatch.points,
        roundNumber: series.currentMatch.roundNumber,
        round: series.currentMatch.round ? redactRound(series.currentMatch.round, viewerSeat) : null,
        winner: series.currentMatch.winner,
        summary: series.currentMatch.summary,
      }
    : null;

  return {
    mode: series.mode,
    bestOf: series.bestOf,
    wins: series.wins,
    matchNumber: series.matchNumber,
    currentMatch,
    winner: series.winner,
    summary: series.summary,
  };
};

export class RoomManager {
  private rooms = new Map<string, ActiveRoom>();

  private onRoomChanged: ((roomCode: string) => void) | null = null;

  createRoom(payload: ClientIntentMap["create_room"]) {
    const code = this.uniqueCode();
    const mode = Number(payload.mode) === 2 ? 2 : 4;
    const room: ActiveRoom = {
      code,
      hostSeat: 0,
      mode,
      pointTarget: payload.pointTarget ?? 7,
      seriesTarget: payload.seriesTarget ?? 7,
      seats: [
        {
          seat: 0,
          sessionId: payload.sessionId,
          displayName: payload.displayName,
          connected: true,
        },
        null,
        null,
        null,
      ],
      spectators: [],
      engine: null,
      pause: null,
      surrender: null,
      started: false,
      shareResultId: null,
      lastMessage: null,
      matchSummaries: [],
      transitionTimer: null,
    };
    this.rooms.set(code, room);
    return room;
  }

  joinRoom(payload: ClientIntentMap["join_room"]) {
    const room = this.requireRoom(payload.roomCode);
    const knownSeat = this.findSeat(room, payload.sessionId);
    if (knownSeat !== null) {
      return this.rejoinRoom({
        roomCode: room.code,
        sessionId: payload.sessionId,
      });
    }
    const knownSpectator = room.spectators.find((entry) => entry.sessionId === payload.sessionId);
    if (knownSpectator) {
      knownSpectator.connected = true;
      knownSpectator.displayName = payload.displayName;
      return room;
    }

    const openSeat = openSeats(room)[0];
    if (openSeat === undefined) {
      if (!payload.spectate) {
        throw new Error("This room is full. You can spectate.");
      }

      room.spectators.push({
        displayName: payload.displayName,
        sessionId: payload.sessionId,
        connected: true,
      });
      return room;
    }

    room.seats[openSeat] = {
      seat: openSeat,
      displayName: payload.displayName,
      sessionId: payload.sessionId,
      connected: true,
    };

    return room;
  }

  rejoinRoom(payload: ClientIntentMap["rejoin_room"]) {
    const room = this.requireRoom(payload.roomCode);
    const seat = this.findSeat(room, payload.sessionId);
    if (seat === null) {
      const spectator = room.spectators.find((entry) => entry.sessionId === payload.sessionId);
      if (!spectator) {
        throw new Error("You are not in this room.");
      }
      spectator.connected = true;
      return room;
    }
    const player = room.seats[seat];
    if (player) {
      player.connected = true;
    }

    if (room.pause?.disconnectedSeat === seat) {
      room.pause = null;
      room.lastMessage = `${player?.displayName ?? "Player"} rejoined the table.`;
    }

    return room;
  }

  leaveRoom(payload: ClientIntentMap["leave_room"]) {
    const room = this.requireRoom(payload.roomCode);
    const seat = this.findSeat(room, payload.sessionId);
    if (seat === null) {
      const spectatorIndex = room.spectators.findIndex((entry) => entry.sessionId === payload.sessionId);
      if (spectatorIndex !== -1) {
        room.spectators.splice(spectatorIndex, 1);
      }
      if (room.seats.every((entry) => entry === null) && room.spectators.length === 0) {
        this.rooms.delete(room.code);
      }
      return;
    }

    room.seats[seat] = null;
    if (room.seats.every((entry) => entry === null) && room.spectators.length === 0) {
      this.rooms.delete(room.code);
    }
  }

  setDisplayName(payload: ClientIntentMap["set_display_name"]) {
    const room = this.requireRoom(payload.roomCode);
    const seat = this.requireSeat(room, payload.sessionId);
    const player = room.seats[seat];
    if (player) {
      player.displayName = payload.displayName;
    }
    return room;
  }

  setMatchTarget(payload: ClientIntentMap["set_match_target"]) {
    const room = this.requireRoom(payload.roomCode);
    const seat = this.requireSeat(room, payload.sessionId);
    if (seat !== room.hostSeat) {
      throw new Error("Only the host can change the match target.");
    }
    if (room.started) {
      throw new Error("The match target cannot change after the series starts.");
    }

    room.pointTarget = payload.pointTarget;
    room.lastMessage = `Match target set to ${payload.pointTarget}.`;
    return room;
  }

  setSeriesTarget(payload: ClientIntentMap["set_series_target"]) {
    const room = this.requireRoom(payload.roomCode);
    const seat = this.requireSeat(room, payload.sessionId);
    if (seat !== room.hostSeat) {
      throw new Error("Only the host can change the series length.");
    }
    if (room.started) {
      throw new Error("The series length cannot change after the series starts.");
    }

    room.seriesTarget = payload.seriesTarget;
    room.lastMessage = `Series length set to Best of ${payload.seriesTarget}.`;
    return room;
  }

  startSeries(payload: ClientIntentMap["start_series"]) {
    const room = this.requireRoom(payload.roomCode);
    const seat = this.requireSeat(room, payload.sessionId);
    if (seat !== room.hostSeat) {
      throw new Error("Only the host can start the series.");
    }
    if (openSeats(room).length > 0) {
      throw new Error(`${room.mode} players are required to start.`);
    }

    room.started = true;
    room.shareResultId = null;
    room.matchSummaries = [];
    room.pause = null;
    room.surrender = emptySurrenderState();
    room.engine = new HokmEngine(room.pointTarget, room.seriesTarget, room.mode);
    room.lastMessage = room.mode === 2 ? "Two-player series started." : "Series started.";
    return room;
  }

  declareTrump(payload: ClientIntentMap["declare_trump"]) {
    const room = this.requireLiveRoom(payload.roomCode);
    if (room.pause) {
      throw new Error("The game is paused.");
    }
    const seat = this.requireSeat(room, payload.sessionId);
    room.engine!.declareTrump(seat, payload.suit);
    room.lastMessage = `${seatName(room, seat)} declared ${displaySuit(payload.suit)} as Hokm.`;
    return room;
  }

  discardCards(payload: ClientIntentMap["discard_cards"]) {
    const room = this.requireLiveRoom(payload.roomCode);
    if (room.pause) {
      throw new Error("The game is paused.");
    }
    const seat = this.requireSeat(room, payload.sessionId);
    const transition = room.engine!.discardCards(seat, payload.cardCodes);
    room.lastMessage = humanizeMessage(room, transition.message) ?? room.lastMessage;
    return room;
  }

  resolveRefill(payload: ClientIntentMap["resolve_refill"]) {
    const room = this.requireLiveRoom(payload.roomCode);
    if (room.pause) {
      throw new Error("The game is paused.");
    }
    const seat = this.requireSeat(room, payload.sessionId);
    const transition = room.engine!.resolveRefill(seat, payload.action);
    room.lastMessage = humanizeMessage(room, transition.message) ?? room.lastMessage;
    return room;
  }

  playCard(payload: ClientIntentMap["play_card"]) {
    const room = this.requireLiveRoom(payload.roomCode);
    if (room.pause) {
      throw new Error("The game is paused.");
    }
    const seat = this.requireSeat(room, payload.sessionId);
    const transition = room.engine!.playCard(seat, payload.cardCode);
    if (
      transition.kind === "none" &&
      room.engine?.currentRound?.summary?.endsWith("took the trick.")
    ) {
      room.lastMessage = humanizeMessage(room, room.engine.currentRound.summary) ?? room.lastMessage;
    } else {
      room.lastMessage = humanizeMessage(room, transition.message) ?? room.lastMessage;
    }

    if (transition.kind === "round_over") {
      this.queueTransition(room, () => room.engine?.startNextRound(), 1800);
    } else if (transition.kind === "match_over") {
      if (room.engine?.currentMatch?.summary) {
        room.matchSummaries.push(humanizeMessage(room, room.engine.currentMatch.summary) ?? room.engine.currentMatch.summary);
      }
      this.queueTransition(room, () => room.engine?.advanceAfterMatch(), 2400);
    } else if (transition.kind === "series_over") {
      if (room.engine?.currentMatch?.summary) {
        room.matchSummaries.push(humanizeMessage(room, room.engine.currentMatch.summary) ?? room.engine.currentMatch.summary);
      }
      void this.persistResult(room);
    }

    return room;
  }

  toggleSurrender(payload: ClientIntentMap["toggle_surrender"]) {
    const room = this.requireLiveRoom(payload.roomCode);
    if (room.pause) {
      throw new Error("The game is paused.");
    }
    if (room.engine?.series.winner) {
      throw new Error("The series is already over.");
    }

    const seat = this.requireSeat(room, payload.sessionId);
    const team = teamOf(seat, room.mode);
    const votes = room.surrender ?? emptySurrenderState();
    room.surrender = votes;

    if (votes.votes[team].includes(seat)) {
      votes.votes[team] = votes.votes[team].filter((entry) => entry !== seat);
      room.lastMessage = `${seatName(room, seat)} withdrew the surrender vote.`;
      return room;
    }

    votes.votes[team] = [...votes.votes[team], seat];
    if (votes.votes[team].length < requiredSurrenderVotes(room.mode, team)) {
      room.lastMessage =
        room.mode === 2
          ? `${seatName(room, seat)} wants to surrender.`
          : `${seatName(room, seat)} wants to surrender. Waiting for their teammate.`;
      return room;
    }

    const winner: Team = team === "A" ? "B" : "A";
    if (room.transitionTimer) {
      clearTimeout(room.transitionTimer);
      room.transitionTimer = null;
    }
    room.engine!.series.winner = winner;
    room.engine!.series.summary = `${teamLabel(winner)} won after ${teamLabel(team)} surrendered.`;
    room.lastMessage = humanizeMessage(room, room.engine!.series.summary) ?? null;
    void this.persistResult(room);
    return room;
  }

  disconnect(roomCode: string, sessionId: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      return;
    }

    const seat = this.findSeat(room, sessionId);
    if (seat === null) {
      const spectator = room.spectators.find((entry) => entry.sessionId === sessionId);
      if (spectator) {
        spectator.connected = false;
      }
      return;
    }

    const player = room.seats[seat];
    if (!player) {
      return;
    }

    player.connected = false;

    if (room.started && room.engine && !room.engine.series.winner) {
      room.pause = {
        disconnectedSeat: seat,
        disconnectedName: player.displayName,
        pausedUntil: Date.now() + 60_000,
      };
      room.lastMessage = `${player.displayName} disconnected. Waiting 60 seconds for reconnect.`;
    }
  }

  endPausedMatch(payload: ClientIntentMap["end_paused_match"]) {
    const room = this.requireLiveRoom(payload.roomCode);
    const seat = this.requireSeat(room, payload.sessionId);
    if (seat !== room.hostSeat) {
      throw new Error("Only the host can end a paused match.");
    }
    if (!room.pause) {
      throw new Error("The game is not paused.");
    }
    if (Date.now() < room.pause.pausedUntil) {
      throw new Error("The reconnect window is still active.");
    }

    const winner: Team = teamOf(room.pause.disconnectedSeat, room.mode) === "A" ? "B" : "A";
    room.engine!.series.winner = winner;
    room.engine!.series.summary = `${teamLabel(winner)} won by forfeit after a disconnect.`;
    room.lastMessage = humanizeMessage(room, room.engine!.series.summary) ?? null;
    room.pause = null;
    void this.persistResult(room);
    return room;
  }

  playAgain(payload: ClientIntentMap["play_again"]) {
    const room = this.requireLiveRoom(payload.roomCode);
    const seat = this.requireSeat(room, payload.sessionId);
    if (seat !== room.hostSeat) {
      throw new Error("Only the host can restart the series.");
    }

    room.shareResultId = null;
    room.matchSummaries = [];
    room.pause = null;
    room.surrender = emptySurrenderState();
    room.engine!.resetSeries(room.pointTarget, room.seriesTarget);
    room.lastMessage = `A new Best of ${room.seriesTarget} series has started.`;
    return room;
  }

  buildSnapshot(roomCode: string, sessionId: string): RoomSnapshot {
    const room = this.requireRoom(roomCode);
    const seat = this.findSeat(room, sessionId);
    const hand =
      seat !== null && room.engine?.currentRound ? room.engine.currentRound.hands[seat] : [];
    const isSpectator = room.spectators.some((entry) => entry.sessionId === sessionId);
    const player: PlayerPrivateState = {
      sessionId,
      seat,
      isSpectator,
      hand,
    };

    const round = room.engine?.currentRound;
    const stage =
      !room.started
        ? "LOBBY"
        : room.engine?.series.winner
          ? "SERIES_OVER"
          : room.engine?.currentMatch?.winner
            ? "MATCH_OVER"
            : round?.phase === "ROUND_OVER"
              ? "ROUND_OVER"
              : round?.phase ?? "LOBBY";

    return {
      room: summaryForRoom(room),
      player,
      game: {
        stage,
        roomCode: room.code,
        hostSeat: room.hostSeat,
        mode: room.mode,
        pointTarget: room.pointTarget,
        seriesTarget: room.seriesTarget,
        series: redactSeries(room, seat),
        seats: room.seats,
        spectators: room.spectators.filter((entry) => entry.connected),
        pause: room.pause,
        surrender: room.surrender,
        lastMessage: room.lastMessage,
        shareResultId: room.shareResultId,
      },
    };
  }

  getRoom(roomCode: string) {
    return this.requireRoom(roomCode);
  }

  setBroadcaster(onRoomChanged: (roomCode: string) => void) {
    this.onRoomChanged = onRoomChanged;
  }

  private async persistResult(room: ActiveRoom) {
    if (!room.engine?.series.winner || room.shareResultId) {
      return;
    }

    const result: ResultsSnapshot = {
      id: randomUUID().slice(0, 8),
      roomCode: room.code,
      createdAt: Date.now(),
      mode: room.mode,
      target: room.pointTarget,
      seriesTarget: room.seriesTarget,
      seriesWins: room.engine.series.wins,
      winner: room.engine.series.winner,
      teams: teamNamesFromSeats(room.mode, room.seats),
      matchSummaries: room.matchSummaries,
    };

    room.shareResultId = result.id;
    await saveResult(result);
    this.onRoomChanged?.(room.code);
  }

  private uniqueCode() {
    let code = makeRoomCode();
    while (this.rooms.has(code)) {
      code = makeRoomCode();
    }
    return code;
  }

  private requireRoom(roomCode: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      throw new Error("Room not found or expired.");
    }
    return room;
  }

  private requireLiveRoom(roomCode: string) {
    const room = this.requireRoom(roomCode);
    if (!room.engine) {
      throw new Error("The series has not started.");
    }
    return room;
  }

  private findSeat(room: ActiveRoom, sessionId: string) {
    const seat = room.seats.findIndex((entry) => entry?.sessionId === sessionId);
    return seat === -1 ? null : (seat as Seat);
  }

  private requireSeat(room: ActiveRoom, sessionId: string) {
    const seat = this.findSeat(room, sessionId);
    if (seat === null) {
      throw new Error("You are not seated in this room.");
    }
    return seat;
  }

  private queueTransition(room: ActiveRoom, task: () => void, delayMs: number) {
    if (room.transitionTimer) {
      clearTimeout(room.transitionTimer);
    }
    room.transitionTimer = setTimeout(() => {
      task();
      room.transitionTimer = null;
      this.onRoomChanged?.(room.code);
    }, delayMs);
  }
}

let manager: RoomManager | null = null;

export const getRoomManager = () => {
  if (!manager) {
    manager = new RoomManager();
  }
  return manager;
};
