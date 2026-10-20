import {
  MATCH_TARGETS,
  PLAYER_MODES,
  RANKS,
  SERIES_TARGETS,
  SUITS,
  type Card,
  type MatchState,
  type MatchTarget,
  type PlayedCard,
  type PlayerMode,
  type Rank,
  type RoundState,
  type Seat,
  type SeriesState,
  type SeriesTarget,
  type Suit,
  type Team,
  type TrickState,
} from "@/lib/types";

const RANK_VALUE: Record<Rank, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  "10": 10,
  "9": 9,
  "8": 8,
  "7": 7,
  "6": 6,
  "5": 5,
  "4": 4,
  "3": 3,
  "2": 2,
};

export type HokmTransition =
  | { kind: "none"; message?: string }
  | { kind: "round_over"; message: string }
  | { kind: "match_over"; message: string }
  | { kind: "series_over"; message: string };

const TWO_PLAYER_SEATS = [0, 1] as const;
const FOUR_PLAYER_SEATS = [0, 1, 2, 3] as const;

const createDeck = (): Card[] =>
  SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      suit,
      rank,
      code: `${rank}-${suit}`,
    })),
  );

const randomValue = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

export const shuffleDeck = (rng: () => number = randomValue): Card[] => {
  const deck = createDeck();
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
};

const emptyHands = (): Record<Seat, Card[]> => ({
  0: [],
  1: [],
  2: [],
  3: [],
});

const emptyScores = (): Record<Team, number> => ({ A: 0, B: 0 });

const activeSeatsForMode = (mode: PlayerMode) =>
  mode === 2 ? [...TWO_PLAYER_SEATS] : [...FOUR_PLAYER_SEATS];

export const activeSeats = activeSeatsForMode;

const createTrick = (leader: Seat): TrickState => ({
  leader,
  currentTurn: leader,
  ledSuit: null,
  cards: [],
  winner: null,
});

export const sortCardsBySuitAndRank = (hand: Card[]) =>
  [...hand].sort((left, right) => {
    const suitDelta = SUITS.indexOf(left.suit) - SUITS.indexOf(right.suit);
    if (suitDelta !== 0) {
      return suitDelta;
    }
    return RANK_VALUE[right.rank] - RANK_VALUE[left.rank];
  });

const nextSeatIndex = (mode: PlayerMode, seat: Seat) => {
  const seats = activeSeatsForMode(mode);
  const index = seats.indexOf(seat);
  if (index === -1) {
    throw new Error("Seat is not active in this mode.");
  }
  return (index + 1) % seats.length;
};

export const nextSeat = (seat: Seat, mode: PlayerMode = 4): Seat =>
  activeSeatsForMode(mode)[nextSeatIndex(mode, seat)] as Seat;

export const previousSeat = (seat: Seat, mode: PlayerMode = 4): Seat => {
  const seats = activeSeatsForMode(mode);
  const index = seats.indexOf(seat);
  if (index === -1) {
    throw new Error("Seat is not active in this mode.");
  }
  return seats[(index + seats.length - 1) % seats.length] as Seat;
};

export const opposingSeat = (seat: Seat): Seat => {
  if (seat !== 0 && seat !== 1) {
    throw new Error("Two-player opposing seat lookup only supports seats 0 and 1.");
  }
  return (seat === 0 ? 1 : 0) as Seat;
};

export const teamOf = (seat: Seat, mode: PlayerMode = 4): Team => {
  if (mode === 2) {
    return seat === 0 ? "A" : "B";
  }
  return seat % 2 === 0 ? "A" : "B";
};

const resolveTrickWinner = (cards: PlayedCard[], trumpSuit: Suit, ledSuit: Suit): Seat =>
  cards.reduce((best, current) => {
    const bestTrump = best.card.suit === trumpSuit;
    const currentTrump = current.card.suit === trumpSuit;
    if (currentTrump && !bestTrump) {
      return current;
    }
    if (!currentTrump && bestTrump) {
      return best;
    }

    const bestLed = best.card.suit === ledSuit;
    const currentLed = current.card.suit === ledSuit;
    if (currentLed && !bestLed) {
      return current;
    }
    if (!currentLed && bestLed) {
      return best;
    }

    return RANK_VALUE[current.card.rank] > RANK_VALUE[best.card.rank] ? current : best;
  }).seat;

