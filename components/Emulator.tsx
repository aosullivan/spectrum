"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";

// Mirrors the object literal returned by window.JSSpeccy(). Note there is no
// reset() on the public API — the bundle keeps that on its internal emulator
// class, so re-selecting the machine is how you restart from out here.
type JSSpeccyInstance = {
  setZoom: (zoom: number) => void;
  setMachine: (model: 48 | 128 | 5) => void;
  openUrl: (url: string) => Promise<void> | void;
  openFileDialog: () => void;
  toggleFullscreen: () => void;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  exit: () => void;
};

type JSSpeccyOptions = {
  zoom?: number | "fullscreen";
  machine?: 48 | 128 | 5;
  autoStart?: boolean;
  autoLoadTapes?: boolean;
  sandbox?: boolean;
  keyboardEnabled?: boolean;
  openUrl?: string;
};

declare global {
  interface Window {
    JSSpeccy?: (el: HTMLElement, opts?: JSSpeccyOptions) => JSSpeccyInstance;
  }
}

export type EmulatorHandle = {
  // `filename` is not cosmetic: JSSpeccy picks its loader off the extension,
  // so a .sna is restored as a RAM image and a .tap goes in the tape deck.
  load: (bytes: Uint8Array, filename: string) => Promise<void>;
  reset: () => void;
  focus: () => void;
  sendKeys: (sequence: string) => Promise<void>;
};

// JSSpeccy's key table is looked up by legacy keyCode first, event.key second,
// so both go on every synthetic event.
type KeyDescriptor = { key: string; keyCode: number };

const KEY_ALIASES: Record<string, KeyDescriptor> = {
  space: { key: " ", keyCode: 32 },
  enter: { key: "Enter", keyCode: 13 },
  shift: { key: "Shift", keyCode: 16 },
  up: { key: "ArrowUp", keyCode: 38 },
  down: { key: "ArrowDown", keyCode: 40 },
  left: { key: "ArrowLeft", keyCode: 37 },
  right: { key: "ArrowRight", keyCode: 39 },
};

function toKey(name: string): KeyDescriptor | null {
  const n = name.trim().toLowerCase();
  if (n in KEY_ALIASES) return KEY_ALIASES[n];
  // Letters and digits: the browser keyCode is the uppercase character code.
  if (/^[a-z0-9]$/.test(n)) return { key: n, keyCode: n.toUpperCase().charCodeAt(0) };
  return null;
}

// Hold and wait in animation frames rather than milliseconds. The emulator
// steps the Z80 from requestAnimationFrame, so a background tab runs it at a
// crawl — a wall-clock hold can start and end between two emulated frames and
// never be sampled by the keyboard matrix at all.
const DEFAULT_HOLD_FRAMES = 12;
const GAP_FRAMES = 6;
// z88dk's in_wait_key() waits for *no* key before it waits for one, so a key
// already down when the program reaches it wedges the program for good. Let
// the machine boot before touching the keyboard.
const LEAD_FRAMES = 60;

function waitFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let left = count;
    const tick = () => (left-- > 0 ? requestAnimationFrame(tick) : resolve());
    tick();
  });
}

let scriptLoaded: Promise<void> | null = null;

function loadJSSpeccy(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.JSSpeccy) return Promise.resolve();
  if (scriptLoaded) return scriptLoaded;

  scriptLoaded = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/jsspeccy/jsspeccy.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load JSSpeccy"));
    document.head.appendChild(s);
  });
  return scriptLoaded;
}

// The Spectrum screen is 320x240; JSSpeccy wraps it in a menu bar and a status
// bar and hard-codes the resulting pixel size inline from an integer zoom, so
// CSS alone cannot make it fit. Pick the largest zoom that still fits instead.
const SCREEN_W = 320;
const SCREEN_H = 240;
const CHROME_H = 60;
const PADDING = 32;

function fittingZoom(el: HTMLElement): number {
  const w = el.clientWidth - PADDING;
  const h = el.clientHeight - PADDING - CHROME_H;
  const z = Math.floor(Math.min(w / SCREEN_W, h / SCREEN_H));
  return Math.max(1, Math.min(4, Number.isFinite(z) ? z : 1));
}

