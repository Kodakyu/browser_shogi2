import { GameState, Move, getAllLegalMoves, applyGameMove, PieceType } from "./shogi";

const PIECE_VALUES: Record<PieceType, number> = {
  pawn:    100,
  lance:   300,
  knight:  350,
  silver:  450,
  gold:    550,
  bishop:  700,
  rook:    800,
  ppawn:   400,
  plance:  500,
  pknight: 500,
  psilver: 550,
  pbishop: 1000,
  prook:   1100,
  king:    10000,
};

function evaluate(state: GameState, forPlayer: number): number {
  let score = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const p = state.board[r][c];
      if (!p) continue;
      const val = PIECE_VALUES[p.type] ?? 0;
      score += p.player === forPlayer ? val : -val;
    }
  }
  const myHand = forPlayer === 0 ? state.capturedBySente : state.capturedByGote;
  const oppHand = forPlayer === 0 ? state.capturedByGote : state.capturedBySente;
  for (const pt of myHand)  score += (PIECE_VALUES[pt] ?? 0) * 0.85;
  for (const pt of oppHand) score -= (PIECE_VALUES[pt] ?? 0) * 0.85;
  return score;
}

function orderMoves(state: GameState, moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    let sa = 0, sb = 0;
    const ta = !a.drop ? state.board[a.toRow]?.[a.toCol] : null;
    const tb = !b.drop ? state.board[b.toRow]?.[b.toCol] : null;
    if (ta) sa += PIECE_VALUES[ta.type] ?? 0;
    if (tb) sb += PIECE_VALUES[tb.type] ?? 0;
    if (a.promote) sa += 200;
    if (b.promote) sb += 200;
    return sb - sa;
  });
}

function alphabeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  rootPlayer: number,
): number {
  if (depth === 0 || state.status !== "playing") {
    if (state.status === "checkmate") {
      return state.winner === rootPlayer ? 99999 - (10 - depth) : -99999 + (10 - depth);
    }
    return evaluate(state, rootPlayer);
  }

  const moves = orderMoves(state, getAllLegalMoves(state));

  if (maximizing) {
    let value = -Infinity;
    for (const move of moves) {
      const next = applyGameMove(state, move);
      value = Math.max(value, alphabeta(next, depth - 1, alpha, beta, false, rootPlayer));
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  } else {
    let value = Infinity;
    for (const move of moves) {
      const next = applyGameMove(state, move);
      value = Math.min(value, alphabeta(next, depth - 1, alpha, beta, true, rootPlayer));
      beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  }
}

export function getStrongCPUMove(state: GameState, depth = 3): Move | null {
  const moves = orderMoves(state, getAllLegalMoves(state));
  if (moves.length === 0) return null;

  const rootPlayer = state.currentPlayer;
  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = applyGameMove(state, move);
    const score = alphabeta(next, depth - 1, -Infinity, Infinity, false, rootPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