const chooseHakemForTwoPlayers = (rng: () => number): Seat => {
  const deck = shuffleDeck(rng);
  let cursor = 0;
  let seat: Seat = 0;
  while (cursor < deck.length) {
    if (deck[cursor].rank === "A") {
      return seat;
    }
    cursor += 1;
    seat = nextSeat(seat, 2);
  }
  return 0;
};

const dealInitialRound = (mode: PlayerMode, hakemSeat: Seat, deck: Card[]): RoundState => {
  const hands = emptyHands();

  if (mode === 4) {
    hands[hakemSeat] = deck.splice(0, 5);
  } else {
    const opponentSeat = opposingSeat(hakemSeat);
    hands[hakemSeat] = deck.splice(0, 5);
    hands[opponentSeat] = deck.splice(0, 5);
  }

  return {
    mode,
    hakemSeat,
    dealerSeat: previousSeat(hakemSeat, mode),
    trumpSuit: null,
    phase: "DECLARE_TRUMP",
    hands,
    stock: deck.splice(0),
    deadPile: [],
    drawnCard: null,
    refillTurnSeat: null,
    refillPreview: null,
    trickCounts: emptyScores(),
    trickNumber: 1,
    trick: createTrick(hakemSeat),
    roundWinner: null,
    awardedPoints: null,
    summary: mode === 2 ? `${labelForSeat(hakemSeat, 2)} became Hakem.` : null,
  };
};

const completeDeal = (round: RoundState) => {
  let seatCursor: Seat = round.hakemSeat;
  while (round.stock.length > 0) {
    if (round.hands[seatCursor].length < 13) {
      round.hands[seatCursor].push(round.stock.shift() as Card);
    }
    seatCursor = nextSeat(seatCursor, round.mode);
  }
};

const createMatch = (
  mode: PlayerMode,
  pointTarget: MatchTarget,
  hakemSeat: Seat,
  deck: Card[],
): MatchState => ({
  mode,
  pointTarget,
  points: emptyScores(),
  roundNumber: 1,
  round: dealInitialRound(mode, hakemSeat, deck),
  winner: null,
  summary: null,
});

const refillGoalReached = (round: RoundState, seat: Seat) => round.hands[seat].length >= 13;

const ensureStock = (round: RoundState, rng: () => number) => {
  if (round.stock.length > 0) {
    return;
  }
  if (round.deadPile.length === 0) {
    throw new Error("No cards remain in the stock.");
  }
  round.stock = shuffleSpecificDeck(round.deadPile, rng);
  round.deadPile = [];
};

const shuffleSpecificDeck = (cards: Card[], rng: () => number) => {
  const deck = [...cards];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
};

const drawForRefillTurn = (round: RoundState, seat: Seat, rng: () => number) => {
  ensureStock(round, rng);
  round.drawnCard = round.stock.shift() as Card;
  round.refillTurnSeat = seat;
};

const findNextRefillSeat = (round: RoundState, afterSeat: Seat): Seat | null => {
  const seats = activeSeatsForMode(2);
  for (let offset = 1; offset <= seats.length; offset += 1) {
    const candidate = seats[(seats.indexOf(afterSeat) + offset) % seats.length] as Seat;
    if (!refillGoalReached(round, candidate)) {
      return candidate;
    }
  }
  return null;
};

const startRefillPhase = (round: RoundState, rng: () => number) => {
  round.phase = "REFILL";
  round.refillPreview = null;
  drawForRefillTurn(round, round.hakemSeat, rng);
  round.summary = `${labelForSeat(round.hakemSeat, 2)} is drawing.`;
};

