import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const runtime = "nodejs";
export const maxDuration = 60;

type CompileResult =
  | { ok: true; tap: Buffer; log: string }
  | { ok: false; error: string; log: string };

const MAX_SOURCE_BYTES = 1_000_000;

function runProcess(
  cmd: string,
  args: string[],
  cwd: string,
  stdin?: string,
): Promise<{ code: number | null; stdout: string; stderr: string; err?: NodeJS.ErrnoException }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => resolve({ code: null, stdout, stderr, err }));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    if (stdin !== undefined) {
      child.stdin.write(stdin);
      child.stdin.end();
    }
  });
}

async function compileWithLocalZcc(
  source: string,
  dir: string,
): Promise<CompileResult | null> {
  const zcc = process.env.ZCC ?? "zcc";
  const srcPath = join(dir, "game.c");
  const outBase = join(dir, "game");
  const tapPath = `${outBase}.tap`;

  await writeFile(srcPath, source);

  const { code, stdout, stderr, err } = await runProcess(
    zcc,
    [
      "+zx",
      "-vn",
      "-SO3",
      "-clib=sdcc_iy",
      "-o",
      outBase,
      srcPath,
      "-create-app",
    ],
    dir,
  );

  if (err && (err.code === "ENOENT" || err.code === "EACCES")) {
    return null;
  }

  const log = `${stdout}\n${stderr}`.trim();

  if (code !== 0) {
    return { ok: false, error: parseFirstError(log, srcPath) ?? `Compilation failed (exit ${code})`, log };
  }

  try {
    const tap = await readFile(tapPath);
    return { ok: true, tap, log };
  } catch {
    return { ok: false, error: "Compiled, but no .tap output produced", log };
  }
}

async function compileWithDocker(
  source: string,
  dir: string,
): Promise<CompileResult | null> {
  const srcPath = join(dir, "game.c");
  await writeFile(srcPath, source);

  // `docker --version` succeeds off the CLI binary alone, so it cannot tell a
  // stopped daemon from a missing install. `docker info` needs the daemon.
  const probe = await runProcess("docker", ["info"], dir);
  if (probe.err || probe.code !== 0) return null;

  const { code, stdout, stderr } = await runProcess(
    "docker",
    [
      "run",
      "--rm",
      // The z88dk image is published for linux/amd64 only; be explicit so
      // Apple Silicon hosts emulate it instead of warning on every build.
      "--platform",
      "linux/amd64",
      "-v",
      `${dir}:/src`,
      "-w",
      "/src",
      "z88dk/z88dk:latest",
      "zcc",
      "+zx",
      "-vn",
      "-SO3",
      "-clib=sdcc_iy",
      "-o",
      "game",
      "game.c",
      "-create-app",
    ],
    dir,
  );

  const log = `${stdout}\n${stderr}`.trim();

  if (code !== 0) {
    return { ok: false, error: parseFirstError(log, srcPath) ?? `Docker z88dk failed (exit ${code})`, log };
  }

  try {
    const tap = await readFile(join(dir, "game.tap"));
    return { ok: true, tap, log };
  } catch {
    return { ok: false, error: "Compiled, but no .tap output produced", log };
  }
}

// Pull the first diagnostic-looking line out of compiler output.
function parseFirstError(log: string, srcPath: string): string | null {
  const lines = log.split("\n");
  for (const line of lines) {
    if (/error:/i.test(line) || /^\s*[^:]+:\d+:\d+: /.test(line)) {
      return line.replace(srcPath, "game.c").trim();
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: { source?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const source = body.source;
  if (typeof source !== "string" || source.length === 0) {
    return NextResponse.json({ error: "Missing 'source' string" }, { status: 400 });
  }
  if (source.length > MAX_SOURCE_BYTES) {
    return NextResponse.json({ error: "Source too large" }, { status: 413 });
  }

  const dir = await mkdtemp(join(tmpdir(), "spectrum-build-"));

  try {
    let result = await compileWithLocalZcc(source, dir);
    if (result === null) {
      result = await compileWithDocker(source, dir);
    }
    if (result === null) {
      return NextResponse.json(
        {
          error:
            "No z88dk toolchain. Install zcc and put it on PATH (or set ZCC), " +
            "or start Docker so the z88dk/z88dk image can be used.",
        },
        { status: 503 },
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, log: result.log },
        { status: 422 },
      );
    }

    return new NextResponse(new Uint8Array(result.tap), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="game.tap"',
        "Cache-Control": "no-store",
      },
    });
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
