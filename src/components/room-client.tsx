"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { getSocket } from "@/lib/client/socket";
import {
  getSessionId,
  getStoredName,
  setStoredName,
} from "@/lib/client/session";
import {
  activeSeats,
  displaySuit,
  isRedSuit,
  sortCardsBySuitAndRank,
  teamOf,
} from "@/lib/hokm/engine";
import {
  cn,
  copyText,
  formatCountdown,
  formatLocalizedNumber,
  localizeDigits,
} from "@/lib/utils";
import type {
  Card,
  MatchTarget,
  PlayerMode,
  RoomSnapshot,
  Seat,
  Suit,
  Team,
} from "@/lib/types";

const TARGETS: MatchTarget[] = [3, 5, 7];
const SUIT_OPTIONS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

const suitLabelKey: Record<Suit, "spades" | "hearts" | "diamonds" | "clubs"> = {
  spades: "spades",
  hearts: "hearts",
  diamonds: "diamonds",
  clubs: "clubs",
};

const displaySeatSlot = (mode: PlayerMode, seat: Seat): Seat => {
  if (mode === 2) {
    return (seat === 0 ? 0 : 2) as Seat;
  }
  return seat;
};

const seatClassFor = (mode: PlayerMode, seat: Seat) => {
  const slot = displaySeatSlot(mode, seat);
  return {
    0: "seat south",
    1: "seat east",
    2: "seat north",
    3: "seat west",
  }[slot];
};

