# Agent Handoff

Workspace: `2dsidescroller`

Main files:

- `index.html`
- `server.js`
- `level.json`

## Current State

`index.html` is a single-canvas 2D side-scroller demo with:

- 60 FPS gated update/draw loop.
- Parallax background layers from `sprites/platform/background`.
- Foreground level from `Tileset.png` and `Trees.png`.
- Level editor UI with select/pan/add tools, mockup template overlay, snapping, localStorage fallback, JSON download, and save/load via `level.json`.
- `server.js` serves the demo and provides `/api/level` save/load endpoints for writing `level.json`.
- `level.json` is the saved level loaded first when available.

## Run

```bash
node server.js
```

Then open:

```text
http://localhost:8787
```

If testing from a static server on `localhost:5500`, keep `node server.js` running on `8787`; the page loads `level.json` from `5500` and saves to `8787`.

## Implemented Character Animations

Configured in the `sprites` object:

- `idle`: `_Idle (2).png`
- `run`: `_Run (1).png`
- `turn`: `_TurnAround.png`
- `roll`: `_Roll.png`
- `slideStart`: `_SlideTransitionStart.png`
- `slide`: `_Slide.png`
- `slideEnd`: `_SlideTransitionEnd.png`
- `jump`: `_Jump (1).png`
- `fall`: `_Fall.png`
- `wallClimb`: currently `_WallClimbNoMovement.png` in the active file context, despite earlier request to try `_WallClimb.png`; verify before changing.
- `crouchTransition`: `_CrouchTransition.png`
- `crouch`: `_Crouch.png`
- `crouchWalk`: `_CrouchWalk.png`
- `attack`: `_Attack.png`
- `attack2`: `_Attack2.png`
- `attackCombo`: `_AttackCombo.png`

Not intentionally added yet: attack no-movement sheets, `CrouchAll`, death, hit, dash, and other remaining sheets.

## Controls

Keyboard:

- Left/Right arrows: move
- Up/W: up input
- Space: jump
- Shift: roll
- Down/S: crouch if stationary, slide if already moving
- J: Attack
- K: Attack2
- L: AttackCombo
- E: toggle editor
- Left mouse: Attack
- Right mouse: Attack2

Gamepad/Xbox mapping:

- Left stick / D-pad: movement
- A: jump
- B: roll
- X: Attack
- Y: Attack2
- RB: AttackCombo
- Down: crouch/slide

## Important Notes

- User asked to remove wallhang and auto-climb on platform edge. Current active file context still shows `wallClimb` pointing to `_WallClimbNoMovement.png`; inspect current file before acting.
- There were user/formatter edits during the session, so always reread `index.html` before patching.
- `server.js` supports:
  - `GET /api/level`
  - `GET /api/level/`
  - `GET /api/level.json`
  - `OPTIONS /api/level`
  - `POST /api/level`
  - `PUT /api/level`
- If save shows 404/405, make sure the page is not using a stale cached `index.html` and that `node server.js` is running on `8787`.

## Validation Commands

Common validation used during the session:

```bash
node --check server.js
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/<script>([\s\S]*)<\/script>/);
if (!match) throw new Error('No inline script found');
new Function(match[1]);
JSON.parse(fs.readFileSync('level.json', 'utf8'));
console.log('Inline script and level.json syntax OK');
NODE
```

Browser-tested states include: idle/run/jump/fall, turn, roll, slide, crouch/crouchWalk, attacks, gamepad mock, editor save/load, and auto wall climb.
