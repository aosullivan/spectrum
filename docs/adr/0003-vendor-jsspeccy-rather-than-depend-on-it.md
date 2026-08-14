# Vendor JSSpeccy rather than depend on it

JSSpeccy 3 ships as a prebuilt bundle in `public/jsspeccy/`, loaded at runtime by injecting a script tag, instead of as an npm dependency. It has no package suited to embedding, and the emulator needs its ROMs, tape loaders and wasm core served from a stable path — which is what `public/` is.

## Consequences

JSSpeccy is GPLv3 while this project is MIT. The vendored copy is unmodified and carries its own `COPYING`, and it has to stay that way: patching it in place would raise the licensing question that leaving it alone avoids. Upgrades are a manual drop-in, not a version bump.