const finalizeRefillIfComplete = (round: RoundState, rng: () => number) => {
  const next = round.refillTurnSeat !== null ? findNextRefillSeat(round, round.refillTurnSeat) : null;
  if (next === null) {
    round.phase = "IN_TRICK";
    round.refillTurnSeat = null;
    round.drawnCard = null;
    round.summary = `${labelForSeat(round.hakemSeat, 2)} leads the first trick.`;
    return;
  }
  drawForRefillTurn(round, next, rng);
  round.summary = `${labelForSeat(next, 2)} is drawing.`;
};

export class HokmEngine {
  private readonly rng: () => number;

  private readonly mode: PlayerMode;

  private nextHakemSeat: Seat = 0;

  public readonly series: SeriesState;

  constructor(
    pointTarget: MatchTarget,
    seriesTarget: SeriesTarget = 7,
    modeOrRng: PlayerMode | (() => number) = 4,
    rng: () => number = randomValue,
  ) {
    if (!MATCH_TARGETS.includes(pointTarget)) {
      throw new Error("Invalid match target");
    }
    if (!SERIES_TARGETS.includes(seriesTarget)) {
      throw new Error("Invalid series target");
    }
    const mode = typeof modeOrRng === "function" ? 4 : modeOrRng;
    const resolvedRng = typeof modeOrRng === "function" ? modeOrRng : rng;

    if (!PLAYER_MODES.includes(mode)) {
      throw new Error("Invalid player mode");
    }

    this.rng = resolvedRng;
    this.mode = mode;
    this.nextHakemSeat =
      mode === 2
        ? chooseHakemForTwoPlayers(this.rng)
        : (Math.floor(this.rng() * activeSeatsForMode(4).length) as Seat);

    this.series = {
      mode,
      bestOf: seriesTarget,
      wins: emptyScores(),
      matchNumber: 1,
      currentMatch: null,
      winner: null,
      summary: null,
    };
    this.startNextMatch(pointTarget);
  }

  get currentMatch() {
    return this.series.currentMatch;
  }

  get currentRound() {
    return this.series.currentMatch?.round ?? null;
  }

  declareTrump(seat: Seat, suit: Suit): HokmTransition {
    const round = this.requireRound();
    if (round.phase !== "DECLARE_TRUMP") {
      throw new Error("Trump cannot be declared right now.");
    }
    if (round.hakemSeat !== seat) {
      throw new Error("Only the Hakem can declare trump.");
    }

    round.trumpSuit = suit;
    if (this.mode === 4) {
      completeDeal(round);
      round.phase = "IN_TRICK";
    } else {
      round.phase = "HAKEM_DISCARD";
    }
    round.summary = `${labelForSeat(seat, this.mode)} declared ${displaySuit(suit)} as Hokm.`;
    return { kind: "none", message: round.summary };
  }

  discardCards(seat: Seat, cardCodes: string[]): HokmTransition {
    const round = this.requireRound();
    if (this.mode !== 2) {
      throw new Error("Discarding is only available in two-player mode.");
    }

    const expectedCount =
      round.phase === "HAKEM_DISCARD"
        ? 3
        : round.phase === "OPPONENT_DISCARD"
          ? 2
          : null;

    if (expectedCount === null) {
      throw new Error("Cards cannot be discarded right now.");
    }

    const expectedSeat =
      round.phase === "HAKEM_DISCARD" ? round.hakemSeat : opposingSeat(round.hakemSeat);
    if (seat !== expectedSeat) {
      throw new Error("It is not your discard turn.");
    }
    if (cardCodes.length !== expectedCount || new Set(cardCodes).size !== expectedCount) {
      throw new Error(`You must discard exactly ${expectedCount} cards.`);
    }

    const hand = round.hands[seat];
    const discardIndexes = cardCodes.map((cardCode) => hand.findIndex((card) => card.code === cardCode));
    if (discardIndexes.some((index) => index === -1)) {
      throw new Error("You can only discard cards from your hand.");
    }

    const selected = hand.filter((card) => cardCodes.includes(card.code));
    round.hands[seat] = hand.filter((card) => !cardCodes.includes(card.code));
    round.deadPile.push(...selected);

    if (round.phase === "HAKEM_DISCARD") {
      round.phase = "OPPONENT_DISCARD";
      round.summary = `${labelForSeat(seat, 2)} discarded 3 cards.`;
      return { kind: "none", message: round.summary };
    }

    startRefillPhase(round, this.rng);
    return { kind: "none", message: `${labelForSeat(seat, 2)} discarded 2 cards.` };
  }

