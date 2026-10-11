# The Hollow Stair

A compact, original turn-based tower RPG with first-person maze exploration. It uses vanilla HTML, CSS, and JavaScript; there is no build step, backend, or runtime dependency.

## Run locally

Open `index.html` in a browser, or serve the folder over HTTP (recommended for JavaScript modules and pointer lock):

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Click **Enter stairwell** or the game view to capture the mouse. Move with **WASD**, look with the mouse, and press **E** to swing and begin the floor's turn-based encounter. **Backspace** opens the menu. Press **Escape** to release the mouse pointer; click the game view to recapture it.

Browsers require a click gesture before pointer lock can start; focusing the tab alone cannot capture the cursor. Google sign-in/cloud sync is a visual placeholder. Progress saves in browser `localStorage`; the menu supports JSON save export and import.

## Gameplay

- Explore a generated first-person maze on each of 30 floors; use Attack, Persona skills, Guard, Items, and party targeting in turn-based encounters.
- Learn enemy elemental weaknesses/resistances to knock enemies down, earn One More actions, and finish with an All-Out Attack.
- Collect and equip Personas; spells depend on the active Persona. Patra, healing, buffs, debuffs, and status ailments are included.
- Choose one Shuffle Time card after each cleared floor: clout (cosmetic), EXP (levels/stats), an automatically equipped weapon, or an unlockable Persona.
- Find supply caches on floors 5, 10, 20, and 25. The Bellkeeper miniboss is on floor 15; Morrow, the Unlit, is on floor 30.

## GitHub Pages

1. Put the files at the repository root (or set Pages to the folder containing `index.html`).
2. In GitHub, open **Settings → Pages**, choose the branch and root folder, then save.
3. Keep the custom domain configured in Pages and use the DNS records GitHub specifies.

All resources are local and use relative paths, so the site works from a repository subpath or custom domain. No GitHub sign-in, upload, or deployment was performed for this local preparation.

## Test

```sh
npm test
```

The test suite uses Node's built-in runner. The published game itself has no dependency on Node or npm.
