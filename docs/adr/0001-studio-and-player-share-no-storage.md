# Studio and Player share no storage

The Studio keeps its editor buffer in the browser's `localStorage`; the Player only ever reads `.c` files from `games/`. Neither can see the other's code, and that is the point: the Studio is a scratchpad that must never write to the repo, and `games/` is the interface for anything with filesystem access — a hand editor, a script, an agent. A single shared store would mean either the Studio quietly committing files, or `games/` becoming a cache that drifts from what is on disk.

## Consequences

The Studio cannot open a Game, and the Player cannot save one; moving code between them is copy and paste. Both compile through the same route with the same z88dk flags, so a Game and an editor buffer of identical text produce identical artifacts.
