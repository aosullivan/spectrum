"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Loader2,
  Play,
  RotateCcw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { EmulatorHandle } from "@/components/Emulator";

const Emulator = dynamic(
  () => import("@/components/Emulator").then((m) => m.Emulator),
  { ssr: false },
);

type Status = "idle" | "compiling" | "ok" | "error";

/**
 * Runs one file out of games/ — compile on load, rebuild on demand. The source
 * of truth is the file on disk, so whatever wrote it (an editor, an agent, a
 * script) just has to save and hit rebuild.
 */
export function Player({ src }: { src: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Starting emulator…");
  const [log, setLog] = useState<string | null>(null);
  const emulatorRef = useRef<EmulatorHandle | null>(null);
  const readyRef = useRef(false);

  const build = useCallback(async () => {
    if (!readyRef.current || !emulatorRef.current) return;
    setStatus("compiling");
    setMessage(`Compiling games/${src}…`);
    setLog(null);

    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: src }),
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) {
          const body = await res.json();
          setMessage(body.error || `Compile failed (${res.status})`);
          setLog(typeof body.log === "string" ? body.log : null);
        } else {
          setMessage((await res.text()) || `Compile failed (${res.status})`);
        }
        setStatus("error");
        return;
      }

      const buf = new Uint8Array(await res.arrayBuffer());
      await emulatorRef.current.loadTap(buf);
      setStatus("ok");
      setMessage(`${buf.byteLength} bytes — running.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }, [src]);

  const handleReady = useCallback(() => {
    readyRef.current = true;
    void build();
  }, [build]);

  // ⌘/Ctrl-Enter mirrors the studio's compile shortcut. Capture phase, because
  // JSSpeccy claims keydown for the Spectrum keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void build();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [build]);

  return (
    <div className="flex h-screen w-full flex-col bg-black text-zinc-100">
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-2">
        <Link
          href="/play"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200"
          title="All games"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>

        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-100">
          <span className="text-amber-400">▶</span>
          <span className="font-mono text-xs">games/{src}</span>
          <span className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            48K · z88dk
          </span>
        </div>

        <div className="mx-3 h-5 w-px bg-zinc-800" />

        <button
          onClick={() => void build()}
          disabled={status === "compiling"}
          className={cn(
            "flex items-center gap-1.5 rounded-md bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-black hover:bg-amber-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          title="Rebuild from disk (⌘/Ctrl-Enter)"
        >
          {status === "compiling" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          Rebuild
        </button>

        <button
          onClick={() => {
            emulatorRef.current?.reset();
            setStatus("idle");
            setMessage("Emulator reset.");
          }}
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

        <Link
          href="/"
          className="ml-auto shrink-0 text-xs text-zinc-500 hover:text-zinc-200"
        >
          Studio →
        </Link>
      </div>

      <div className="min-h-0 flex-1">
        <Emulator ref={emulatorRef} onReady={handleReady} />
      </div>

      {log && (
        <pre className="max-h-48 shrink-0 overflow-auto border-t border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-[11px] leading-relaxed text-zinc-400">
          {log}
        </pre>
      )}
    </div>
  );
}
