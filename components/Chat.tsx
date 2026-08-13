"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ArrowDownToLine, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onApplyCode: (code: string) => void;
  currentSource: string;
};

type Segment =
  | { kind: "text"; content: string }
  | { kind: "code"; lang: string; content: string };

function splitSegments(text: string): Segment[] {
  const out: Segment[] = [];
  const re = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ kind: "text", content: text.slice(last, m.index) });
    }
    out.push({ kind: "code", lang: m[1] || "text", content: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push({ kind: "text", content: text.slice(last) });
  }
  return out;
}

export function Chat({ onApplyCode, currentSource }: Props) {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || status === "streaming" || status === "submitted") return;
    sendMessage(
      { text: trimmed },
      { body: { currentSource } },
    );
    setInput("");
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400">
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        <span>Spectrum Co-pilot</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="px-2 text-sm text-zinc-500">
            <p className="mb-3">
              Describe the game you want. I&apos;ll write the C, you hit Compile.
            </p>
            <div className="space-y-1.5 text-xs text-zinc-600">
              <p className="text-zinc-500 font-medium">Try:</p>
              <button
                onClick={() => setInput("Make a snake game with arrow keys")}
                className="block text-left hover:text-amber-400"
              >
                · Make a snake game with arrow keys
              </button>
              <button
                onClick={() =>
                  setInput("Add a bouncing ball that flashes the border")
                }
                className="block text-left hover:text-amber-400"
              >
                · A bouncing ball that flashes the border
              </button>
              <button
                onClick={() => setInput("Manic Miner style platformer skeleton")}
                className="block text-left hover:text-amber-400"
              >
                · Manic Miner style platformer skeleton
              </button>
            </div>
          </div>
        )}

        {messages.map((m) => {
          const text = m.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as { type: "text"; text: string }).text)
            .join("");
          const segments = splitSegments(text);
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-lg text-sm",
                isUser
                  ? "ml-6 bg-zinc-800/60 px-3 py-2 text-zinc-100"
                  : "mr-2 text-zinc-200",
              )}
            >
              {segments.map((seg, i) =>
                seg.kind === "text" ? (
                  <p
                    key={i}
                    className="whitespace-pre-wrap leading-relaxed [&:not(:first-child)]:mt-2"
                  >
                    {seg.content}
                  </p>
                ) : (
                  <div
                    key={i}
                    className="my-2 overflow-hidden rounded border border-zinc-800 bg-black"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 px-2 py-1 text-[10px] text-zinc-500">
                      <span className="uppercase tracking-wider">
                        {seg.lang}
                      </span>
                      {(seg.lang === "c" || seg.lang === "cpp") && (
                        <button
                          onClick={() => onApplyCode(seg.content)}
                          className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-amber-400 hover:bg-amber-500/20"
                        >
                          <ArrowDownToLine className="h-3 w-3" />
                          Apply to editor
                        </button>
                      )}
                    </div>
                    <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-zinc-200">
                      <code>{seg.content}</code>
                    </pre>
                  </div>
                ),
              )}
            </div>
          );
        })}

        {(status === "streaming" || status === "submitted") && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            thinking…
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 p-3">
        <div className="flex gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 focus-within:border-amber-500/40">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Describe your game idea…"
            rows={2}
            className="flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || status === "streaming"}
            className="self-end rounded-md bg-amber-500/90 p-1.5 text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-zinc-600">
          ⏎ to send · ⇧⏎ for newline · The model sees your current editor source.
        </p>
      </div>
    </div>
  );
}
