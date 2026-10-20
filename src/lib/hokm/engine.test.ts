import { describe, expect, it } from "vitest";

import { HokmEngine, shuffleDeck } from "@/lib/hokm/engine";
import type { Card, Seat } from "@/lib/types";

const riggedRng = (() => {
  const values = [0.01, 0.99, 0.42, 0.22, 0.73, 0.14, 0.85, 0.38];
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
})();

const orderedRng = () => 0.999;

describe("HokmEngine", () => {
  it("creates a 52-card shuffled deck with unique cards", () => {
    const deck = shuffleDeck(riggedRng);
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.code)).size).toBe(52);
  });

  it("starts a two-player hand by selecting a Hakem and dealing 5/5", () => {
    const engine = new HokmEngine(7, 7, 2, orderedRng);
    const round = engine.currentRound!;

    expect(round.mode).toBe(2);
    expect(round.hakemSeat).toBe(0);
    expect(round.phase).toBe("DECLARE_TRUMP");
    expect(round.hands[0]).toHaveLength(5);
    expect(round.hands[1]).toHaveLength(5);
    expect(round.stock).toHaveLength(42);
  });

  it("rejects invalid discard counts in two-player mode", () => {
    const engine = new HokmEngine(7, 7, 2, orderedRng);
    engine.declareTrump(0, "spades");

    expect(() => engine.discardCards(0, [engine.currentRound!.hands[0][0].code])).toThrow(
      /exactly 3/i,
    );
  });

  it("keeps the refill invariant at +1 card per turn", () => {
    const engine = new HokmEngine(7, 7, 2, orderedRng);
    engine.declareTrump(0, "spades");

    const round = engine.currentRound!;
    engine.discardCards(0, round.hands[0].slice(0, 3).map((card) => card.code));
    engine.discardCards(1, round.hands[1].slice(0, 2).map((card) => card.code));

    const hakemBefore = round.hands[0].length;
    const opponentBefore = round.hands[1].length;
    engine.resolveRefill(0, "discard");
    expect(round.hands[0]).toHaveLength(hakemBefore + 1);

    engine.resolveRefill(1, "keep");
    expect(round.hands[1]).toHaveLength(opponentBefore + 1);
  });

  it("reveals the second card and discards it when the first card is kept", () => {
    const engine = new HokmEngine(7, 7, 2, orderedRng);
    engine.declareTrump(0, "spades");

    const round = engine.currentRound!;
    engine.discardCards(0, round.hands[0].slice(0, 3).map((card) => card.code));
    engine.discardCards(1, round.hands[1].slice(0, 2).map((card) => card.code));

    const firstCard = round.drawnCard!;
    engine.resolveRefill(0, "keep");

    expect(round.refillPreview?.decision).toBe("keep_first");
    expect(round.refillPreview?.firstCard.code).toBe(firstCard.code);
    expect(round.refillPreview?.secondCard).not.toBeNull();
    expect(round.refillPreview?.keptCardCode).toBe(firstCard.code);
  });

  it("reveals the second card and keeps it when the first card is discarded", () => {
    const engine = new HokmEngine(7, 7, 2, orderedRng);
    engine.declareTrump(0, "spades");

    const round = engine.currentRound!;
    engine.discardCards(0, round.hands[0].slice(0, 3).map((card) => card.code));
    engine.discardCards(1, round.hands[1].slice(0, 2).map((card) => card.code));

    const firstCard = round.drawnCard!;
    engine.resolveRefill(0, "discard");

    expect(round.refillPreview?.decision).toBe("keep_second");
    expect(round.refillPreview?.firstCard.code).toBe(firstCard.code);
    expect(round.refillPreview?.secondCard).not.toBeNull();
    expect(round.refillPreview?.keptCardCode).toBe(round.refillPreview?.secondCard?.code);
  });

  it("resolves trump higher than led suit in two-player play", () => {
    const engine = new HokmEngine(7, 7, 2, orderedRng);
    const round = engine.currentRound!;
    round.phase = "IN_TRICK";
    round.trumpSuit = "spades";
    round.hands[0] = [{ code: "A-hearts", rank: "A", suit: "hearts" }];
    round.hands[1] = [{ code: "3-spades", rank: "3", suit: "spades" }];
    round.trick.currentTurn = 0;

    engine.playCard(0, "A-hearts");
    engine.playCard(1, "3-spades");

    expect(round.trickCounts.B).toBe(1);
  });

  it("awards one point on a normal 7th trick win", () => {
    const engine = new HokmEngine(7, 7, 2, orderedRng);
    const round = engine.currentRound!;
    round.phase = "IN_TRICK";
    round.trumpSuit = "spades";
    round.trickCounts.A = 6;
    round.trickCounts.B = 2;
    round.hands[0] = [{ code: "A-hearts", rank: "A", suit: "hearts" }];
    round.hands[1] = [{ code: "K-hearts", rank: "K", suit: "hearts" }];
    round.trick.currentTurn = 0;

    const transition = engine.playCard(0, "A-hearts");
    expect(transition.kind).toBe("none");
    const result = engine.playCard(1, "K-hearts");

    expect(result.kind).toBe("round_over");
    expect(round.roundWinner).toBe("A");
    expect(round.awardedPoints).toBe(1);
  });

  it("awards a 2-point Kot when the Hakem wins 7-0", () => {
    const engine = new HokmEngine(7, 7, 2, orderedRng);
    const round = engine.currentRound!;
    round.phase = "IN_TRICK";
    round.trumpSuit = "spades";
    round.hakemSeat = 0;
    round.trickCounts.A = 6;
    round.trickCounts.B = 0;
    round.hands[0] = [{ code: "A-hearts", rank: "A", suit: "hearts" }];
    round.hands[1] = [{ code: "K-hearts", rank: "K", suit: "hearts" }];
    round.trick.currentTurn = 0;

    engine.playCard(0, "A-hearts");
    engine.playCard(1, "K-hearts");

    expect(round.awardedPoints).toBe(2);
  });

  it("awards a 3-point Kot when the non-Hakem wins 7-0 and rotates Hakem", () => {
    const engine = new HokmEngine(7, 7, 2, orderedRng);
    const round = engine.currentRound!;
    round.phase = "IN_TRICK";
    round.trumpSuit = "spades";
    round.hakemSeat = 0;
    round.trickCounts.A = 0;
    round.trickCounts.B = 6;
    round.hands[0] = [{ code: "2-hearts", rank: "2", suit: "hearts" }];
    round.hands[1] = [{ code: "A-hearts", rank: "A", suit: "hearts" }];
    round.trick.currentTurn = 0;

    engine.playCard(0, "2-hearts");
    const result = engine.playCard(1, "A-hearts");

    expect(result.kind).toBe("round_over");
    expect(round.roundWinner).toBe("B");
    expect(round.awardedPoints).toBe(3);

    engine.startNextRound();
    expect(engine.currentRound?.hakemSeat).toBe(1);
  });

  it("still enforces follow suit in four-player mode", () => {
    const engine = new HokmEngine(7, 7, orderedRng);
    engine.declareTrump(engine.currentRound!.hakemSeat, "spades");
    const round = engine.currentRound!;
    const leadSeat = round.hakemSeat;
    const lead = round.hands[leadSeat][0];
    engine.playCard(leadSeat, lead.code);

    const nextSeat = ((leadSeat + 1) % 4) as Seat;
    const nextHand = round.hands[nextSeat];
    const follow = nextHand.find((card) => card.suit === lead.suit) as Card;
    const offSuit = nextHand.find((card) => card.suit !== lead.suit) as Card;

    expect(() => engine.playCard(nextSeat, offSuit.code)).toThrow(/must follow/i);
    expect(() => engine.playCard(nextSeat, follow.code)).not.toThrow();
  });
});