type RoomClientProps = {
  roomCode: string;
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
  const [entryCanSpectate, setEntryCanSpectate] = useState(false);
  const [sortRequested, setSortRequested] = useState(false);
  const [selectedDiscards, setSelectedDiscards] = useState<string[]>([]);
  const [dismissedSurrenderVote, setDismissedSurrenderVote] = useState<string | null>(null);
  const sessionId = useMemo(() => getSessionId(), []);
  const latestStage = useRef<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const onState = (nextSnapshot: RoomSnapshot) => {
      if (latestStage.current !== nextSnapshot.game.stage) {
        setSelectedDiscards([]);
      }
      latestStage.current = nextSnapshot.game.stage;
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

  const emit = (event: string, payload: object) => getSocket().emit(event, payload);

  const meSeat = snapshot?.player.seat ?? null;
  const isSpectator = snapshot?.player.isSpectator ?? false;
  const mode = snapshot?.game.mode ?? 4;
  const activeSeatIds = activeSeats(mode);
  const visibleSeats = activeSeatIds
    .map((seat) => snapshot?.game.seats[seat] ?? null)
    .filter((seat): seat is NonNullable<typeof seat> => Boolean(seat));
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
  const seatLimit = activeSeatIds.length;
  const canStart =
    snapshot?.game.stage === "LOBBY" && snapshot.room.seatCount === seatLimit && amHost;
  const currentTurnSeat = round?.trick.currentTurn ?? null;
  const currentTurnPlayer =
    currentTurnSeat !== null ? snapshot?.game.seats[currentTurnSeat]?.displayName ?? "Player" : null;
  const myTeam: Team | null = meSeat !== null ? teamOf(meSeat, mode) : null;
  const myTeamVotes = myTeam ? snapshot?.game.surrender?.votes[myTeam] ?? [] : [];
  const iDeclaredSurrender = meSeat !== null && myTeamVotes.includes(meSeat);
  const teammateVoteActive =
    mode === 4 &&
    meSeat !== null &&
    myTeamVotes.length === 1 &&
    !myTeamVotes.includes(meSeat);
  const surrenderVoteKey = `${myTeamVotes.join("-")}:${round?.trickNumber ?? 0}:${snapshot?.game.stage ?? ""}`;
  const showSurrenderPrompt =
    teammateVoteActive &&
    snapshot?.game.stage !== "SERIES_OVER" &&
    snapshot?.game.stage !== "LOBBY" &&
    dismissedSurrenderVote !== surrenderVoteKey;
  const isMyPlayTurn =
    snapshot?.game.stage === "IN_TRICK" &&
    round?.trick.currentTurn === meSeat &&
    !snapshot.game.pause;
  const isMyRefillTurn =
    snapshot?.game.stage === "REFILL" &&
    round?.refillTurnSeat === meSeat &&
    !snapshot.game.pause;
  const myRefillPreview =
    mode === 2 && meSeat !== null && round?.refillPreview?.seat === meSeat
      ? round.refillPreview
      : null;
  const isDiscardStage =
    snapshot?.game.stage === "HAKEM_DISCARD" || snapshot?.game.stage === "OPPONENT_DISCARD";
  const discardNeed = snapshot?.game.stage === "HAKEM_DISCARD" ? 3 : snapshot?.game.stage === "OPPONENT_DISCARD" ? 2 : 0;
  const activeDiscardSeat =
    snapshot?.game.stage === "HAKEM_DISCARD"
      ? round?.hakemSeat ?? null
      : snapshot?.game.stage === "OPPONENT_DISCARD" && round && mode === 2
        ? ((round.hakemSeat === 0 ? 1 : 0) as Seat)
        : null;
  const isMyDiscardTurn = activeDiscardSeat !== null && meSeat === activeDiscardSeat;
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
      ? snapshot.room.seatCount < seatLimit
        ? mode === 2
          ? t.waitingForTwoPlayers
          : t.waitingForPlayers
        : amHost
          ? t.startSeries
          : t.waitingForHost
      : t.startSeries;
  const followSuitText =
    isMyPlayTurn && round?.trick.ledSuit ? `${t.followSuitPrompt} ${displaySuit(round.trick.ledSuit)}` : null;
  const formatNumber = (value: number) => formatLocalizedNumber(value, language);
  const formatText = (value: string) => localizeDigits(value, language);

  const copyShareLink = async () => {
    if (!joinUrl) {
      return;
    }
    await copyText(joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const renderCardFace = (card: Card, compact = false) => {
    const suitClass = isRedSuit(card.suit) ? "suit-red" : "suit-dark";
    const rank = formatText(card.rank);

    return (
      <>
        <span className={cn("card-corner-mini card-top-left", suitClass)}>
          <span className="card-rank-mini">{rank}</span>
          <span className="card-suit-mini">{displaySuit(card.suit)}</span>
        </span>
        <span className={cn("card-corner-mini card-bottom-right", suitClass)}>
          <span className="card-rank-mini">{rank}</span>
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

  const toggleDiscard = (cardCode: string) => {
    setSelectedDiscards((current) =>
      current.includes(cardCode)
        ? current.filter((code) => code !== cardCode)
        : current.length >= discardNeed
          ? current
          : [...current, cardCode],
    );
  };

  const tableStatus = snapshot?.game.pause
    ? `${t.waitingReconnect}: ${snapshot.game.pause.disconnectedName} · ${formatCountdown(snapshot.game.pause.pausedUntil)}`
    : followSuitText ??
      (snapshot?.game.stage === "DECLARE_TRUMP" && meSeat !== round?.hakemSeat
        ? t.waitingForHakem
        : snapshot?.game.stage === "REFILL" && !isMyRefillTurn
          ? t.opponentDrawing
          : snapshot?.game.lastMessage
            ? formatText(snapshot.game.lastMessage)
            : "Ready");

  return (
    <main className="page-shell min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="panel flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <Link href="/" className="brand-mark">
              {t.appName}
            </Link>
            <div className="text-sm text-[--muted]">
              {language === "fa" ? "اتاق" : "ROOM"}
              {" - "}
              <span className="mono-label text-[--ivory]">
                {formatText(snapshot?.game.roomCode ?? roomCode)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="button-secondary"
              onClick={() => setLanguage(language === "en" ? "fa" : "en")}
            >
              {language === "en" ? "فارسی" : "EN"}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                getSocket().emit("leave_room", { roomCode, sessionId });
                router.push("/");
              }}
            >
              {language === "fa" ? "خروج" : "Leave"}
            </button>
          </div>
        </header>

        {snapshot ? (
          <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-6">
              <div className="panel p-6">
                <p className="mono-label">{t.lobby}</p>
                <div className="mt-4 space-y-3 text-sm text-[--muted]">
                  <p>
                    {t.players}: <span className={cn(language === "fa" && "fa-number-display")}>{formatNumber(mode)}</span>
                  </p>
                  <p>
                    {t.target}: <span className={cn(language === "fa" && "fa-number-display")}>{formatNumber(snapshot.game.pointTarget)}</span>
                  </p>
                  {round && mode === 2 ? (
                    <p>
                      {t.stock}: <span className={cn(language === "fa" && "fa-number-display")}>{formatNumber(round.stockCount)}</span>
                    </p>
                  ) : null}
                </div>
                <div className="mt-5">
                  <p className="mono-label">{t.shareLink}</p>
                  <button
                    type="button"
                    className="button-secondary share-link-button mt-3 w-full"
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
                            snapshot.game.pointTarget === value ? "chip active" : "chip"
                          }
                          onClick={() =>
                            emit("set_match_target", {
                              roomCode: snapshot.game.roomCode,
                              sessionId,
                              pointTarget: value,
                            })
                          }
                        >
                          <span className={cn(language === "fa" && "fa-number-display")}>{formatNumber(value)}</span>
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
                {snapshot.game.stage === "SERIES_OVER" && snapshot.game.shareResultId ? (
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
                      <span className={cn(language === "fa" && "fa-number-display")}>{mode === 2 ? t.playerA : "Team A"}</span>
                    </p>
                    <p className="mt-2 text-3xl text-[--gold]">
                      <span className={cn(language === "fa" && "fa-number-display")}>{formatNumber(snapshot.game.series?.wins.A ?? 0)}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[--muted]">
                      <span className={cn(language === "fa" && "fa-number-display")}>{mode === 2 ? t.playerB : "Team B"}</span>
                    </p>
                    <p className="mt-2 text-3xl text-[--team-b]">
                      <span className={cn(language === "fa" && "fa-number-display")}>{formatNumber(snapshot.game.series?.wins.B ?? 0)}</span>
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
                        <span className={cn(language === "fa" && "fa-number-display")}>{mode === 2 ? t.playerA : "Team A"}</span>
                      </p>
                      <p className="mt-2 text-3xl text-[--gold]">
                        <span className={cn(language === "fa" && "fa-number-display")}>{formatNumber(round.trickCounts.A)}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[--muted]">
                        <span className={cn(language === "fa" && "fa-number-display")}>{mode === 2 ? t.playerB : "Team B"}</span>
                      </p>
                      <p className="mt-2 text-3xl text-[--team-b]">
                        <span className={cn(language === "fa" && "fa-number-display")}>{formatNumber(round.trickCounts.B)}</span>
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
                        <span key={spectator.sessionId} className="spectator-pill">
                          {spectator.displayName}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div />
                )}
                <div className="text-center">
                  <p className="mono-label">{t.hokm}</p>
                  <div
                    className={cn(
                      "hokm-display hokm-display-pill mt-2",
                      round?.trumpSuit
                        ? isRedSuit(round.trumpSuit)
                          ? "hokm-display-red"
                          : "hokm-display-dark"
                        : "bg-[rgba(255,255,255,0.04)]",
                    )}
                  >
                    <span
                      className={cn(
                        "hokm-display-symbol",
                        round?.trumpSuit
                          ? isRedSuit(round.trumpSuit)
                            ? "suit-red"
                            : "suit-dark"
                          : "text-[--gold]",
                      )}
                    >
                      {round?.trumpSuit ? displaySuit(round.trumpSuit) : "?"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={cn("felt-board mt-6", mode === 2 && "felt-board-two")}>
                {visibleSeats.map((seat) => {
                  const handCount = round?.handCounts[seat.seat] ?? 0;
                  const seatLabel =
                    mode === 2
                      ? seat.seat === meSeat
                        ? t.you
                        : t.opponent
                      : `Team ${teamOf(seat.seat, mode)}`;

                  return (
                    <div
                      key={seat.sessionId}
                      className={cn(
                        seatClassFor(mode, seat.seat),
                        seat.seat === meSeat && "seat-self",
                        seat.seat === currentTurnSeat &&
                          (snapshot.game.stage === "IN_TRICK" ||
                            snapshot.game.stage === "DECLARE_TRUMP" ||
                            snapshot.game.stage === "REFILL") &&
                          "seat-active-turn",
                      )}
                    >
                      <div className="seat-profile">
                        {seat.connected ? (
                          <div className="avatar-ring">{seat.displayName.slice(0, 1)}</div>
                        ) : (
                          <div className="seat-reconnecting" aria-label={t.reconnecting}>
                            <span className="seat-reconnecting-ring" />
                            <span className="seat-reconnecting-dot" />
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-lg text-[--ivory]">
                        {mode === 2 && seat.seat === meSeat ? t.you : seat.displayName}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.22em] text-[--muted]">
                        {seatLabel}
                      </div>
                      <div className="mt-1 text-xs text-[--muted]">
                        <span className={cn(language === "fa" && "fa-number-display")}>{formatNumber(handCount)}</span>{" "}
                        {language === "fa" ? "کارت" : "cards"}
                      </div>
                      {round?.hakemSeat === seat.seat ? <span className="seat-badge">{t.hakem}</span> : null}
                    </div>
                  );
                })}

                <div className={cn("center-medallion", mode === 2 && "center-medallion-two")}>
                  {round?.trick.cards.map(({ seat, card }) => (
                    <div
                      key={`${seat}-${card.code}`}
                      className={cn(
                        "played-card",
                        `played-${displaySeatSlot(mode, seat)}`,
                        isRedSuit(card.suit) ? "suit-red" : "suit-dark",
                      )}
                    >
                      {renderCardFace(card, true)}
                    </div>
                  ))}
                  <div className={statusTone}>
                    {statusHeading ? <strong>{statusHeading}</strong> : null}
                    <span>{tableStatus}</span>
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
                      {snapshot.game.stage !== "LOBBY" &&
                      snapshot.game.stage !== "SERIES_OVER" &&
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
                          {language === "fa" ? "اعلام شکست" : "Declare defeat"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {isDiscardStage && isMyDiscardTurn ? (
                    <div className="panel mt-4 p-4 text-sm text-[--muted]">
                      {t.discardCards}: <span className={cn(language === "fa" && "fa-number-display")}>{formatNumber(discardNeed)}</span> (<span className={cn(language === "fa" && "fa-number-display")}>{formatNumber(selectedDiscards.length)}</span> {language === "fa" ? "انتخاب‌شده" : "selected"})
                    </div>
                  ) : null}

                  {snapshot.game.stage === "DECLARE_TRUMP" && meSeat === round?.hakemSeat ? (
                    <div className="panel mt-4 p-5">
                      <p className="mono-label">{t.chooseHokm}</p>
                      <p className="mt-2 text-sm text-[--muted]">{t.chooseHokmBody}</p>
                      <div className="hokm-grid mt-4">
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
                            <span className="hokm-choice-symbol">{displaySuit(suit)}</span>
                            <span className="hokm-choice-label">{t[suitLabelKey[suit]]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {snapshot.game.stage === "REFILL" && isMyRefillTurn && myRefillPreview?.decision === "pending" ? (
                    <div className="panel mt-4 flex flex-col items-center gap-4 p-5 text-center">
                      <p className="mono-label">{t.yourTurnToDraw}</p>
                      <p className="text-sm text-[--muted]">{t.firstCard}</p>
                      <div
                        className={cn(
                          "played-card static-card",
                          isRedSuit(myRefillPreview.firstCard.suit) ? "suit-red" : "suit-dark",
                        )}
                      >
                        {renderCardFace(myRefillPreview.firstCard)}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="button-primary"
                          onClick={() =>
                            emit("resolve_refill", {
                              roomCode: snapshot.game.roomCode,
                              sessionId,
                              action: "keep",
                            })
                          }
                        >
                          {t.keepFirstCard}
                        </button>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() =>
                            emit("resolve_refill", {
                              roomCode: snapshot.game.roomCode,
                              sessionId,
                              action: "discard",
                            })
                          }
                        >
                          {t.discardFirstCard}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {myRefillPreview &&
                  myRefillPreview.decision !== "pending" &&
                  myRefillPreview.secondCard ? (
                    <div className="panel mt-4 flex flex-col gap-4 p-5 text-center">
                      <p className="mono-label">{t.yourTurnToDraw}</p>
                      <div className="flex flex-wrap justify-center gap-4">
                        {[
                          {
                            card: myRefillPreview.firstCard,
                            label: t.firstCard,
                          },
                          {
                            card: myRefillPreview.secondCard,
                            label: t.secondCard,
                          },
                        ].map(({ card, label }) => {
                          const kept = myRefillPreview.keptCardCode === card.code;
                          return (
                            <div key={card.code} className="flex flex-col items-center gap-2">
                              <p className="text-sm text-[--muted]">{label}</p>
                              <div
                                className={cn(
                                  "played-card static-card",
                                  isRedSuit(card.suit) ? "suit-red" : "suit-dark",
                                )}
                              >
                                {renderCardFace(card)}
                              </div>
                              <p className="text-sm text-[--muted]">
                                {kept ? t.kept : t.discarded}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="hand-zone mt-4">
                    {!isMyPlayTurn && round && currentTurnPlayer && snapshot.game.stage === "IN_TRICK" ? (
                      <div className="turn-overlay">
                        <strong>
                          {language === "fa" ? `نوبت ${currentTurnPlayer} است` : `${currentTurnPlayer} is up`}
                        </strong>
                        <span>{followSuitText ?? t.waitingForOpponent}</span>
                      </div>
                    ) : null}
                    <div className="hand-row">
                      {displayHand.map((card) => {
                        const selected = selectedDiscards.includes(card.code);
                        const interactive =
                          (snapshot.game.stage === "IN_TRICK" && isMyPlayTurn) ||
                          (isDiscardStage && isMyDiscardTurn);

                        return (
                          <button
                            key={card.code}
                            type="button"
                            className={cn(
                              "hand-card",
                              isRedSuit(card.suit) ? "suit-red" : "suit-dark",
                              selected && "hand-card-selected",
                            )}
                            disabled={!interactive}
                            onClick={() =>
                              snapshot.game.stage === "IN_TRICK"
                                ? emit("play_card", {
                                    roomCode: snapshot.game.roomCode,
                                    sessionId,
                                    cardCode: card.code,
                                  })
                                : toggleDiscard(card.code)
                            }
                          >
                            {renderCardFace(card)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {isDiscardStage && isMyDiscardTurn ? (
                    <button
                      type="button"
                      className="button-primary mt-5"
                      disabled={selectedDiscards.length !== discardNeed}
                      onClick={() =>
                        emit("discard_cards", {
                          roomCode: snapshot.game.roomCode,
                          sessionId,
                          cardCodes: selectedDiscards,
                        })
                      }
                    >
                      {t.discardCards}
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="panel mt-6 p-5 text-sm text-[--muted]">{t.spectatorView}</div>
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
          <section className="panel p-8 text-[--muted]">Connecting to room...</section>
        )}

        {!snapshot ? (
          <div className="modal-backdrop">
            <div className="modal-shell modal-sheet" role="dialog" aria-modal="true">
              <button
                type="button"
                className="modal-close"
                onClick={() => router.push(`/?join=${roomCode}`)}
                aria-label="Close"
              >
                ×
              </button>
              <p className="eyebrow">{language === "fa" ? "پیوستن به میز" : "Join a table"}</p>
              <h2 className="modal-title">{language === "fa" ? "پیوستن به میز" : "Join a table"}</h2>
              <p className="modal-copy">
                {language === "fa"
                  ? "کدی را که دوست‌تان فرستاده وارد کنید."
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
              {entryError ? <p className="error-copy mt-3">{formatText(entryError)}</p> : null}
              <button
                type="button"
                className="button-primary mt-6 w-full justify-center"
                disabled={joining}
                onClick={() => submitEntry(false)}
              >
                {joining ? (language === "fa" ? "در حال پیوستن..." : "Joining...") : language === "fa" ? "پیوستن به میز" : "Join table"}
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

        {snapshot && showSurrenderPrompt ? (
          <div className="modal-backdrop">
            <div className="modal-shell modal-sheet surrender-modal" role="dialog" aria-modal="true">
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

        {toast ? <div className="toast">{formatText(toast)}</div> : null}
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
