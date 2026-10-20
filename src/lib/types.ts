export const SEATS = [0, 1, 2, 3] as const;
export const MATCH_TARGETS = [3, 5, 7] as const;
export const SERIES_TARGETS = [1, 3, 5, 7] as const;
export const PLAYER_MODES = [2, 4] as const;
export const SUITS = ["spades", "hearts", "diamonds", "clubs"] as const;
export const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"] as const;

export type Seat = (typeof SEATS)[number];
export type Team = "A" | "B";
export type MatchTarget = (typeof MATCH_TARGETS)[number];
export type SeriesTarget = (typeof SERIES_TARGETS)[number];
export type PlayerMode = (typeof PLAYER_MODES)[number];
export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export type GameStage =
  | "LOBBY"
  | "CHOOSE_HAKEM"
  | "DECLARE_TRUMP"
  | "HAKEM_DISCARD"
  | "OPPONENT_DISCARD"
  | "REFILL"
  | "IN_TRICK"
  | "ROUND_OVER"
  | "MATCH_OVER"
  | "SERIES_OVER";

export type Card = {
  code: string;
  suit: Suit;
  rank: Rank;
};

export type PlayerSession = {
  sessionId: string;
  displayName: string;
};

export type SpectatorSession = PlayerSession & {
  connected: boolean;
};

export type SeatAssignment = PlayerSession & {
  seat: Seat;
  connected: boolean;
};

export type PlayedCard = {
  seat: Seat;
  card: Card;
};

export type TrickState = {
  leader: Seat;
  currentTurn: Seat;
  ledSuit: Suit | null;
  cards: PlayedCard[];
  winner: Seat | null;
};

export type RefillPreviewState = {
  seat: Seat;
  firstCard: Card;
  secondCard: Card | null;
  keptCardCode: string | null;
  decision: "pending" | "keep_first" | "keep_second";
};

export type RoundState = {
  mode: PlayerMode;
  hakemSeat: Seat;
  dealerSeat: Seat;
  trumpSuit: Suit | null;
  phase:
    | "CHOOSE_HAKEM"
    | "DECLARE_TRUMP"
    | "HAKEM_DISCARD"
    | "OPPONENT_DISCARD"
    | "REFILL"
    | "IN_TRICK"
    | "ROUND_OVER";
  hands: Record<Seat, Card[]>;
  stock: Card[];
  deadPile: Card[];
  drawnCard: Card | null;
  refillTurnSeat: Seat | null;
  refillPreview: RefillPreviewState | null;
  trickCounts: Record<Team, number>;
  trickNumber: number;
  trick: TrickState;
  roundWinner: Team | null;
  awardedPoints: number | null;
  summary: string | null;
};

export type MatchState = {
  mode: PlayerMode;
  pointTarget: MatchTarget;
  points: Record<Team, number>;
  roundNumber: number;
  round: RoundState | null;
  winner: Team | null;
  summary: string | null;
};

export type SeriesState = {
  mode: PlayerMode;
  bestOf: SeriesTarget;
  wins: Record<Team, number>;
  matchNumber: number;
  currentMatch: MatchState | null;
  winner: Team | null;
  summary: string | null;
};

export type PublicRoundState = {
  mode: PlayerMode;
  hakemSeat: Seat;
  dealerSeat: Seat;
  trumpSuit: Suit | null;
  phase:
    | "CHOOSE_HAKEM"
    | "DECLARE_TRUMP"
    | "HAKEM_DISCARD"
    | "OPPONENT_DISCARD"
    | "REFILL"
    | "IN_TRICK"
    | "ROUND_OVER";
  handCounts: Record<Seat, number>;
  stockCount: number;
  deadPileCount: number;
  refillTurnSeat: Seat | null;
  refillPreview: RefillPreviewState | null;
  trickCounts: Record<Team, number>;
  trickNumber: number;
  trick: TrickState;
  roundWinner: Team | null;
  awardedPoints: number | null;
  summary: string | null;
};

export type PublicMatchState = {
  mode: PlayerMode;
  pointTarget: MatchTarget;
  points: Record<Team, number>;
  roundNumber: number;
  round: PublicRoundState | null;
  winner: Team | null;
  summary: string | null;
};

