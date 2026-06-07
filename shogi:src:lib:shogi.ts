// Shogi Game Engine

export type Player = 0 | 1; // 0 = Sente (先手, Black, moves up), 1 = Gote (後手, White, moves down)

export type PieceType =
  | "king"     // 王将/玉将
  | "rook"     // 飛車
  | "bishop"   // 角行
  | "gold"     // 金将
  | "silver"   // 銀将
  | "knight"   // 桂馬
  | "lance"    // 香車
  | "pawn"     // 歩兵
  | "prook"    // 龍王 (promoted rook)
  | "pbishop"  // 龍馬 (promoted bishop)
  | "psilver"  // 成銀
  | "pknight"  // 成桂
  | "plance"   // 成香
  | "ppawn";   // と金

export interface Piece {
  type: PieceType;
  player: Player;
}

export type Square = Piece | null;
export type Board = Square[][];

export interface Move {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  promote?: boolean;
  drop?: PieceType; // if dropping a captured piece
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  capturedBySente: PieceType[]; // pieces sente can drop
  capturedByGote: PieceType[];
  status: "playing" | "checkmate" | "stalemate";
  winner: Player | null;
  inCheck: Player | null;
  lastMove: Move | null;
}

export const PIECE_DISPLAY: Record<PieceType, [string, string]> = {
  // [sente, gote] display
  king:    ["王", "玉"],
  rook:    ["飛", "飛"],
  bishop:  ["角", "角"],
  gold:    ["金", "金"],
  silver:  ["銀", "銀"],
  knight:  ["桂", "桂"],
  lance:   ["香", "香"],
  pawn:    ["歩", "歩"],
  prook:   ["龍", "龍"],
  pbishop: ["馬", "馬"],
  psilver: ["全", "全"],
  pknight: ["圭", "圭"],
  plance:  ["杏", "杏"],
  ppawn:   ["と", "と"],
};

export const PROMOTED_PIECE: Partial<Record<PieceType, PieceType>> = {
  rook:   "prook",
  bishop: "pbishop",
  silver: "psilver",
  knight: "pknight",
  lance:  "plance",
  pawn:   "ppawn",
};

export const DEMOTED_PIECE: Partial<Record<PieceType, PieceType>> = {
  prook:   "rook",
  pbishop: "bishop",
  psilver: "silver",
  pknight: "knight",
  plance:  "lance",
  ppawn:   "pawn",
};

export const CAN_PROMOTE: Set<PieceType> = new Set(["rook", "bishop", "silver", "knight", "lance", "pawn"]);
export const DROPPABLE_PIECES: PieceType[] = ["rook", "bishop", "gold", "silver", "knight", "lance", "pawn"];

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 9 && col >= 0 && col < 9;
}

/** Direction multiplier: sente moves "up" (negative row), gote moves "down" (positive row) */
function dir(player: Player): number {
  return player === 0 ? -1 : 1;
}

function isPromotionZone(row: number, player: Player): boolean {
  return player === 0 ? row <= 2 : row >= 6;
}

