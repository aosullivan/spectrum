"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { CodeEditor } from "@/components/CodeEditor";
import { Chat } from "@/components/Chat";
import { Toolbar, type CompileStatus } from "@/components/Toolbar";
import { DEFAULT_C_SOURCE } from "@/lib/default-source";
import type { EmulatorHandle } from "@/components/Emulator";

const Emulator = dynamic(
  () => import("@/components/Emulator").then((m) => m.Emulator),
  { ssr: false },
);

const LS_KEY = "spectrum-studio:source-v1";

export function Studio() {
  const [source, setSource] = useState<string>(DEFAULT_C_SOURCE);
  const [showEditor, setShowEditor] = useState(false);
  const [status, setStatus] = useState<CompileStatus>("idle");
  const [message, setMessage] = useState<string>("Ready. Hit Compile & Run.");
  const emulatorRef = useRef<EmulatorHandle | null>(null);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setSource(saved);
    } catch {}
  }, []);

  // Persist on change (debounced lightly).
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, source);
      } catch {}
    }, 300);
    return () => clearTimeout(id);
  }, [source]);

  const compile = useCallback(async () => {
    setStatus("compiling");
    setMessage("Compiling with z88dk…");
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, format: "sna" }),
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        const detail = ct.includes("application/json")
          ? (await res.json()).error
          : await res.text();
        setStatus("error");
        setMessage(detail || `Compile failed (${res.status})`);
        return;
      }

      const buf = new Uint8Array(await res.arrayBuffer());
      if (!emulatorRef.current) {
        setStatus("error");
        setMessage("Emulator not ready.");
        return;
      }
      await emulatorRef.current.load(buf, "game.sna");
      setStatus("ok");
      setMessage(`Loaded ${buf.byteLength} bytes — game running.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }, [source]);

  const reset = useCallback(() => {
    emulatorRef.current?.reset();
    setMessage("Emulator reset.");
    setStatus("idle");
  }, []);

  const applyCode = useCallback((code: string) => {
    setSource(code);
    setMessage("Code applied from co-pilot. Hit Compile & Run.");
    setStatus("idle");
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-black text-zinc-100">
      <Toolbar
        status={status}
        message={message}
        showEditor={showEditor}
        onCompile={compile}
        onReset={reset}
        onToggleEditor={() => setShowEditor((v) => !v)}
      />

      {/* Every Panel keeps a stable key so toggling the editor reorders the
          children without remounting the emulator and killing the running game. */}
      <Group orientation="horizontal" className="flex-1">
        {showEditor && (
          <Panel key="editor" defaultSize="38%" minSize="25%">
            <div className="h-full bg-[#1e1e1e]">
              <CodeEditor value={source} onChange={setSource} onCompile={compile} />
            </div>
          </Panel>
        )}

        {showEditor && (
          <Separator
            key="editor-sep"
            className="w-px bg-zinc-800 hover:bg-amber-500/40 data-[dragging=true]:bg-amber-500/70"
          />
        )}

        <Panel key="emulator" defaultSize={showEditor ? "37%" : "70%"} minSize="20%">
          <Emulator ref={emulatorRef} />
        </Panel>

        <Separator
          key="chat-sep"
          className="w-px bg-zinc-800 hover:bg-amber-500/40 data-[dragging=true]:bg-amber-500/70"
        />

        <Panel key="chat" defaultSize={showEditor ? "25%" : "30%"} minSize="18%">
          <Chat onApplyCode={applyCode} currentSource={source} />
        </Panel>
      </Group>
    </div>
  );
}
