import React from "react";
import { PieceType, Player } from "@/lib/shogi";
import { PieceDisplay } from "./PieceDisplay";
import { cn } from "@/lib/utils";

interface HandPiecesProps {
  player: Player;
  pieces: PieceType[];
  selectedPiece: PieceType | null;
  onPieceSelect: (type: PieceType) => void;
  isActive: boolean;
  rotatePieces?: boolean;
}

export const HandPieces: React.FC<HandPiecesProps> = ({
  player, pieces, selectedPiece, onPieceSelect, isActive, rotatePieces = false,
}) => {
  const pieceCounts = pieces.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<PieceType, number>);

  const uniquePieces = Array.from(new Set(pieces));

  return (
    <div className={cn(
      "flex flex-row flex-wrap gap-1.5 px-2.5 py-1.5 rounded-md border items-center min-h-[2.8rem]",
      "bg-card border-border shadow-sm select-none",
      isActive ? "ring-1 ring-primary/50" : "opacity-80",
    )}>
      <span className="text-[0.6rem] font-bold text-muted-foreground whitespace-nowrap">
        {player === 0 ? "先手▲" : "後手△"}
      </span>
      {uniquePieces.length === 0 && (
        <span className="text-muted-foreground text-xs opacity-50 ml-1">なし</span>
      )}
      {uniquePieces.map(type => (
        <button
          key={type}
          className={cn(
            "relative focus:outline-none select-none",
            "active:scale-95 transition-transform",
            selectedPiece === type && "ring-2 ring-primary ring-offset-1 rounded-sm",
            isActive ? "cursor-pointer" : "cursor-default",
          )}
          style={{
            // Minimum 44px touch target recommended by Apple/Google
            width: "clamp(2rem, 5vmin, 2.6rem)",
            height: "clamp(2.3rem, 5.8vmin, 3rem)",
            touchAction: "manipulation",
          }}
          onPointerUp={() => isActive && onPieceSelect(type)}
          data-testid={`hand-piece-${player}-${type}`}
        >
          <div style={{ transform: rotatePieces ? "rotate(180deg)" : undefined, width: "100%", height: "100%" }}>
            <PieceDisplay piece={{ type, player }} isSelected={selectedPiece === type} small />
          </div>
          {pieceCounts[type] > 1 && (
            <div
              className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[0.5rem] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center shadow"
              style={{ transform: rotatePieces ? "rotate(180deg)" : undefined }}
            >
              {pieceCounts[type]}
            </div>
          )}
        </button>
      ))}
    </div>
  );
};