/** Returns raw (non-validated for check) moves for a piece */
function rawMovesForPiece(board: Board, row: number, col: number, piece: Piece): Move[] {
  const moves: Move[] = [];
  const { type, player } = piece;
  const d = dir(player);

  const addStep = (dr: number, dc: number) => {
    const nr = row + dr;
    const nc = col + dc;
    if (!inBounds(nr, nc)) return;
    const target = board[nr][nc];
    if (target && target.player === player) return; // can't capture own piece
    moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc });
  };

  const addSlide = (dr: number, dc: number) => {
    let nr = row + dr;
    let nc = col + dc;
    while (inBounds(nr, nc)) {
      const target = board[nr][nc];
      if (target) {
        if (target.player !== player) {
          moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc });
        }
        break;
      }
      moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc });
      nr += dr;
      nc += dc;
    }
  };

  // Gold-general moves (used by gold and promoted pieces)
  const goldMoves = () => {
    addStep(d, 0);   // forward
    addStep(0, -1);  // left
    addStep(0, 1);   // right
    addStep(-d, 0);  // backward
    addStep(d, -1);  // forward-left
    addStep(d, 1);   // forward-right
  };

  switch (type) {
    case "king":
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (dr !== 0 || dc !== 0) addStep(dr, dc);
      break;

    case "rook":
      addSlide(-1, 0); addSlide(1, 0); addSlide(0, -1); addSlide(0, 1);
      break;

    case "bishop":
      addSlide(-1, -1); addSlide(-1, 1); addSlide(1, -1); addSlide(1, 1);
      break;

    case "prook": // dragon: rook + king diagonals
      addSlide(-1, 0); addSlide(1, 0); addSlide(0, -1); addSlide(0, 1);
      addStep(-1, -1); addStep(-1, 1); addStep(1, -1); addStep(1, 1);
      break;

    case "pbishop": // horse: bishop + king orthogonals
      addSlide(-1, -1); addSlide(-1, 1); addSlide(1, -1); addSlide(1, 1);
      addStep(-1, 0); addStep(1, 0); addStep(0, -1); addStep(0, 1);
      break;

    case "gold":
    case "ppawn":
    case "plance":
    case "pknight":
    case "psilver":
      goldMoves();
      break;

    case "silver":
      addStep(d, 0);   // forward
      addStep(d, -1);  // forward-left
      addStep(d, 1);   // forward-right
      addStep(-d, -1); // backward-left
      addStep(-d, 1);  // backward-right
      break;

    case "knight":
      // Only 2 forward-L moves
      addStep(2 * d, -1);
      addStep(2 * d, 1);
      break;

    case "lance":
      // Slides forward only
      addSlide(d, 0);
      break;

    case "pawn":
      addStep(d, 0); // forward only
      break;
  }

  return moves;
}

/** Apply a move and return the new board state */
function applyMove(board: Board, move: Move, capturedBySente: PieceType[], capturedByGote: PieceType[]): {
  board: Board;
  capturedBySente: PieceType[];
  capturedByGote: PieceType[];
} {
  const newBoard = board.map(row => [...row]);
  const newCapturedBySente = [...capturedBySente];
  const newCapturedByGote = [...capturedByGote];

  if (move.drop) {
    // Drop move
    const piece = newBoard[move.fromRow][move.fromCol]; // fromRow/Col = -1 for drops, not used
    newBoard[move.toRow][move.toCol] = { type: move.drop, player: move.fromRow as Player };
    // Remove from hand
    const player = move.fromRow as Player;
    if (player === 0) {
      const idx = newCapturedBySente.indexOf(move.drop);
      if (idx !== -1) newCapturedBySente.splice(idx, 1);
    } else {
      const idx = newCapturedByGote.indexOf(move.drop);
      if (idx !== -1) newCapturedByGote.splice(idx, 1);
    }
    return { board: newBoard, capturedBySente: newCapturedBySente, capturedByGote: newCapturedByGote };
  }

  const piece = newBoard[move.fromRow][move.fromCol]!;
  const captured = newBoard[move.toRow][move.toCol];

  if (captured) {
    // Demote captured piece and add to captor's hand
    const demoted = DEMOTED_PIECE[captured.type] ?? captured.type;
    if (piece.player === 0) {
      newCapturedBySente.push(demoted);
    } else {
      newCapturedByGote.push(demoted);
    }
  }

  newBoard[move.toRow][move.toCol] = move.promote
    ? { type: PROMOTED_PIECE[piece.type] ?? piece.type, player: piece.player }
    : { type: piece.type, player: piece.player };
  newBoard[move.fromRow][move.fromCol] = null;

  return { board: newBoard, capturedBySente: newCapturedBySente, capturedByGote: newCapturedByGote };
}

/** Find the king's position */
function findKing(board: Board, player: Player): [number, number] | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.type === "king" && p.player === player) return [r, c];
    }
  }
  return null;
}

