# Padel 2D Broadcast Graphics

Local Node/Express overlay package for OBS (or any NDI/browser source). It renders two transparent 1920×1080 overlays:

- **Single bar** – “Shots in Last Rally” counter.
- **Double bar** – “Serve Success / Forehand / Backhand” scoreboard that follows the selected metric.

Both overlays read live data from a Google Sheet endpoint (polled every second) or from the controller dashboard.

## Requirements

- Node.js 18+ (ships with npm and native `fetch`)
- OBS Studio or any broadcast software that can load a browser source sized 1920×1080

## Project Layout

```
padel_2d_cursor/
├─ controller.html        # controller UI (`/controller`)
├─ singlebar.html         # rally overlay (`/singlebar`)
├─ doublebar.html         # metrics overlay (`/doublebar`)
├─ public/styles.css      # shared styling + overlay positioning
├─ data/state.json        # local cache of live data
├─ index.js               # Express server + Google Sheet poller
└─ README.md
```

## Getting Started

1. Install dependencies
   ```sh
   npm install
   ```
2. Start the local server
   ```sh
   npm start
   ```
3. Open the controller dashboard and overlays
   - Controller: <http://localhost:3000/controller>
   - Rally overlay: <http://localhost:3000/singlebar>
   - Metrics overlay: <http://localhost:3000/doublebar>

### OBS Setup

- Create two Browser Sources in OBS, each sized **1920×1080**.
- Point the sources to the `/singlebar` and `/doublebar` URLs above.
- The graphics are positioned with absolute coordinates, so the full HD canvas keeps them in the correct location.

## Live Data Flow

- `index.js` polls the Google Apps Script endpoint defined by `REMOTE_SOURCE_URL` every second.
- Each response replaces the fields in `data/state.json` (falling back to `defaultState` if a key is missing).
- The controller also writes to `data/state.json`. If you need to override the sheet temporarily, set `REMOTE_SOURCE_URL` to an empty string or increase `REMOTE_POLL_MS`.

### Environment Overrides

Set these before `npm start` if you want to change defaults:

```sh
set REMOTE_SOURCE_URL=https://your/script/url
set REMOTE_POLL_MS=1000
set PORT=3000
```
(Use `export` on macOS/Linux.)

## Customisation

- **Positioning**: tweak the `top`/`left` values in `public/styles.css` under `.rally-chip.board` and `.metrics-card.board` if you want different screen locations.
- **Colours / Fonts / Sizes**: modify the `.rally-chip*` and `.metrics-card*` rules in `public/styles.css`. Player name cells wrap automatically for long names.
- **Controller look & feel**: adjust the `.controller`, `.toggle-button`, and form rules in the same stylesheet.
- **New metrics**: add keys to `defaultState` in `index.js`, update `allowedKeys`, then extend the overlays and controller inputs.

## Updating on Another PC

1. Copy the entire `padel_2d_cursor` folder.
2. Install Node.js 18+ on the target machine.
3. Run `npm install` followed by `npm start`.
4. Configure OBS with the same URLs and 1920×1080 browser sources.

## Troubleshooting

- **Overlays show all zeros**: check that the Google Sheet endpoint returns the expected values. The poller overwrites local edits each second.
- **No controller updates**: ensure the server is running on the correct port and that `REMOTE_SOURCE_URL` isn’t immediately overriding your edits.
- **Styling changes not visible**: hard refresh (`Ctrl+F5`) the overlay URL or refresh the OBS browser source.
- **Positioning off-screen**: make sure the browser source resolution is exactly 1920×1080.

## License

MIT – adapt freely for your broadcast workflow.
