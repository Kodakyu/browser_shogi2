import { Board, GameState, PieceType, Player, Piece, createInitialState } from "./shogi";

// ── Piece ↔ SFEN char mappings ──────────────────────────────────────────────

const PIECE_TO_CHAR: Record<PieceType, string> = {
  king: "k", rook: "r", bishop: "b", gold: "g",
  silver: "s", knight: "n", lance: "l", pawn: "p",
  prook: "+r", pbishop: "+b", psilver: "+s",
  pknight: "+n", plance: "+l", ppawn: "+p",
};

const CHAR_TO_PIECE: Record<string, PieceType> = {
  k: "king", r: "rook", b: "bishop", g: "gold",
  s: "silver", n: "knight", l: "lance", p: "pawn",
  "+r": "prook", "+b": "pbishop", "+s": "psilver",
  "+n": "pknight", "+l": "plance", "+p": "ppawn",
};

// Order for hands (standard SFEN order)
const HAND_ORDER: PieceType[] = ["rook", "bishop", "gold", "silver", "knight", "lance", "pawn"];

// ── Encode ───────────────────────────────────────────────────────────────────

function encodeBoard(board: Board): string {
  return board.map(row => {
    let str = "";
    let empty = 0;
    for (const sq of row) {
      if (!sq) {
        empty++;
      } else {
        if (empty > 0) { str += empty; empty = 0; }
        const ch = PIECE_TO_CHAR[sq.type];
        str += sq.player === 0 ? ch.toUpperCase().replace("+", "+") : ch;
        // uppercase for sente (0), lowercase for gote (1)
        // promoted: "+P" for sente, "+p" for gote
      }
    }
    if (empty > 0) str += empty;
    return str;
  }).join("/");
}

function encodePieceChar(type: PieceType, player: Player): string {
  const ch = PIECE_TO_CHAR[type];
  if (player === 0) {
    // Sente: uppercase, keep + prefix
    return ch.startsWith("+") ? "+" + ch[1].toUpperCase() : ch.toUpperCase();
  }
  return ch; // Gote: lowercase
}

function encodeBoard2(board: Board): string {
  return board.map(row => {
    let str = "";
    let empty = 0;
    for (const sq of row) {
      if (!sq) {
        empty++;
      } else {
        if (empty > 0) { str += empty; empty = 0; }
        str += encodePieceChar(sq.type, sq.player);
      }
    }
    if (empty > 0) str += empty;
    return str;
  }).join("/");
}

function encodeHand(pieces: PieceType[], player: Player): string {
  const counts: Partial<Record<PieceType, number>> = {};
  for (const p of pieces) counts[p] = (counts[p] ?? 0) + 1;
  return HAND_ORDER
    .filter(t => counts[t])
    .map(t => {
      const n = counts[t]!;
      const ch = encodePieceChar(t, player);
      return n > 1 ? `${n}${ch}` : ch;
    })
    .join("");
}

export function stateToSfen(state: GameState): string {
  const boardStr = encodeBoard2(state.board);
  const turnStr = state.currentPlayer === 0 ? "b" : "w";
  const senteHand = encodeHand(state.capturedBySente, 0);
  const goteHand = encodeHand(state.capturedByGote, 1);
  const handStr = senteHand + goteHand || "-";
  return `sfen ${boardStr} ${turnStr} ${handStr} 1`;
}

// ── Decode ───────────────────────────────────────────────────────────────────

function decodeBoard(boardStr: string): Board {
  const rows = boardStr.split("/");
  if (rows.length !== 9) throw new Error("Invalid board: expected 9 rows");

  return rows.map(rowStr => {
    const cells: (Piece | null)[] = [];
    let i = 0;
    while (i < rowStr.length) {
      const promoted = rowStr[i] === "+";
      if (promoted) i++;
      const ch = rowStr[i].toLowerCase();
      const charKey = promoted ? "+" + ch : ch;
      const type = CHAR_TO_PIECE[charKey];
      if (type) {
        const player: Player = rowStr[i] === rowStr[i].toUpperCase() ? 0 : 1;
        cells.push({ type, player });
        i++;
      } else if (/[1-9]/.test(rowStr[i])) {
        const n = parseInt(rowStr[i]);
        for (let j = 0; j < n; j++) cells.push(null);
        i++;
      } else {
        i++; // skip unknown chars
      }
    }
    // Pad or trim to 9
    while (cells.length < 9) cells.push(null);
    return cells.slice(0, 9) as (Piece | null)[];
  });
}

function decodeHand(handStr: string): { sente: PieceType[]; gote: PieceType[] } {
  const sente: PieceType[] = [];
  const gote: PieceType[] = [];
  if (!handStr || handStr === "-") return { sente, gote };

  let i = 0;
  while (i < handStr.length) {
    // Parse optional count
    let countStr = "";
    while (i < handStr.length && /[0-9]/.test(handStr[i])) {
      countStr += handStr[i++];
    }
    const count = countStr ? parseInt(countStr) : 1;

    const promoted = handStr[i] === "+";
    if (promoted) i++;
    const ch = handStr[i];
    if (!ch) break;
    const charKey = promoted ? "+" + ch.toLowerCase() : ch.toLowerCase();
    const type = CHAR_TO_PIECE[charKey];
    const isUpper = ch === ch.toUpperCase();
    i++;

    if (type) {
      const arr = isUpper ? sente : gote;
      for (let j = 0; j < count; j++) arr.push(type);
    }
  }
  return { sente, gote };
}

export function sfenToState(sfen: string): GameState {
  // Strip leading "sfen " if present
  const clean = sfen.trim().replace(/^sfen\s+/i, "");
  const parts = clean.split(/\s+/);
  if (parts.length < 3) throw new Error("Invalid SFEN: need at least 3 parts");

  const [boardStr, turnStr, handStr] = parts;

  const board = decodeBoard(boardStr);
  const currentPlayer: Player = turnStr === "b" ? 0 : 1;
  const { sente: capturedBySente, gote: capturedByGote } = decodeHand(handStr);

  return {
    board,
    currentPlayer,
    capturedBySente,
    capturedByGote,
    status: "playing",
    winner: null,
    inCheck: null,
    lastMove: null,
  };
}

export function isValidSfen(sfen: string): boolean {
  try {
    sfenToState(sfen);
    return true;
  } catch {
    return false;
  }
}

export const INITIAL_SFEN = stateToSfen(createInitialState());