/** Check if a player's king is in check */
export function isInCheck(board: Board, player: Player): boolean {
  const kingPos = findKing(board, player);
  if (!kingPos) return false;
  const [kr, kc] = kingPos;
  const opponent = (1 - player) as Player;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.player === opponent) {
        const moves = rawMovesForPiece(board, r, c, p);
        if (moves.some(m => m.toRow === kr && m.toCol === kc)) return true;
      }
    }
  }
  return false;
}

/** Get all legal moves for a piece (validates against leaving own king in check) */
function legalMovesForPiece(
  board: Board,
  row: number,
  col: number,
  piece: Piece,
  capturedBySente: PieceType[],
  capturedByGote: PieceType[]
): Move[] {
  const raw = rawMovesForPiece(board, row, col, piece);
  const legal: Move[] = [];

  for (const move of raw) {
    const { board: nb } = applyMove(board, move, capturedBySente, capturedByGote);
    if (!isInCheck(nb, piece.player)) {
      // Add promotion options
      const inZone = isPromotionZone(move.toRow, piece.player) || isPromotionZone(row, piece.player);
      const canProm = CAN_PROMOTE.has(piece.type) && inZone;
      const mustPromote =
        (piece.type === "pawn" || piece.type === "lance") && (piece.player === 0 ? move.toRow === 0 : move.toRow === 8)
        || piece.type === "knight" && (piece.player === 0 ? move.toRow <= 1 : move.toRow >= 7);

      if (mustPromote) {
        legal.push({ ...move, promote: true });
      } else if (canProm) {
        legal.push(move);
        legal.push({ ...move, promote: true });
      } else {
        legal.push(move);
      }
    }
  }

  return legal;
}

/** Get all legal drop moves for a player */
function legalDropMoves(
  board: Board,
  player: Player,
  capturedBySente: PieceType[],
  capturedByGote: PieceType[]
): Move[] {
  const hand = player === 0 ? capturedBySente : capturedByGote;
  const uniquePieces = [...new Set(hand)];
  const moves: Move[] = [];

  for (const pieceType of uniquePieces) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c]) continue; // square must be empty

        // Pawn: can't drop in last row for player, can't drop on column with own pawn (二歩)
        if (pieceType === "pawn") {
          if (player === 0 && r === 0) continue;
          if (player === 1 && r === 8) continue;
          // Check for existing pawn in column
          let hasPawn = false;
          for (let rr = 0; rr < 9; rr++) {
            const sq = board[rr][c];
            if (sq && sq.player === player && sq.type === "pawn") { hasPawn = true; break; }
          }
          if (hasPawn) continue;
        }

        // Lance: can't drop in last row
        if (pieceType === "lance") {
          if (player === 0 && r === 0) continue;
          if (player === 1 && r === 8) continue;
        }

        // Knight: can't drop in last two rows
        if (pieceType === "knight") {
          if (player === 0 && r <= 1) continue;
          if (player === 1 && r >= 7) continue;
        }

        const dropMove: Move = { fromRow: player, fromCol: -1, toRow: r, toCol: c, drop: pieceType };
        // Check that drop doesn't leave own king in check
        const { board: nb } = applyMove(board, dropMove, capturedBySente, capturedByGote);
        if (!isInCheck(nb, player)) {
          // Check for 打ち歩詰め (pawn drop checkmate is illegal)
          if (pieceType === "pawn") {
            const opponent = (1 - player) as Player;
            if (isInCheck(nb, opponent) && !hasLegalMoves(nb, opponent, capturedBySente, capturedByGote)) {
              continue; // illegal: uchifuzume
            }
          }
          moves.push(dropMove);
        }
      }
    }
  }

  return moves;
}

function hasLegalMoves(
  board: Board,
  player: Player,
  capturedBySente: PieceType[],
  capturedByGote: PieceType[]
): boolean {
  // Check board moves
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.player === player) {
        const moves = legalMovesForPiece(board, r, c, p, capturedBySente, capturedByGote);
        if (moves.length > 0) return true;
      }
    }
  }
  // Check drop moves (without the uchifuzume check to avoid recursion)
  const hand = player === 0 ? capturedBySente : capturedByGote;
  for (const pieceType of new Set(hand)) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c]) continue;
        const dropMove: Move = { fromRow: player, fromCol: -1, toRow: r, toCol: c, drop: pieceType };
        const { board: nb } = applyMove(board, dropMove, capturedBySente, capturedByGote);
        if (!isInCheck(nb, player)) return true;
      }
    }
  }
  return false;
}

