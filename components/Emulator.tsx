"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

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
  loadTap: (bytes: Uint8Array) => Promise<void>;
  reset: () => void;
};

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

export const Emulator = forwardRef<EmulatorHandle>(function Emulator(_, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<JSSpeccyInstance | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadJSSpeccy()
      .then(() => {
        if (cancelled || !hostRef.current || !window.JSSpeccy) return;
        instanceRef.current = window.JSSpeccy(hostRef.current, {
          zoom: 2,
          machine: 48,
          autoStart: true,
          // Defaults to false, which inserts the tape but leaves the Spectrum
          // sitting at its boot screen until someone types LOAD "".
          autoLoadTapes: true,
          sandbox: true,
          keyboardEnabled: true,
        });
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
    async loadTap(bytes: Uint8Array) {
      if (!instanceRef.current) throw new Error("Emulator not ready");
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      const ab = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([ab], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob) + "#game.tap";
      lastUrlRef.current = url;
      await instanceRef.current.openUrl(url);
    },
    reset() {
      instanceRef.current?.setMachine(48);
    },
  }));

  return (
    <div className="flex h-full w-full items-center justify-center bg-black p-4">
      <div
        ref={hostRef}
        className="jsspeccy-host max-w-full"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
});
