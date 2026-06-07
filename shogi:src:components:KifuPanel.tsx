import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface KifuPanelProps {
  kifu: string[];
  reviewIndex: number | null; // null = live game, 0 = initial, k = after move k
  totalPositions: number;     // = kifu.length (0 means no moves yet)
  onNavigate: (index: number | null) => void;
  onRestorePosition: () => void;
  onClose: () => void;
}

export const KifuPanel: React.FC<KifuPanelProps> = ({
  kifu, reviewIndex, totalPositions, onNavigate, onRestorePosition, onClose,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Scroll active move into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [reviewIndex]);

  const handleCopy = () => {
    const text = kifu.map((n, i) => `${i + 1}. ${n}`).join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const isReviewing = reviewIndex !== null;
  const currentStep = reviewIndex ?? totalPositions; // where we currently are

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative z-10 bg-card border border-border rounded-xl shadow-2xl font-serif flex flex-col"
        style={{ width: "min(380px, 94vw)", maxHeight: "82dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <span className="font-bold text-base">棋譜</span>
          <div className="flex gap-2 items-center">
            {isReviewing && (
              <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                第{reviewIndex === 0 ? "初期" : `${reviewIndex}手`}
              </span>
            )}
            <button
              onClick={handleCopy}
              className="text-xs font-bold px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors"
            >
              コピー
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-1">
            {/* |< */}
            <NavBtn onClick={() => onNavigate(0)} disabled={currentStep === 0} label="⏮" title="初手前" />
            {/* < */}
            <NavBtn onClick={() => onNavigate(Math.max(0, currentStep - 1))} disabled={currentStep === 0} label="◀" title="1手戻る" />
            {/* > */}
            <NavBtn onClick={() => onNavigate(Math.min(totalPositions, currentStep + 1))} disabled={currentStep === totalPositions} label="▶" title="1手進む" />
            {/* >| */}
            <NavBtn onClick={() => onNavigate(null)} disabled={currentStep === totalPositions} label="⏭" title="最終手" />
          </div>

          <div className="flex items-center gap-1.5">
            {isReviewing && (
              <button
                onClick={onRestorePosition}
                className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                title="この局面からゲームを再開"
              >
                この局面から再開
              </button>
            )}
            {isReviewing && (
              <button
                onClick={() => onNavigate(null)}
                className="text-xs font-bold px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors whitespace-nowrap"
              >
                現局面へ
              </button>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="px-4 py-1.5 text-xs text-muted-foreground border-b border-border/50 flex-shrink-0">
          {totalPositions === 0
            ? "指し手なし"
            : isReviewing
            ? `第${reviewIndex === 0 ? "0（初期局面）" : reviewIndex}手 / 全${totalPositions}手`
            : `最終手（第${totalPositions}手） — ライブ`}
        </div>

        {/* Move list */}
        <div ref={listRef} className="overflow-y-auto flex-1 p-3">
          {kifu.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">まだ指し手がありません</p>
          ) : (
            <div className="space-y-0.5">
              {/* Initial position row */}
              <div
                ref={reviewIndex === 0 ? activeRef : undefined}
                onClick={() => onNavigate(0)}
                className={cn(
                  "flex gap-2 text-xs py-1 px-2 rounded cursor-pointer transition-colors",
                  reviewIndex === 0
                    ? "bg-primary/20 text-primary font-bold"
                    : "hover:bg-muted text-muted-foreground",
                )}
              >
                <span className="tabular-nums w-5 text-right">0.</span>
                <span>初期局面</span>
              </div>

              {kifu.map((notation, i) => {
                const moveNum = i + 1;
                const isActive = isReviewing
                  ? reviewIndex === moveNum
                  : moveNum === totalPositions; // highlight last move when live
                return (
                  <div
                    key={i}
                    ref={isActive ? activeRef : undefined}
                    onClick={() => onNavigate(moveNum)}
                    className={cn(
                      "flex gap-2 text-sm py-1 px-2 rounded cursor-pointer transition-colors",
                      isActive && isReviewing
                        ? "bg-primary/20 text-primary font-bold"
                        : !isReviewing && isActive
                        ? "bg-muted/60 font-medium"
                        : "hover:bg-muted",
                    )}
                  >
                    <span className="text-muted-foreground tabular-nums w-6 text-right flex-shrink-0 text-xs pt-0.5">
                      {moveNum}.
                    </span>
                    <span className={cn(
                      "font-medium",
                      notation.startsWith("▲") ? "text-foreground" : "text-primary",
                    )}>
                      {notation}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NavBtn: React.FC<{
  onClick: () => void;
  disabled: boolean;
  label: string;
  title: string;
}> = ({ onClick, disabled, label, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "w-8 h-7 flex items-center justify-center rounded border text-xs font-bold transition-colors",
      disabled
        ? "border-border text-muted-foreground opacity-30 cursor-not-allowed"
        : "border-border hover:bg-muted text-foreground cursor-pointer",
    )}
  >
    {label}
  </button>
);