/** Get all legal moves for the current player */
export function getAllLegalMoves(state: GameState): Move[] {
  const { board, currentPlayer, capturedBySente, capturedByGote } = state;
  const moves: Move[] = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.player === currentPlayer) {
        moves.push(...legalMovesForPiece(board, r, c, p, capturedBySente, capturedByGote));
      }
    }
  }

  moves.push(...legalDropMoves(board, currentPlayer, capturedBySente, capturedByGote));
  return moves;
}

/** Get legal moves for a specific piece at (row, col) */
export function getLegalMovesForSquare(state: GameState, row: number, col: number): Move[] {
  const { board, currentPlayer, capturedBySente, capturedByGote } = state;
  const p = board[row][col];
  if (!p || p.player !== currentPlayer) return [];
  return legalMovesForPiece(board, row, col, p, capturedBySente, capturedByGote);
}

/** Get legal drop moves for current player for a specific piece type */
export function getLegalDropsForPiece(state: GameState, pieceType: PieceType): Move[] {
  const { board, currentPlayer, capturedBySente, capturedByGote } = state;
  return legalDropMoves(board, currentPlayer, capturedBySente, capturedByGote)
    .filter(m => m.drop === pieceType);
}

/** Apply a move and return the new game state */
export function applyGameMove(state: GameState, move: Move): GameState {
  const { board, capturedBySente, capturedByGote, currentPlayer } = state;
  const { board: newBoard, capturedBySente: newCBS, capturedByGote: newCBG } =
    applyMove(board, move, capturedBySente, capturedByGote);

  const nextPlayer = (1 - currentPlayer) as Player;
  const inCheck = isInCheck(newBoard, nextPlayer) ? nextPlayer : null;

  const newState: GameState = {
    board: newBoard,
    currentPlayer: nextPlayer,
    capturedBySente: newCBS,
    capturedByGote: newCBG,
    status: "playing",
    winner: null,
    inCheck,
    lastMove: move,
  };

  // Check for checkmate or stalemate
  if (!hasLegalMoves(newBoard, nextPlayer, newCBS, newCBG)) {
    newState.status = inCheck ? "checkmate" : "stalemate";
    newState.winner = inCheck ? currentPlayer : null;
  }

  return newState;
}

/** Create initial game state */
export function createInitialState(): GameState {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(null));

  // Gote (player 1) — top of board
  board[0] = [
    { type: "lance", player: 1 },
    { type: "knight", player: 1 },
    { type: "silver", player: 1 },
    { type: "gold", player: 1 },
    { type: "king", player: 1 },
    { type: "gold", player: 1 },
    { type: "silver", player: 1 },
    { type: "knight", player: 1 },
    { type: "lance", player: 1 },
  ];
  board[1][1] = { type: "rook", player: 1 };
  board[1][7] = { type: "bishop", player: 1 };
  for (let c = 0; c < 9; c++) board[2][c] = { type: "pawn", player: 1 };

  // Sente (player 0) — bottom of board
  board[8] = [
    { type: "lance", player: 0 },
    { type: "knight", player: 0 },
    { type: "silver", player: 0 },
    { type: "gold", player: 0 },
    { type: "king", player: 0 },
    { type: "gold", player: 0 },
    { type: "silver", player: 0 },
    { type: "knight", player: 0 },
    { type: "lance", player: 0 },
  ];
  board[7][7] = { type: "rook", player: 0 };
  board[7][1] = { type: "bishop", player: 0 };
  for (let c = 0; c < 9; c++) board[6][c] = { type: "pawn", player: 0 };

  return {
    board,
    currentPlayer: 0,
    capturedBySente: [],
    capturedByGote: [],
    status: "playing",
    winner: null,
    inCheck: null,
    lastMove: null,
  };
}
