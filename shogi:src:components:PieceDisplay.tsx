import { PieceType, Piece, PIECE_DISPLAY } from "@/lib/shogi";
import { cn } from "@/lib/utils";

interface PieceDisplayProps {
  piece: Piece;
  className?: string;
  isSelected?: boolean;
  small?: boolean;
}

const isPromoted = (type: PieceType): boolean =>
  ["prook", "pbishop", "psilver", "pknight", "plance", "ppawn"].includes(type);

export const PieceDisplay: React.FC<PieceDisplayProps> = ({ piece, isSelected, small }) => {
  const isGote = piece.player === 1;
  const promoted = isPromoted(piece.type);
  const display = PIECE_DISPLAY[piece.type][isGote ? 1 : 0];

  return (
    <div className={cn("relative w-full h-full", isGote && "rotate-180")}>
      {/* Pentagon background — clipped shape only, text is NOT inside clip */}
      <div
        className={cn(
          "absolute inset-0 transition-colors duration-100",
          isSelected ? "bg-[#f0d060]" : "bg-[#d4b58a]",
        )}
        style={{ clipPath: "polygon(50% 0%, 95% 18%, 88% 100%, 12% 100%, 5% 18%)" }}
      />
      {/* Text layer — sits above clip, unclipped */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: "8%" }}>
        <span
          className={cn(
            "font-bold leading-none select-none",
            small ? "text-[clamp(0.5rem,2.5vmin,1rem)]" : "text-[clamp(0.55rem,3vmin,1.4rem)]",
            promoted ? "text-red-700" : "text-[#2c1d11]",
          )}
        >
          {display}
        </span>
      </div>
    </div>
  );
};
