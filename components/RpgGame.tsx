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
  const [crt, setCrt] = useState(true);
  const [zoom, setZoom] = useState(2);

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
      // Interact is edge-triggered: the game consumes it, key-repeat must
      // not fire it again or a conversation would flash past.
      if (e.code === "KeyE" || e.code === "Enter" || e.code === "Space") {
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

    // Mouse aims. Pointer lock is the good path (raw deltas, no cursor), but
    // embedded panes refuse it — fall back to steering toward the cursor's
    // offset from centre so aiming works everywhere.
    const onClick = () => {
      const locked = display.requestPointerLock() as unknown;
      if (locked instanceof Promise) locked.catch(() => {});
    };
    const onPointerMove = (e: MouseEvent) => {
      if (document.pointerLockElement === display) {
        input.mouseYaw += e.movementX * 0.0032;
        input.aim = 0;
        return;
      }
      const box = display.getBoundingClientRect();
      const offset = (e.clientX - (box.left + box.width / 2)) / (box.width / 2);
      const dead = 0.12;
      input.aim =
        Math.abs(offset) < dead
          ? 0
          : Math.max(-1, Math.min(1, (offset - Math.sign(offset) * dead) / (1 - dead)));
    };
    const onPointerLeave = () => {
      input.aim = 0;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    display.addEventListener("click", onClick);
    display.addEventListener("mousemove", onPointerMove);
    display.addEventListener("mouseleave", onPointerLeave);

    const observer = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      setZoom(fittingZoom(box.width, box.height));
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
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      display.removeEventListener("mousemove", onPointerMove);
      display.removeEventListener("mouseleave", onPointerLeave);
      display.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-black">
      <div ref={hostRef} className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative" style={{ width: SCREEN_W * zoom, height: SCREEN_H * zoom }}>
          <canvas
            ref={canvasRef}
            width={SCREEN_W * zoom}
            height={SCREEN_H * zoom}
            className="block cursor-crosshair"
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
      <p className="shrink-0 py-2 text-center font-mono text-xs text-zinc-600">
        WASD / arrows glide · shift boosts · E interacts · M opens the map ·
        click for mouse-look · C toggles CRT
      </p>
    </div>
  );
}