  resolveRefill(seat: Seat, action: "keep" | "discard"): HokmTransition {
    const round = this.requireRound();
    if (this.mode !== 2 || round.phase !== "REFILL") {
      throw new Error("Refill decisions are not allowed right now.");
    }
    if (round.refillTurnSeat !== seat) {
      throw new Error("It is not your draw turn.");
    }
    if (!round.drawnCard) {
      throw new Error("There is no drawn card to resolve.");
    }

    const firstCard = round.drawnCard;
    round.drawnCard = null;
    ensureStock(round, this.rng);
    const secondCard = round.stock.shift() as Card;

    if (action === "keep") {
      round.hands[seat].push(firstCard);
      round.deadPile.push(secondCard);
      round.refillPreview = {
        seat,
        firstCard,
        secondCard,
        keptCardCode: firstCard.code,
        decision: "keep_first",
      };
      finalizeRefillIfComplete(round, this.rng);
      return { kind: "none", message: `${labelForSeat(seat, 2)} kept the first card.` };
    }

    round.deadPile.push(firstCard);
    round.hands[seat].push(secondCard);
    round.refillPreview = {
      seat,
      firstCard,
      secondCard,
      keptCardCode: secondCard.code,
      decision: "keep_second",
    };
    finalizeRefillIfComplete(round, this.rng);
    return { kind: "none", message: `${labelForSeat(seat, 2)} kept the second card.` };
  }

  playCard(seat: Seat, cardCode: string): HokmTransition {
    const match = this.requireMatch();
    const round = this.requireRound();
    if (round.phase !== "IN_TRICK") {
      throw new Error("Cards cannot be played right now.");
    }
    if (round.trick.currentTurn !== seat) {
      throw new Error("It is not your turn.");
    }

    const hand = round.hands[seat];
    const cardIndex = hand.findIndex((card) => card.code === cardCode);
    if (cardIndex === -1) {
      throw new Error("Card is not in your hand.");
    }

    const card = hand[cardIndex];
    if (round.trick.ledSuit) {
      const mustFollow = hand.some((candidate) => candidate.suit === round.trick.ledSuit);
      if (mustFollow && card.suit !== round.trick.ledSuit) {
        throw new Error(`You must follow ${displaySuit(round.trick.ledSuit)}.`);
      }
    }

    hand.splice(cardIndex, 1);
    round.trick.cards.push({ seat, card });
    if (!round.trick.ledSuit) {
      round.trick.ledSuit = card.suit;
    }

    const trickSize = activeSeatsForMode(this.mode).length;
    if (round.trick.cards.length < trickSize) {
      round.trick.currentTurn = nextSeat(seat, this.mode);
      return { kind: "none" };
    }

    const winner = resolveTrickWinner(
      round.trick.cards,
      round.trumpSuit as Suit,
      round.trick.ledSuit as Suit,
    );
    round.trick.winner = winner;
    const winnerTeam = teamOf(winner, this.mode);
    const loserTeam: Team = winnerTeam === "A" ? "B" : "A";
    round.trickCounts[winnerTeam] += 1;

    if (round.trickCounts[winnerTeam] >= 7) {
      const awardedPoints =
        round.trickCounts[loserTeam] === 0
          ? winnerTeam === teamOf(round.hakemSeat, this.mode)
            ? 2
            : 3
          : 1;

      round.phase = "ROUND_OVER";
      round.roundWinner = winnerTeam;
      round.awardedPoints = awardedPoints;
      round.summary = `${teamLabel(winnerTeam)} won the round ${round.trickCounts.A}-${round.trickCounts.B} and earned +${awardedPoints}.`;
      match.points[winnerTeam] += awardedPoints;
      match.summary = round.summary;

      this.nextHakemSeat =
        winnerTeam === teamOf(round.hakemSeat, this.mode)
          ? round.hakemSeat
          : this.mode === 2
            ? opposingSeat(round.hakemSeat)
            : nextSeat(round.hakemSeat, this.mode);

      if (match.points[winnerTeam] >= match.pointTarget) {
        match.winner = winnerTeam;
        match.summary = `${teamLabel(winnerTeam)} won match ${this.series.matchNumber} ${match.points.A}-${match.points.B}.`;
        this.series.wins[winnerTeam] += 1;
        this.series.summary = match.summary;

        if (this.series.wins[winnerTeam] >= Math.floor(this.series.bestOf / 2) + 1) {
          this.series.winner = winnerTeam;
          this.series.summary =
            `${teamLabel(winnerTeam)} won the Best of ${this.series.bestOf} series ` +
            `${this.series.wins.A}-${this.series.wins.B}.`;
          return { kind: "series_over", message: this.series.summary };
        }

        return { kind: "match_over", message: match.summary };
      }

      return { kind: "round_over", message: round.summary };
    }

    round.trickNumber += 1;
    round.summary = `${labelForSeat(winner, this.mode)} took the trick.`;
    round.trick = createTrick(winner);
    return { kind: "none", message: round.summary };
  }

