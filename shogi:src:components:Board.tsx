import React, { useCallback } from "react";
import { Board as BoardType, Move } from "@/lib/shogi";
import { PieceDisplay } from "./PieceDisplay";
import { cn } from "@/lib/utils";

interface BoardProps {
  board: BoardType;
  selectedSquare: [number, number] | null;
  legalMoves: Move[];
  lastMove: Move | null;
  onSquareClick: (row: number, col: number) => void;
}

const ROW_LABELS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
const LABEL = "1.6rem";

export const Board: React.FC<BoardProps> = ({ board, selectedSquare, legalMoves, lastMove, onSquareClick }) => {
  // Use pointer events for instant response on touch (no 300ms delay)
  const handlePointerUp = useCallback((e: React.PointerEvent, row: number, col: number) => {
    e.preventDefault();
    onSquareClick(row, col);
  }, [onSquareClick]);

  const renderSquare = (row: number, col: number) => {
    const square = board[row][col];
    const isSelected = selectedSquare?.[0] === row && selectedSquare?.[1] === col;
    const isLegalMove = legalMoves.some(m => m.toRow === row && m.toCol === col);
    const isLastTo = lastMove?.toRow === row && lastMove?.toCol === col;
    const isLastFrom = !lastMove?.drop && lastMove?.fromRow === row && lastMove?.fromCol === col;

    return (
      <div
        key={`${row}-${col}`}
        className={cn(
          "relative border-[0.5px] border-[#8B5A2B]/50 flex items-center justify-center",
          "cursor-pointer select-none transition-colors",
          "active:brightness-90",
          isLastTo || isLastFrom ? "bg-[#e8d598]" : "bg-[#F5ECD5]",
          !isLastTo && !isLastFrom && isSelected && "bg-[#d4e8a0]",
        )}
        style={{ touchAction: "manipulation" }}
        onPointerUp={(e) => handlePointerUp(e, row, col)}
        data-testid={`square-${row}-${col}`}
      >
        {isLegalMove && !square && (
          <div className="absolute w-[32%] h-[32%] rounded-full bg-primary/55 pointer-events-none z-10" />
        )}
        {isLegalMove && square && (
          <div className="absolute inset-0 ring-2 ring-inset ring-destructive/60 pointer-events-none z-10" />
        )}
        {square && (
          <div className="absolute inset-[4%]">
            <PieceDisplay piece={square} isSelected={isSelected} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="relative select-none w-full h-full"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(9, minmax(0, 1fr)) ${LABEL}`,
        gridTemplateRows: `${LABEL} repeat(9, minmax(0, 1fr))`,
      }}
    >
      {/* Column headers 9→1 */}
      {[9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
        <div
          key={`ch-${n}`}
          className="flex items-center justify-center font-bold text-[#4a3525] select-none"
          style={{ fontSize: "clamp(0.55rem, 1.4vmin, 0.85rem)" }}
        >
          {n}
        </div>
      ))}
      <div />

      {/* Board cells + row labels */}
      {board.map((rowArr, row) => (
        <React.Fragment key={`row-${row}`}>
          {rowArr.map((_, col) => renderSquare(row, col))}
          <div
            className="flex items-center justify-center font-bold text-[#4a3525] select-none"
            style={{ fontSize: "clamp(0.55rem, 1.4vmin, 0.85rem)", paddingLeft: "2px" }}
          >
            {ROW_LABELS[row]}
          </div>
        </React.Fragment>
      ))}

      {/* Outer border overlay */}
      <div
        className="absolute pointer-events-none border-[3px] border-[#5C4033] shadow-2xl"
        style={{ top: LABEL, left: 0, right: LABEL, bottom: 0 }}
      />

      {/* Star points */}
      {[
        [1 / 3, 1 / 3], [1 / 3, 2 / 3],
        [2 / 3, 1 / 3], [2 / 3, 2 / 3],
      ].map(([y, x], i) => (
        <div
          key={`star-${i}`}
          className="absolute rounded-full bg-[#5C4033] pointer-events-none"
          style={{
            width: "clamp(4px, 1vmin, 7px)",
            height: "clamp(4px, 1vmin, 7px)",
            top: `calc(${LABEL} + ${y * 100}% * (1 - ${LABEL} / 100%))`,
            left: `calc(${x * 100}% * (1 - ${LABEL} / 100%))`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
};