type Props = {
  // The instance is built asynchronously (script fetch, then wasm), so a ref
  // alone can't tell a caller when loadTap will actually work.
  onReady?: () => void;
};

export const Emulator = forwardRef<EmulatorHandle, Props>(function Emulator(
  { onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<JSSpeccyInstance | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const zoomRef = useRef<number>(0);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  // JSSpeccy builds its own container div, gives it tabIndex 0 and routes key
  // events through it, so the Spectrum keyboard is dead until that div holds
  // focus. Clicking the canvas does it; so does this.
  const focusEmulator = useCallback(() => {
    hostRef.current?.querySelector<HTMLElement>("[tabindex]")?.focus();
  }, []);

  const fitToPane = useCallback(() => {
    const el = containerRef.current;
    const inst = instanceRef.current;
    if (!el || !inst) return;
    const z = fittingZoom(el);
    if (z === zoomRef.current) return;
    zoomRef.current = z;
    inst.setZoom(z);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(fitToPane);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitToPane]);

  useEffect(() => {
    let cancelled = false;
    loadJSSpeccy()
      .then(() => {
        if (cancelled || !hostRef.current || !containerRef.current || !window.JSSpeccy)
          return;
        instanceRef.current = window.JSSpeccy(hostRef.current, {
          zoom: fittingZoom(containerRef.current),
          machine: 48,
          autoStart: true,
          // Defaults to false, which inserts the tape but leaves the Spectrum
          // sitting at its boot screen until someone types LOAD "".
          autoLoadTapes: true,
          sandbox: true,
          keyboardEnabled: true,
        });
        zoomRef.current = fittingZoom(containerRef.current);
        onReadyRef.current?.();
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      cancelled = true;
      if (hostRef.current) hostRef.current.innerHTML = "";
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    async load(bytes: Uint8Array, filename: string) {
      if (!instanceRef.current) throw new Error("Emulator not ready");
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      const ab = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([ab], { type: "application/octet-stream" });
      // Keep the bare object URL for revoking — revokeObjectURL won't match a
      // string carrying the fragment, and 49K snapshots add up over a session
      // of rebuilds.
      const url = URL.createObjectURL(blob);
      lastUrlRef.current = url;
      await instanceRef.current.openUrl(`${url}#${filename}`);
    },
    reset() {
      instanceRef.current?.setMachine(48);
    },
    focus: focusEmulator,
    /**
     * Replay a key sequence into the machine: "space", "wait:120,space",
     * "left:40,space:30". `wait:N` idles N frames, `<key>:N` holds that key
     * for N frames.
     */
    async sendKeys(sequence: string) {
      const root = hostRef.current?.querySelector<HTMLElement>("[tabindex]");
      if (!root) throw new Error("Emulator not ready");
      focusEmulator();

      const tokens = sequence.split(",");
      if (!/^\s*wait:/i.test(tokens[0] ?? "")) await waitFrames(LEAD_FRAMES);

      for (const token of tokens) {
        const [name, framesRaw] = token.split(":");
        const frames = Number.parseInt(framesRaw ?? "", 10);

        if (name.trim().toLowerCase() === "wait") {
          await waitFrames(Number.isFinite(frames) ? frames : DEFAULT_HOLD_FRAMES);
          continue;
        }

        const key = toKey(name);
        if (!key) continue;

        const init: KeyboardEventInit = {
          key: key.key,
          keyCode: key.keyCode,
          which: key.keyCode,
          bubbles: true,
          cancelable: true,
        };
        root.dispatchEvent(new KeyboardEvent("keydown", init));
        await waitFrames(Number.isFinite(frames) ? frames : DEFAULT_HOLD_FRAMES);
        root.dispatchEvent(new KeyboardEvent("keyup", init));
        await waitFrames(GAP_FRAMES);
      }
    },
  }));

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden bg-black p-4"
    >
      <div
        ref={hostRef}
        className="jsspeccy-host max-w-full"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
});
