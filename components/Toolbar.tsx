"use client";

import { Play, RotateCcw, Loader2, CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type CompileStatus = "idle" | "compiling" | "ok" | "error";

type Props = {
  status: CompileStatus;
  message: string;
  onCompile: () => void;
  onReset: () => void;
};

export function Toolbar({ status, message, onCompile, onReset }: Props) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-2">
      <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-100">
        <span className="text-amber-400">▶</span>
        <span>Spectrum Studio</span>
        <span className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
          48K · z88dk
        </span>
      </div>

      <div className="mx-3 h-5 w-px bg-zinc-800" />

      <button
        onClick={onCompile}
        disabled={status === "compiling"}
        className={cn(
          "flex items-center gap-1.5 rounded-md bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-black hover:bg-amber-400",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        title="Compile and run (⌘/Ctrl-Enter)"
      >
        {status === "compiling" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play className="h-3.5 w-3.5 fill-current" />
        )}
        Compile & Run
      </button>

      <button
        onClick={onReset}
        className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
        title="Reset emulator"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </button>

      <div
        className={cn(
          "ml-2 flex items-center gap-1.5 truncate text-xs",
          status === "error" && "text-red-400",
          status === "ok" && "text-emerald-400",
          (status === "idle" || status === "compiling") && "text-zinc-500",
        )}
      >
        {status === "ok" && <CircleCheck className="h-3.5 w-3.5 shrink-0" />}
        {status === "error" && <CircleAlert className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{message}</span>
      </div>
    </div>
  );
}