export type PublicSeriesState = {
  mode: PlayerMode;
  bestOf: SeriesTarget;
  wins: Record<Team, number>;
  matchNumber: number;
  currentMatch: PublicMatchState | null;
  winner: Team | null;
  summary: string | null;
};

export type LobbyState = {
  roomCode: string;
  hostSeat: Seat;
  seats: Array<SeatAssignment | null>;
  mode: PlayerMode;
  pointTarget: MatchTarget;
  seriesTarget: SeriesTarget;
};

export type PauseState = {
  disconnectedSeat: Seat;
  disconnectedName: string;
  pausedUntil: number;
};

export type SurrenderState = {
  votes: Record<Team, Seat[]>;
};

export type PublicGameState = {
  stage: GameStage;
  roomCode: string;
  hostSeat: Seat;
  mode: PlayerMode;
  pointTarget: MatchTarget;
  seriesTarget: SeriesTarget;
  series: PublicSeriesState | null;
  seats: Array<SeatAssignment | null>;
  spectators: SpectatorSession[];
  pause: PauseState | null;
  surrender: SurrenderState | null;
  lastMessage: string | null;
  shareResultId: string | null;
};

export type PlayerPrivateState = {
  sessionId: string;
  seat: Seat | null;
  isSpectator: boolean;
  hand: Card[];
};

export type RoomSummary = {
  code: string;
  seatCount: number;
  spectatorCount: number;
  started: boolean;
  mode: PlayerMode;
  pointTarget: MatchTarget;
  seriesTarget: SeriesTarget;
};

export type RoomSnapshot = {
  room: RoomSummary;
  game: PublicGameState;
  player: PlayerPrivateState;
};

export type ResultsSnapshot = {
  id: string;
  roomCode: string;
  createdAt: number;
  mode: PlayerMode;
  target: MatchTarget;
  seriesTarget: SeriesTarget;
  seriesWins: Record<Team, number>;
  winner: Team;
  teams: Record<Team, string[]>;
  matchSummaries: string[];
};

export type ClientIntentMap = {
  create_room: {
    displayName: string;
    sessionId: string;
    mode?: PlayerMode;
    pointTarget?: MatchTarget;
    seriesTarget?: SeriesTarget;
  };
  join_room: {
    roomCode: string;
    displayName: string;
    sessionId: string;
    spectate?: boolean;
  };
  rejoin_room: {
    roomCode: string;
    sessionId: string;
  };
  leave_room: {
    roomCode: string;
    sessionId: string;
  };
  set_display_name: {
    roomCode: string;
    sessionId: string;
    displayName: string;
  };
  set_match_target: {
    roomCode: string;
    sessionId: string;
    pointTarget: MatchTarget;
  };
  set_series_target: {
    roomCode: string;
    sessionId: string;
    seriesTarget: SeriesTarget;
  };
  start_series: {
    roomCode: string;
    sessionId: string;
  };
  declare_trump: {
    roomCode: string;
    sessionId: string;
    suit: Suit;
  };
  discard_cards: {
    roomCode: string;
    sessionId: string;
    cardCodes: string[];
  };
  resolve_refill: {
    roomCode: string;
    sessionId: string;
    action: "keep" | "discard";
  };
  play_card: {
    roomCode: string;
    sessionId: string;
    cardCode: string;
  };
  play_again: {
    roomCode: string;
    sessionId: string;
  };
  toggle_surrender: {
    roomCode: string;
    sessionId: string;
  };
  end_paused_match: {
    roomCode: string;
    sessionId: string;
  };
};

export type ClientIntent = keyof ClientIntentMap;

export type ServerEventMap = {
  state: RoomSnapshot;
  room_update: RoomSnapshot;
  trick_resolved: RoomSnapshot;
  round_summary: RoomSnapshot;
  match_summary: RoomSnapshot;
  series_summary: RoomSnapshot;
  pause_update: RoomSnapshot;
  toast: {
    kind: "error" | "info";
    message: string;
  };
};

export type ServerEvent = keyof ServerEventMap;
