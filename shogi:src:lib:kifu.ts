import { Board, Move, Player, PieceType, PIECE_DISPLAY } from "./shogi";

const COL_NUMS = ["９", "８", "７", "６", "５", "４", "３", "２", "１"];
const ROW_KANJI = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

function pieceKanji(type: PieceType, player: Player): string {
  return PIECE_DISPLAY[type][player === 1 ? 1 : 0];
}

export function buildNotation(board: Board, move: Move, player: Player): string {
  const playerStr = player === 0 ? "▲" : "△";
  const toCol = COL_NUMS[move.toCol];
  const toRow = ROW_KANJI[move.toRow];

  if (move.drop) {
    const pk = pieceKanji(move.drop, player);
    return `${playerStr}${toCol}${toRow}${pk}打`;
  }

  const piece = board[move.fromRow][move.fromCol];
  if (!piece) return `${playerStr}${toCol}${toRow}??`;

  const pk = pieceKanji(piece.type, player);
  const suffix = move.promote ? "成" : "";
  return `${playerStr}${toCol}${toRow}${pk}${suffix}`;
}
