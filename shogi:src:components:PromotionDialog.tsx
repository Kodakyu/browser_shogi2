import React from "react";
import { Move } from "@/lib/shogi";
import { Button } from "@/components/ui/button";

interface PromotionDialogProps {
  move: Move | null;
  onDecide: (promote: boolean) => void;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({ move, onDecide }) => {
  if (!move) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl font-serif p-6 min-w-[260px] flex flex-col items-center gap-4">
        <div className="text-xl font-bold text-foreground">成りますか？</div>
        <div className="text-sm text-muted-foreground">敵陣に入りました。</div>
        <div className="flex gap-4 mt-1">
          <Button
            variant="outline"
            className="w-28 h-14 text-lg border-primary text-primary hover:bg-primary/10"
            onClick={() => onDecide(false)}
            data-testid="button-no-promote"
          >
            不成
          </Button>
          <Button
            className="w-28 h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onDecide(true)}
            data-testid="button-promote"
          >
            成る
          </Button>
        </div>
      </div>
    </div>
  );
};
