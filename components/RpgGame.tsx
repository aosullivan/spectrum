"use client";

import { useEffect, useRef, useState } from "react";

import { Game, emptyInput, type InputState } from "@/lib/rpg/game";
import { SCREEN_H, SCREEN_W, Screen } from "@/lib/rpg/screen";

const STEP = 1 / 60;

/** Largest integer zoom of the 256x192 frame that fits the container. */
function fittingZoom(width: number, height: number): number {
  return Math.max(1, Math.min(Math.floor(width / SCREEN_W), Math.floor(height / SCREEN_H)));
}

export function RpgGame() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crt, setCrt] = useState(false);
  const [zoom, setZoom] = useState(4);

  useEffect(() => {
    const host = hostRef.current;
    const display = canvasRef.current;
    if (!host || !display) return;

    const buffer = document.createElement("canvas");
    buffer.width = SCREEN_W;
    buffer.height = SCREEN_H;
    const bufferCtx = buffer.getContext("2d");
    const displayCtx = display.getContext("2d");
    if (!bufferCtx || !displayCtx) return;

    const screen = new Screen(bufferCtx);
    const game = new Game();
    const input = emptyInput();

    type HeldKey = {
      [K in keyof InputState]: InputState[K] extends boolean ? K : never;
    }[keyof InputState];

    const keymap: Record<string, HeldKey> = {
      KeyW: "forward",
      ArrowUp: "forward",
      KeyS: "back",
      ArrowDown: "back",
      KeyA: "left",
      ArrowLeft: "left",
      KeyD: "right",
      ArrowRight: "right",
      ShiftLeft: "boost",
      ShiftRight: "boost",
    };

    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (down && e.code === "KeyC") {
        setCrt((v) => !v);
        return;
      }
      // Commands are edge-triggered: the game consumes them and key-repeat
      // must not turn one press into several actions.
      if (e.code === "Space") {
        if (down && !e.repeat) input.fire = true;
        e.preventDefault();
        return;
      }
      if (e.code === "KeyE" || e.code === "Enter") {
        if (down && !e.repeat) input.interact = true;
        e.preventDefault();
        return;
      }
      // The area map. Escape closes it too, but only closes.
      if (e.code === "KeyM" || e.code === "Escape") {
        if (down && !e.repeat) input.toggleMap = true;
        e.preventDefault();
        return;
      }
      const bind = keymap[e.code];
      if (bind) {
        input[bind] = down;
        e.preventDefault();
      }
    };
    const onKeyDown = onKey(true);
    const onKeyUp = onKey(false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const observer = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      setZoom(fittingZoom(box.width, box.height));
    });
    const initialResizeRaf = requestAnimationFrame(() => {
      setZoom(fittingZoom(host.clientWidth, host.clientHeight));
    });
    observer.observe(host);

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      acc += Math.min(0.25, (now - last) / 1000);
      last = now;
      while (acc >= STEP) {
        game.update(STEP, input);
        acc -= STEP;
      }
      game.render(screen);
      screen.present();
      displayCtx.imageSmoothingEnabled = false;
      displayCtx.drawImage(buffer, 0, 0, display.width, display.height);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(initialResizeRaf);
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <div className="flex h-dvh bg-black">
      <div ref={hostRef} className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative" style={{ width: SCREEN_W * zoom, height: SCREEN_H * zoom }}>
          <canvas
            ref={canvasRef}
            width={SCREEN_W * zoom}
            height={SCREEN_H * zoom}
            className="block"
            style={{ imageRendering: "pixelated" }}
          />
          {crt && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.22) 3px), radial-gradient(ellipse at center, rgba(0,0,0,0) 62%, rgba(0,0,0,0.35) 100%)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
