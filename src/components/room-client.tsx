"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { getSocket } from "@/lib/client/socket";
import {
  getSessionId,
  getStoredName,
  setStoredName,
} from "@/lib/client/session";
import {
  displaySuit,
  isRedSuit,
  sortCardsBySuitAndRank,
  teamOf,
} from "@/lib/hokm/engine";
import { cn, copyText, formatCountdown } from "@/lib/utils";
import type {
  Card,
  MatchTarget,
  RoomSnapshot,
  Seat,
  Suit,
  Team,
} from "@/lib/types";

const TARGETS: MatchTarget[] = [3, 5, 7];
const SUIT_OPTIONS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

const seatClassMap: Record<Seat, string> = {
  0: "seat south",
  1: "seat east",
  2: "seat north",
  3: "seat west",
};

type RoomClientProps = {
  roomCode: string;
};

const suitLabelKey: Record<Suit, "spades" | "hearts" | "diamonds" | "clubs"> = {
  spades: "spades",
  hearts: "hearts",
  diamonds: "diamonds",
  clubs: "clubs",
};

function RoomContent({ roomCode }: RoomClientProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [name, setName] = useState(() =>
    typeof window === "undefined" ? "" : getStoredName(),
  );
  const [draftName, setDraftName] = useState(() =>
    typeof window === "undefined" ? "" : getStoredName(),
  );
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [sortRequested, setSortRequested] = useState(false);
  const [dismissedSurrenderVote, setDismissedSurrenderVote] = useState<
    string | null
  >(null);
  const [entryCanSpectate, setEntryCanSpectate] = useState(false);
  const sessionId = useMemo(() => getSessionId(), []);

  useEffect(() => {
    const socket = getSocket();
    const onState = (nextSnapshot: RoomSnapshot) => {
      setSnapshot(nextSnapshot);
      setJoining(false);
      setEntryError(null);
      setName((current) => current || draftName.trim());
    };
    const onToast = ({ message }: { message: string }) => {
      setToast(message);
      setJoining(false);
      setEntryError(message);
    };

    socket.on("state", onState);
    socket.on("toast", onToast);

    return () => {
      socket.off("state", onState);
      socket.off("toast", onToast);
    };
  }, [draftName]);

  useEffect(() => {
    if (!name.trim()) {
      return;
    }

    setStoredName(name.trim());
    const socket = getSocket();
    const join = () => {
      socket.emit("rejoin_room", {
        roomCode,
        sessionId,
      });
      socket.emit("join_room", {
        roomCode,
        displayName: name.trim(),
        sessionId,
      });
    };

    if (socket.connected) {
      join();
    } else {
      socket.once("connect", join);
    }

    return () => {
      socket.off("connect", join);
    };
  }, [name, roomCode, sessionId]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const submitEntry = (spectate = false) => {
    const trimmed = draftName.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setEntryError(t.invalidName);
      return;
    }
    setJoining(true);
    setEntryError(null);
    setEntryCanSpectate(false);
    setStoredName(trimmed);

    const socket = getSocket();
    const onState = (nextSnapshot: RoomSnapshot) => {
      socket.off("toast", onToast);
      setSnapshot(nextSnapshot);
      setJoining(false);
      setEntryError(null);
      setName(trimmed);
    };
    const onToast = ({ message }: { message: string }) => {
      socket.off("state", onState);
      setJoining(false);
      if (/full/i.test(message)) {
        setEntryCanSpectate(true);
        setEntryError(t.roomFullSpectate);
      } else {
        setEntryError(message);
      }
    };

    socket.once("state", onState);
    socket.once("toast", onToast);
    socket.emit("join_room", {
      roomCode,
      displayName: trimmed,
      sessionId,
      spectate,
    });
  };

  const meSeat = snapshot?.player.seat ?? null;
  const isSpectator = snapshot?.player.isSpectator ?? false;
  const round = snapshot?.game.series?.currentMatch?.round;
  const amHost = meSeat === snapshot?.game.hostSeat;
  const displayHand = snapshot?.player.hand
    ? sortRequested
      ? sortCardsBySuitAndRank(snapshot.player.hand)
      : snapshot.player.hand
    : [];
  const joinUrl =
    typeof window !== "undefined" && snapshot?.game.roomCode
      ? `${window.location.origin}/room/${snapshot.game.roomCode}`
      : "";

  const canStart =
    snapshot?.game.stage === "LOBBY" && snapshot.room.seatCount === 4 && amHost;
  const currentTurnSeat = round?.trick.currentTurn ?? null;
  const currentTurnPlayer =
    currentTurnSeat !== null
      ? (snapshot?.game.seats.find((seat) => seat?.seat === currentTurnSeat)
          ?.displayName ?? "Player")
      : null;
  const trumpSuitClass = round?.trumpSuit
    ? isRedSuit(round.trumpSuit)
      ? "suit-red"
      : "suit-dark"
    : "text-[--gold]";
  const myTeam: Team | null = meSeat !== null ? teamOf(meSeat) : null;
  const myTeamVotes = myTeam
    ? (snapshot?.game.surrender?.votes[myTeam] ?? [])
    : [];
  const iDeclaredSurrender = meSeat !== null && myTeamVotes.includes(meSeat);
  const teammateVoteActive =
    meSeat !== null &&
    myTeamVotes.length === 1 &&
    !myTeamVotes.includes(meSeat);
  const surrenderVoteKey = `${myTeamVotes.join("-")}:${round?.trickNumber ?? 0}:${snapshot?.game.stage ?? ""}`;
  const showSurrenderPrompt =
    teammateVoteActive &&
    snapshot?.game.stage !== "SERIES_OVER" &&
    snapshot?.game.stage !== "LOBBY" &&
    dismissedSurrenderVote !== surrenderVoteKey;
  const isMyTurn =
    snapshot?.game.stage === "IN_TRICK" &&
    round?.trick.currentTurn === meSeat &&
    !snapshot.game.pause;
  const statusTone =
    snapshot?.game.stage === "ROUND_OVER"
      ? "status-pill round-over"
      : snapshot?.game.stage === "MATCH_OVER"
        ? "status-pill match-over"
        : snapshot?.game.stage === "SERIES_OVER"
          ? "status-pill series-over"
          : "status-pill";
  const statusHeading =
    snapshot?.game.stage === "ROUND_OVER"
      ? t.roundOver
      : snapshot?.game.stage === "MATCH_OVER"
        ? t.matchOver
        : snapshot?.game.stage === "SERIES_OVER"
          ? t.seriesOver
          : null;
  const startButtonText =
    snapshot?.game.stage === "LOBBY"
      ? snapshot.room.seatCount < 4
        ? t.waitingForPlayers
        : amHost
          ? t.startSeries
          : t.waitingForHost
      : t.startSeries;
  const turnOverlayTitle =
    currentTurnPlayer && language === "fa"
      ? `نوبت ${currentTurnPlayer} است`
      : currentTurnPlayer
        ? `${currentTurnPlayer} is up`
        : "";
  const turnOverlayBody =
    language === "fa"
      ? "بعد از تمام شدن این نوبت شما بازی می‌کنید."
      : "You can play as soon as this turn ends.";
  const surrenderButtonLabel = iDeclaredSurrender
    ? language === "fa"
      ? `اعلام شکست ${myTeamVotes.length}/2`
      : `Defeat declared ${myTeamVotes.length}/2`
    : language === "fa"
      ? "اعلام شکست"
      : "Declare defeat";

  const copyShareLink = async () => {
    if (!joinUrl) {
      return;
    }
    await copyText(joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const emit = (event: string, payload: object) =>
    getSocket().emit(event, payload);

  const renderCardFace = (card: Card, compact = false) => {
    const suitClass = isRedSuit(card.suit) ? "suit-red" : "suit-dark";

    return (
      <>
        <span className={cn("card-corner-mini card-top-left", suitClass)}>
          <span className="card-rank-mini">{card.rank}</span>
          <span className="card-suit-mini">{displaySuit(card.suit)}</span>
        </span>
        <span className={cn("card-corner-mini card-bottom-right", suitClass)}>
          <span className="card-rank-mini">{card.rank}</span>
          <span className="card-suit-mini">{displaySuit(card.suit)}</span>
        </span>
        <div
          className={cn(
            "card-center-art",
            compact && "card-center-art-compact",
            suitClass,
          )}
        >
          <span className={cn(card.rank === "A" ? "ace-suit" : "pip-suit")}>
            {displaySuit(card.suit)}
          </span>
        </div>
      </>
    );
  };

  return (
    <main className="page-shell min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="panel flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <Link href="/" className="brand-mark">
              {t.appName}
            </Link>
            <div className="text-sm text-[--muted]">
              {language === "fa" ? "\u0627\u062a\u0627\u0642" : "ROOM"}
              {" - "}
              <span className="mono-label text-[--ivory]">
                {snapshot?.game.roomCode ?? roomCode}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="button-secondary"
              onClick={() => setLanguage(language === "en" ? "fa" : "en")}
            >
              {language === "en" ? "\u0641\u0627\u0631\u0633\u06cc" : "EN"}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                getSocket().emit("leave_room", { roomCode, sessionId });
                router.push("/");
              }}
            >
              {language === "fa" ? "\u062e\u0631\u0648\u062c" : "Leave"}
            </button>
          </div>
        </header>

        {snapshot ? (
          <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-6">
              <div className="panel p-6">
                <p className="mono-label">{t.lobby}</p>
                <div className="mt-4 space-y-4 text-sm text-[--muted]">
                  <p>
                    {t.target}: {snapshot.game.pointTarget}
                  </p>
                </div>
                <div className="mt-5">
                  <p className="mono-label">{t.shareLink}</p>
                  <button
                    type="button"
                    className="button-secondary mt-3 w-full justify-center"
                    onClick={copyShareLink}
                  >
                    {copied ? t.copied : joinUrl || "Waiting..."}
                  </button>
                </div>
                {snapshot.game.stage === "LOBBY" ? (
                  <>
                    <p className="mono-label mt-5">{t.target}</p>
                    <div className="mt-3 flex gap-3">
                      {TARGETS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          disabled={!amHost}
                          className={
                            snapshot.game.pointTarget === value
                              ? "chip active"
                              : "chip"
                          }
                          onClick={() =>
                            emit("set_match_target", {
                              roomCode: snapshot.game.roomCode,
                              sessionId,
                              pointTarget: value,
                            })
                          }
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="button-primary mt-6 w-full justify-center"
                      disabled={!canStart}
                      onClick={() =>
                        emit("start_series", {
                          roomCode: snapshot.game.roomCode,
                          sessionId,
                        })
                      }
                    >
                      {startButtonText}
                    </button>
                  </>
                ) : null}
                {snapshot.game.stage === "SERIES_OVER" &&
                snapshot.game.shareResultId ? (
                  <Link
                    href={`/results/${snapshot.game.shareResultId}`}
                    className="button-primary mt-6 w-full justify-center"
                  >
                    {t.shareResults}
                  </Link>
                ) : null}
              </div>

              <div className="panel p-6">
                <p className="mono-label">{t.seriesWins}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[--muted]">
                      Team A
                    </p>
                    <p className="mt-2 text-3xl text-[--gold]">
                      {snapshot.game.series?.wins.A ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[--muted]">
                      Team B
                    </p>
                    <p className="mt-2 text-3xl text-[--team-b]">
                      {snapshot.game.series?.wins.B ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {round ? (
                <div className="panel p-6">
                  <p className="mono-label">{t.roundTricks}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[--muted]">
                        Team A
                      </p>
                      <p className="mt-2 text-3xl text-[--gold]">
                        {round.trickCounts.A}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[--muted]">
                        Team B
                      </p>
                      <p className="mt-2 text-3xl text-[--team-b]">
                        {round.trickCounts.B}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </aside>

            <section className="panel table-panel p-4 sm:p-6">
              <div className="table-head">
                {snapshot.game.spectators.length > 0 ? (
                  <div>
                    <p className="mono-label">{t.spectators}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {snapshot.game.spectators.map((spectator) => (
                        <span
                          key={spectator.sessionId}
                          className="spectator-pill"
                        >
                          {spectator.displayName}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="text-center">
                  <p className="mono-label">{t.hokm}</p>
                  <div
                    className={cn(
                      "hokm-display mt-2",
                      round?.trumpSuit && isRedSuit(round.trumpSuit)
                        ? "hokm-display-red"
                        : "hokm-display-dark",
                    )}
                  >
                    <span className={cn("hokm-display-symbol", trumpSuitClass)}>
                      {round?.trumpSuit ? displaySuit(round.trumpSuit) : "?"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="felt-board mt-6">
                {snapshot.game.seats.map((seat, index) => (
                  <div
                    key={seat?.seat ?? `empty-${index}`}
                    className={cn(
                      seat ? seatClassMap[seat.seat] : "seat empty-seat",
                      seat?.seat === meSeat && "seat-self",
                      seat?.seat === currentTurnSeat &&
                        (snapshot.game.stage === "IN_TRICK" ||
                          snapshot.game.stage === "AWAITING_TRUMP") &&
                        "seat-active-turn",
                    )}
                  >
                    <div className="seat-profile">
                      {seat && !seat.connected ? (
                        <div
                          className="seat-reconnecting"
                          aria-label={t.reconnecting}
                        >
                          <span className="seat-reconnecting-ring" />
                          <span className="seat-reconnecting-dot" />
                        </div>
                      ) : (
                        <div className="avatar-ring">
                          {seat?.displayName?.slice(0, 1) ?? "?"}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-lg text-[--ivory]">
                      {seat?.displayName ?? "Empty"}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.22em] text-[--muted]">
                      {seat
                        ? !seat.connected
                          ? t.reconnecting
                          : `Team ${teamOf(seat.seat)}`
                        : ""}
                    </div>
                    {round?.hakemSeat === seat?.seat ? (
                      <span className="seat-badge">{t.hakem}</span>
                    ) : null}
                  </div>
                ))}

                <div className="center-medallion">
                  {round?.trick.cards.map(({ seat, card }) => (
                    <div
                      key={`${seat}-${card.code}`}
                      className={`played-card played-${seat} ${isRedSuit(card.suit) ? "suit-red" : "suit-dark"}`}
                    >
                      {renderCardFace(card, true)}
                    </div>
                  ))}
                  <div className={statusTone}>
                    {statusHeading ? <strong>{statusHeading}</strong> : null}
                    <span>
                      {snapshot.game.pause
                        ? `${t.waitingReconnect}: ${snapshot.game.pause.disconnectedName} Ã‚Â· ${formatCountdown(snapshot.game.pause.pausedUntil)}`
                        : (snapshot.game.lastMessage ?? "Ready")}
                    </span>
                  </div>
                </div>
              </div>

              {!isSpectator ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-4">
                    <p className="mono-label">{t.yourHand}</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="button-secondary button-compact"
                        onClick={() => setSortRequested((current) => !current)}
                      >
                        {sortRequested ? t.sortedCards : t.sortCards}
                      </button>
                      {(snapshot.game.stage === "IN_TRICK" ||
                        snapshot.game.stage === "AWAITING_TRUMP") &&
                      meSeat !== null ? (
                        <button
                          type="button"
                          className={cn(
                            "button-secondary button-compact surrender-button",
                            iDeclaredSurrender && "surrender-button-active",
                          )}
                          onClick={() =>
                            emit("toggle_surrender", {
                              roomCode: snapshot.game.roomCode,
                              sessionId,
                            })
                          }
                        >
                          {surrenderButtonLabel}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="hand-zone mt-4">
                    {!isMyTurn && round && currentTurnPlayer ? (
                      <div className="turn-overlay">
                        <strong>{turnOverlayTitle}</strong>
                        <span>{turnOverlayBody}</span>
                      </div>
                    ) : null}
                    <div className="hand-row">
                      {displayHand.map((card) => {
                        return (
                          <button
                            key={card.code}
                            type="button"
                            className={`hand-card ${isRedSuit(card.suit) ? "suit-red" : "suit-dark"}`}
                            disabled={!isMyTurn}
                            onClick={() =>
                              emit("play_card", {
                                roomCode: snapshot.game.roomCode,
                                sessionId,
                                cardCode: card.code,
                              })
                            }
                          >
                            {renderCardFace(card)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="panel mt-6 p-5 text-sm text-[--muted]">
                  {t.spectatorView}
                </div>
              )}

              {snapshot.game.pause && amHost ? (
                <button
                  type="button"
                  className="button-secondary mt-6"
                  onClick={() =>
                    emit("end_paused_match", {
                      roomCode: snapshot.game.roomCode,
                      sessionId,
                    })
                  }
                >
                  {t.endPausedMatch}
                </button>
              ) : null}

              {snapshot.game.stage === "SERIES_OVER" && amHost ? (
                <button
                  type="button"
                  className="button-primary mt-6"
                  onClick={() =>
                    emit("play_again", {
                      roomCode: snapshot.game.roomCode,
                      sessionId,
                    })
                  }
                >
                  {t.playAgain}
                </button>
              ) : null}
            </section>
          </section>
        ) : (
          <section className="panel p-8 text-[--muted]">
            Connecting to roomÃ¢â‚¬Â¦
          </section>
        )}

        {!snapshot ? (
          <div className="modal-backdrop">
            <div
              className="modal-shell modal-sheet"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="modal-close"
                onClick={() => router.push(`/?join=${roomCode}`)}
                aria-label="Close"
              >
                Ãƒâ€”
              </button>
              <p className="eyebrow">
                {language === "fa"
                  ? "Ã™Â¾Ã›Å’Ã™Ë†Ã˜Â³Ã˜ÂªÃ™â€  Ã˜Â¨Ã™â€¡ Ã™â€¦Ã›Å’Ã˜Â²"
                  : "Join a table"}
              </p>
              <h2 className="modal-title">
                {language === "fa"
                  ? "Ã™Â¾Ã›Å’Ã™Ë†Ã˜Â³Ã˜ÂªÃ™â€  Ã˜Â¨Ã™â€¡ Ã™â€¦Ã›Å’Ã˜Â²"
                  : "Join a table"}
              </h2>
              <p className="modal-copy">
                {language === "fa"
                  ? "ÃšÂ©Ã˜Â¯Ã›Å’ Ã˜Â±Ã˜Â§ ÃšÂ©Ã™â€¡ Ã˜Â¯Ã™Ë†Ã˜Â³Ã˜ÂªÃ˜Âª Ã™ÂÃ˜Â±Ã˜Â³Ã˜ÂªÃ˜Â§Ã˜Â¯Ã™â€¡ Ã™Ë†Ã˜Â§Ã˜Â±Ã˜Â¯ ÃšÂ©Ã™â€ ."
                  : "Enter the room code your friend shared."}
              </p>
              <label className="field mt-6">
                <span>{t.roomCodeLabel}</span>
                <input value={roomCode} readOnly />
              </label>
              <label className="field mt-4">
                <span>{t.nameLabel}</span>
                <input
                  autoFocus
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  maxLength={20}
                />
              </label>
              {entryError ? (
                <p className="error-copy mt-3">{entryError}</p>
              ) : null}
              <button
                type="button"
                className="button-primary mt-6 w-full justify-center"
                disabled={joining}
                onClick={() => submitEntry(false)}
              >
                {joining
                  ? language === "fa"
                    ? "Ã˜Â¯Ã˜Â± Ã˜Â­Ã˜Â§Ã™â€ž Ã™Â¾Ã›Å’Ã™Ë†Ã˜Â³Ã˜ÂªÃ™â€ Ã¢â‚¬Â¦"
                    : "JoiningÃ¢â‚¬Â¦"
                  : language === "fa"
                    ? "Ã™Â¾Ã›Å’Ã™Ë†Ã˜Â³Ã˜ÂªÃ™â€  Ã˜Â¨Ã™â€¡ Ã™â€¦Ã›Å’Ã˜Â²"
                    : "Join table"}
              </button>
              {entryCanSpectate ? (
                <button
                  type="button"
                  className="button-secondary mt-3 w-full justify-center"
                  disabled={joining}
                  onClick={() => submitEntry(true)}
                >
                  {t.spectateTable}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {snapshot?.game.stage === "AWAITING_TRUMP" &&
        meSeat === round?.hakemSeat ? (
          <div className="modal-backdrop">
            <div
              className="modal-shell modal-shell-large"
              role="dialog"
              aria-modal="true"
            >
              <p className="eyebrow">{t.chooseHokm}</p>
              <h2 className="modal-title">{t.chooseHokm}</h2>
              <p className="modal-copy">{t.chooseHokmBody}</p>
              <div className="hokm-grid">
                {SUIT_OPTIONS.map((suit) => (
                  <button
                    key={suit}
                    type="button"
                    className={`hokm-choice ${isRedSuit(suit) ? "suit-red" : "suit-dark"}`}
                    onClick={() =>
                      emit("declare_trump", {
                        roomCode: snapshot.game.roomCode,
                        sessionId,
                        suit,
                      })
                    }
                  >
                    <span className="hokm-choice-symbol">
                      {displaySuit(suit)}
                    </span>
                    <span className="hokm-choice-label">
                      {t[suitLabelKey[suit]]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {snapshot && showSurrenderPrompt ? (
          <div className="modal-backdrop">
            <div
              className="modal-shell modal-sheet surrender-modal"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="modal-close"
                onClick={() => setDismissedSurrenderVote(surrenderVoteKey)}
                aria-label="Close"
              >
                ×
              </button>
              <p className="eyebrow">{t.confirmDefeat}</p>
              <h2 className="modal-title">{t.surrenderPromptTitle}</h2>
              <p className="modal-copy">{t.surrenderPromptBody}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setDismissedSurrenderVote(surrenderVoteKey)}
                >
                  {t.keepPlaying}
                </button>
                <button
                  type="button"
                  className="button-secondary surrender-button surrender-button-active"
                  onClick={() => {
                    emit("toggle_surrender", {
                      roomCode: snapshot.game.roomCode,
                      sessionId,
                    });
                    setDismissedSurrenderVote(surrenderVoteKey);
                  }}
                >
                  {t.confirmDefeat}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    </main>
  );
}

export function RoomClient(props: RoomClientProps) {
  return (
    <LanguageProvider>
      <RoomContent {...props} />
    </LanguageProvider>
  );
}
