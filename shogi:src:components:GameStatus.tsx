import React from "react";
import { GameState, Player } from "@/lib/shogi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CpuStrength = "off" | "weak" | "strong";

interface GameStatusProps {
  gameState: GameState;
  onNewGame: () => void;
  onResign: () => void;
  onUndo: () => void;
  canUndo: boolean;
  cpuStrength: CpuStrength;
  onCycleCpu: () => void;
  cpuThinking: boolean;
  timerEnabled: boolean;
  onToggleTimer: () => void;
  timeLeft: number;
  forcedGameOver: { winner: Player; reason: string } | null;
  onShowKifu: () => void;
  kifuCount: number;
  onShowSfen: () => void;
}

const CPU_LABELS: Record<CpuStrength, string> = {
  off:    "CPU:切",
  weak:   "CPU:弱",
  strong: "CPU:強",
};

function timerColor(t: number) {
  if (t > 30) return "text-foreground";
  if (t > 10) return "text-amber-600";
  return "text-red-600 animate-pulse";
}

const Btn: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  "data-testid"?: string;
}> = ({ onClick, disabled, className, children, ...rest }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{ touchAction: "manipulation" }}
    className={cn(
      "text-xs font-bold px-2 py-1 rounded-full border transition-colors whitespace-nowrap select-none",
      "active:scale-95",
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState, onNewGame, onResign, onUndo, canUndo,
  cpuStrength, onCycleCpu, cpuThinking,
  timerEnabled, onToggleTimer, timeLeft,
  forcedGameOver, onShowKifu, kifuCount, onShowSfen,
}) => {
  const { currentPlayer, status, winner, inCheck } = gameState;
  const isOver = status !== "playing" || forcedGameOver !== null;
  const displayWinner = forcedGameOver?.winner ?? winner;
  const displayReason = forcedGameOver?.reason ?? (status === "checkmate" ? "詰み" : "引き分け");

  return (
    <div className="flex flex-col gap-1.5 px-2.5 py-2 bg-card border border-border rounded-lg shadow-md w-full">
      {/* Row 1: game status */}
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        {isOver ? (
          <>
            <span className="text-base font-black text-destructive tracking-widest">{displayReason}</span>
            {displayWinner !== null && (
              <span className="text-sm font-bold text-primary">
                {displayWinner === 0 ? "先手" : "後手"}の勝ち
              </span>
            )}
          </>
        ) : (
          <>
            <span className="text-sm font-bold text-foreground whitespace-nowrap">
              {cpuThinking
                ? <span className="text-primary animate-pulse">CPU思考中…</span>
                : `手番: ${currentPlayer === 0 ? "先手▲" : "後手△"}`}
            </span>
            {inCheck !== null && !cpuThinking && (
              <span className="text-sm font-bold text-destructive animate-pulse">王手！</span>
            )}
            {timerEnabled && !cpuThinking && (
              <span className={cn("text-sm font-mono font-bold tabular-nums", timerColor(timeLeft))}>
                {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
              </span>
            )}
          </>
        )}
      </div>

      {/* Row 2: controls */}
      <div className="flex items-center gap-1 flex-wrap">
        <Btn
          onClick={onCycleCpu}
          data-testid="toggle-cpu-mode"
          className={cn(
            cpuStrength === "off"
              ? "bg-card text-muted-foreground border-border"
              : cpuStrength === "weak"
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-red-100 text-red-800 border-red-300",
          )}
        >
          {CPU_LABELS[cpuStrength]}
        </Btn>

        <Btn
          onClick={onToggleTimer}
          data-testid="toggle-timer"
          className={cn(
            timerEnabled
              ? "bg-blue-100 text-blue-800 border-blue-300"
              : "bg-card text-muted-foreground border-border",
          )}
        >
          {timerEnabled ? "秒読:入" : "秒読:切"}
        </Btn>

        <Btn
          onClick={onShowKifu}
          data-testid="button-show-kifu"
          className="bg-card text-muted-foreground border-border"
        >
          棋譜{kifuCount > 0 ? `(${kifuCount})` : ""}
        </Btn>

        <Btn
          onClick={onShowSfen}
          data-testid="button-show-sfen"
          className="bg-card text-muted-foreground border-border"
        >
          共有
        </Btn>

        <div className="flex-1" />

        {!isOver && (
          <Btn
            onClick={onUndo}
            disabled={!canUndo}
            data-testid="button-undo"
            className={cn(
              canUndo
                ? "bg-card text-foreground border-border"
                : "bg-card text-muted-foreground border-border opacity-40 cursor-not-allowed",
            )}
          >
            待った
          </Btn>
        )}

        {!isOver && (
          <Btn
            onClick={onResign}
            data-testid="button-resign"
            className="border-destructive/50 text-destructive"
          >
            投了
          </Btn>
        )}

        <Button
          onClick={onNewGame}
          size="sm"
          style={{ touchAction: "manipulation" }}
          className="font-bold tracking-wider text-xs whitespace-nowrap h-7 px-3 select-none active:scale-95"
          data-testid="button-new-game"
        >
          新局
        </Button>
      </div>
    </div>
  );
};
