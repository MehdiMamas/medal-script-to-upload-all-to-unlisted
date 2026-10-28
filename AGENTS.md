# AGENTS.md

## What it is
A single browser console script (`script.js`) that posts every on-device clip in the Medal library through Medal's own Post flow. README.md explains the purpose and limits.

## Run
Open the Medal library in Chrome while logged in, open DevTools Console, paste `script.js`, press Enter, and keep the tab in the foreground until it prints `=== DONE ===`.

## Gotchas
- It relies on Medal's current markup (`data-library-item`, `data-shape="on-device"`, the preview modal, the scroll container). If Medal changes its UI the script stops at the first missing element; update the selectors in `script.js`.
- No build, dependencies, tests or CI. Changes are checked by running it against a real library.
