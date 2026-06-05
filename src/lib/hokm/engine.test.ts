import { describe, expect, it } from "vitest";

import { HokmEngine, shuffleDeck } from "@/lib/hokm/engine";
import type { Card } from "@/lib/types";

const riggedRng = (() => {
  const values = [0.01, 0.99, 0.42, 0.22, 0.73, 0.14, 0.85, 0.38];
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
})();

describe("HokmEngine", () => {
  it("creates a 52-card shuffled deck with unique cards", () => {
    const deck = shuffleDeck(riggedRng);
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.code)).size).toBe(52);
  });

  it("starts with five cards for the Hakem and waits for trump", () => {
    const engine = new HokmEngine(7, 7, () => 0);
    const round = engine.currentRound;

    expect(round?.phase).toBe("AWAITING_TRUMP");
    expect(round?.hands[0]).toHaveLength(5);
    expect(round?.hands[1]).toHaveLength(0);
    expect(round?.hands[2]).toHaveLength(0);
    expect(round?.hands[3]).toHaveLength(0);
  });

  it("finishes dealing once trump is declared", () => {
    const engine = new HokmEngine(7, 7, () => 0);
    engine.declareTrump(0, "spades");
    const round = engine.currentRound;

    expect(round?.phase).toBe("IN_TRICK");
    expect(round?.hands[0]).toHaveLength(13);
    expect(round?.hands[1]).toHaveLength(13);
    expect(round?.hands[2]).toHaveLength(13);
    expect(round?.hands[3]).toHaveLength(13);
  });

  it("rejects an off-suit play when the player can follow", () => {
    const engine = new HokmEngine(7, 7, () => 0);
    engine.declareTrump(0, "spades");
    const round = engine.currentRound!;
    const lead = round.hands[0][0];
    engine.playCard(0, lead.code);

    const eastHand = round.hands[1];
    const ledSuit = lead.suit;
    const follow = eastHand.find((card) => card.suit === ledSuit) as Card;
    const offSuit = eastHand.find((card) => card.suit !== ledSuit) as Card;

    expect(() => engine.playCard(1, offSuit.code)).toThrow(/must follow/i);
    expect(() => engine.playCard(1, follow.code)).not.toThrow();
  });

  it("awards a completed series after the configured number of match wins", () => {
    const engine = new HokmEngine(3, 3, () => 0);

    for (let index = 0; index < 2; index += 1) {
      engine.series.wins.A += 1;
    }
    engine.series.winner = "A";

    expect(engine.series.winner).toBe("A");
    expect(engine.series.wins.A).toBe(2);
    expect(engine.series.bestOf).toBe(3);
  });

  it("resolves trump higher than led suit", () => {
    const engine = new HokmEngine(7, 7, () => 0);
    engine.declareTrump(0, "spades");
    const round = engine.currentRound!;

    round.hands[0] = [{ code: "A-hearts", rank: "A", suit: "hearts" }];
    round.hands[1] = [{ code: "2-hearts", rank: "2", suit: "hearts" }];
    round.hands[2] = [{ code: "3-spades", rank: "3", suit: "spades" }];
    round.hands[3] = [{ code: "K-hearts", rank: "K", suit: "hearts" }];
    round.trick.currentTurn = 0;

    engine.playCard(0, "A-hearts");
    engine.playCard(1, "2-hearts");
    engine.playCard(2, "3-spades");
    engine.playCard(3, "K-hearts");

    expect(round.trickCounts.A).toBe(1);
  });
});
