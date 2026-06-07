import { GameState, Move, getAllLegalMoves } from "./shogi";

const PIECE_VALUES: Record<string, number> = {
  king:    10000,
  prook:   1300,
  rook:    1000,
  pbishop: 1100,
  bishop:  900,
  gold:    600,
  psilver: 600,
  pknight: 600,
  plance:  600,
  ppawn:   600,
  silver:  500,
  knight:  400,
  lance:   400,
  pawn:    100,
};

export function getCPUMove(state: GameState): Move | null {
  const moves = getAllLegalMoves(state);
  if (moves.length === 0) return null;

  const scored = moves.map(move => {
    let score = Math.random() * 80;

    if (!move.drop) {
      const target = state.board[move.toRow][move.toCol];
      if (target) score += PIECE_VALUES[target.type] ?? 0;
    }

    if (move.promote) score += 250;

    // Prefer advancing pieces (forward for gote = increasing row)
    if (!move.drop) {
      const moved = state.board[move.fromRow]?.[move.fromCol];
      if (moved && moved.type !== "king") {
        score += (move.toRow - move.fromRow) * 5;
      }
    }

    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // 70% chance to pick best move, 30% from top 5
  const topN = Math.min(5, scored.length);
  const idx = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * topN);
  return scored[idx].move;
}
