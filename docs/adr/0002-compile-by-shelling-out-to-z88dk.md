# Compile by shelling out to z88dk

Turning C into a Spectrum tap needs z88dk, which has no browser or WASM build, so `/api/compile` runs `zcc` as a subprocess on the host and falls back to the `z88dk/z88dk` Docker image when `zcc` is not on `PATH`. The alternative — a hosted compile service — would drop the local install step, but it would put a network dependency and an account in front of a tool that is otherwise just `npm run dev`.

## Consequences

The app executes a compiler over arbitrary user-supplied C with no sandbox, so it is only safe where you trust everyone who can reach it: a dev machine, or a private host. Exposing it publicly needs real isolation first. It also constrains deployment to hosts that can run `zcc` or Docker, which rules out standard serverless platforms.
