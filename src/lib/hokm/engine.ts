import {
  MATCH_TARGETS,
  RANKS,
  SEATS,
  SERIES_TARGETS,
  SUITS,
  type Card,
  type MatchState,
  type MatchTarget,
  type PlayedCard,
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

export const teamOf = (seat: Seat): Team => (seat % 2 === 0 ? "A" : "B");
export const nextSeat = (seat: Seat): Seat => ((seat + 1) % 4) as Seat;
export const previousSeat = (seat: Seat): Seat => ((seat + 3) % 4) as Seat;

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

const dealInitialRound = (hakemSeat: Seat, deck: Card[]): RoundState => {
  const hands = emptyHands();
  hands[hakemSeat] = deck.splice(0, 5);

  return {
    hakemSeat,
    dealerSeat: previousSeat(hakemSeat),
    trumpSuit: null,
    phase: "AWAITING_TRUMP",
    hands,
    trickCounts: emptyScores(),
    trickNumber: 1,
    trick: createTrick(hakemSeat),
    roundWinner: null,
    awardedPoints: null,
    summary: null,
  };
};

const completeDeal = (round: RoundState, deck: Card[]) => {
  let seatCursor: Seat = round.hakemSeat;
  while (deck.length > 0) {
    if (round.hands[seatCursor].length < 13) {
      round.hands[seatCursor].push(deck.shift() as Card);
    }
    seatCursor = nextSeat(seatCursor);
  }
};

const createMatch = (pointTarget: MatchTarget, hakemSeat: Seat, deck: Card[]): MatchState => ({
  pointTarget,
  points: emptyScores(),
  roundNumber: 1,
  round: dealInitialRound(hakemSeat, deck),
  winner: null,
  summary: null,
});

export class HokmEngine {
  private readonly rng: () => number;

  private pendingDeck: Card[] = [];

  private nextHakemSeat: Seat = 0;

  public readonly series: SeriesState;

  constructor(
    pointTarget: MatchTarget,
    seriesTarget: SeriesTarget = 7,
    rng: () => number = randomValue,
  ) {
    if (!MATCH_TARGETS.includes(pointTarget)) {
      throw new Error("Invalid match target");
    }
    if (!SERIES_TARGETS.includes(seriesTarget)) {
      throw new Error("Invalid series target");
    }

    this.rng = rng;
    this.nextHakemSeat = Math.floor(this.rng() * SEATS.length) as Seat;
    this.series = {
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
    if (round.phase !== "AWAITING_TRUMP") {
      throw new Error("Trump cannot be declared right now.");
    }
    if (round.hakemSeat !== seat) {
      throw new Error("Only the Hakem can declare trump.");
    }

    round.trumpSuit = suit;
    completeDeal(round, this.pendingDeck);
    round.phase = "IN_TRICK";
    round.summary = `${labelForSeat(seat)} declared ${displaySuit(suit)} as Hokm.`;
    return { kind: "none", message: round.summary };
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

    if (round.trick.cards.length < 4) {
      round.trick.currentTurn = nextSeat(seat);
      return { kind: "none" };
    }

    const winner = resolveTrickWinner(
      round.trick.cards,
      round.trumpSuit as Suit,
      round.trick.ledSuit as Suit,
    );
    round.trick.winner = winner;
    const winnerTeam = teamOf(winner);
    const loserTeam: Team = winnerTeam === "A" ? "B" : "A";
    round.trickCounts[winnerTeam] += 1;

    if (round.trickCounts[winnerTeam] >= 7) {
      const awardedPoints =
        round.trickCounts[loserTeam] === 0
          ? winnerTeam === teamOf(round.hakemSeat)
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
        winnerTeam === teamOf(round.hakemSeat) ? round.hakemSeat : nextSeat(round.hakemSeat);

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
    round.summary = `${labelForSeat(winner)} took the trick.`;
    round.trick = createTrick(winner);
    return { kind: "none", message: round.summary };
  }

  startNextRound() {
    const match = this.requireMatch();
    match.roundNumber += 1;
    this.pendingDeck = shuffleDeck(this.rng);
    match.round = dealInitialRound(this.nextHakemSeat, this.pendingDeck);
    match.summary = null;
  }

  startNextMatch(pointTarget: MatchTarget = this.requireMatch().pointTarget) {
    this.pendingDeck = shuffleDeck(this.rng);
    this.series.currentMatch = createMatch(pointTarget, this.nextHakemSeat, this.pendingDeck);
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
    this.nextHakemSeat = Math.floor(this.rng() * SEATS.length) as Seat;
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
export const labelForSeat = (seat: Seat) => ["South", "East", "North", "West"][seat];
