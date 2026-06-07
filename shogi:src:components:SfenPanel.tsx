import React, { useState, useEffect } from "react";
import { GameState } from "@/lib/shogi";
import { stateToSfen, sfenToState, isValidSfen } from "@/lib/sfen";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SfenPanelProps {
  gameState: GameState;
  onLoadPosition: (state: GameState) => void;
  onClose: () => void;
}

export const SfenPanel: React.FC<SfenPanelProps> = ({ gameState, onLoadPosition, onClose }) => {
  const currentSfen = stateToSfen(gameState);
  const shareUrl = `${window.location.origin}${window.location.pathname}?sfen=${encodeURIComponent(currentSfen)}`;

  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<"sfen" | "url" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(null), 1500);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const copy = (text: string, type: "sfen" | "url") => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(type);
  };

  const handleLoad = () => {
    setError("");
    const trimmed = input.trim();
    if (!trimmed) { setError("SFENを入力してください"); return; }
    if (!isValidSfen(trimmed)) { setError("無効なSFEN文字列です"); return; }
    try {
      onLoadPosition(sfenToState(trimmed));
    } catch (e) {
      setError("読み込みに失敗しました");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative z-10 bg-card border border-border rounded-xl shadow-2xl font-serif flex flex-col gap-0 overflow-hidden"
        style={{ width: "min(440px, 94vw)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-bold text-base">SFEN / 局面共有</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Current position SFEN */}
          <section>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
              現在の局面 (SFEN)
            </label>
            <div className="flex gap-2 items-center">
              <input
                readOnly
                value={currentSfen}
                className="flex-1 text-xs font-mono bg-muted rounded-md px-2 py-1.5 border border-border text-foreground select-all min-w-0"
                onFocus={e => e.target.select()}
              />
              <button
                onClick={() => copy(currentSfen, "sfen")}
                className={cn(
                  "text-xs font-bold px-3 py-1.5 rounded-md border transition-colors whitespace-nowrap flex-shrink-0",
                  copied === "sfen"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-muted",
                )}
              >
                {copied === "sfen" ? "コピー済" : "コピー"}
              </button>
            </div>
          </section>

          {/* Share URL */}
          <section>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
              共有URL
            </label>
            <div className="flex gap-2 items-center">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 text-xs font-mono bg-muted rounded-md px-2 py-1.5 border border-border text-foreground min-w-0 truncate"
                onFocus={e => e.target.select()}
              />
              <button
                onClick={() => copy(shareUrl, "url")}
                className={cn(
                  "text-xs font-bold px-3 py-1.5 rounded-md border transition-colors whitespace-nowrap flex-shrink-0",
                  copied === "url"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-muted",
                )}
              >
                {copied === "url" ? "コピー済" : "コピー"}
              </button>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Load from SFEN */}
          <section>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
              SFENから局面を読み込む
            </label>
            <div className="flex gap-2 items-start">
              <textarea
                value={input}
                onChange={e => { setInput(e.target.value); setError(""); }}
                placeholder="sfen lnsgkgsnl/1r5b1/ppppppppp/..."
                className="flex-1 text-xs font-mono bg-muted rounded-md px-2 py-1.5 border border-border text-foreground resize-none min-w-0 h-14 focus:outline-none focus:ring-1 focus:ring-primary"
                spellCheck={false}
              />
              <Button
                onClick={handleLoad}
                size="sm"
                className="flex-shrink-0 font-bold"
                disabled={!input.trim()}
              >
                読み込む
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