  startNextRound() {
    const match = this.requireMatch();
    match.roundNumber += 1;
    const deck = shuffleDeck(this.rng);
    const hakemSeat = this.mode === 2 ? this.nextHakemSeat : this.nextHakemSeat;
    match.round = dealInitialRound(this.mode, hakemSeat, deck);
    match.summary = null;
  }

  startNextMatch(pointTarget: MatchTarget = this.requireMatch().pointTarget) {
    const deck = shuffleDeck(this.rng);
    if (this.mode === 2 && !this.series.currentMatch) {
      this.nextHakemSeat = chooseHakemForTwoPlayers(this.rng);
    }
    this.series.currentMatch = createMatch(this.mode, pointTarget, this.nextHakemSeat, deck);
  }

  advanceAfterMatch() {
    if (this.series.winner || !this.series.currentMatch?.winner) {
      return;
    }
    this.series.matchNumber += 1;
    this.startNextMatch(this.series.currentMatch.pointTarget);
  }

  resetSeries(pointTarget: MatchTarget, seriesTarget: SeriesTarget = this.series.bestOf) {
    this.series.wins = emptyScores();
    this.series.bestOf = seriesTarget;
    this.series.matchNumber = 1;
    this.series.winner = null;
    this.series.summary = null;
    this.nextHakemSeat =
      this.mode === 2
        ? chooseHakemForTwoPlayers(this.rng)
        : (Math.floor(this.rng() * activeSeatsForMode(4).length) as Seat);
    this.startNextMatch(pointTarget);
  }

  private requireMatch() {
    if (!this.series.currentMatch) {
      throw new Error("Match has not started.");
    }
    return this.series.currentMatch;
  }

  private requireRound() {
    const round = this.requireMatch().round;
    if (!round) {
      throw new Error("Round has not started.");
    }
    return round;
  }
}

export const displaySuit = (suit: Suit) =>
  ({
    spades: "\u2660",
    hearts: "\u2665",
    diamonds: "\u2666",
    clubs: "\u2663",
  })[suit];

export const isRedSuit = (suit: Suit) => suit === "hearts" || suit === "diamonds";

export const teamLabel = (team: Team) => (team === "A" ? "Team A" : "Team B");

export const labelForSeat = (seat: Seat, mode: PlayerMode = 4) => {
  if (mode === 2) {
    return seat === 0 ? "South" : "North";
  }
  return ["South", "East", "North", "West"][seat];
};
