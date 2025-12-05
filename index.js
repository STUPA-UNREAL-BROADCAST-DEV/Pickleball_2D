const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'state.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const REMOTE_SOURCE_URL = process.env.REMOTE_SOURCE_URL || 'https://script.google.com/macros/s/AKfycbx-FlK-9XeFI1pD5_A70G__gwnhco61Dh38_vkmjgKsi6tb0hZpBktQhOblH0LFzqdt/exec';
const REMOTE_POLL_MS = Number(process.env.REMOTE_POLL_MS || 1000);

const defaultState = {
  selected_game: 1,
  rally_count: 0,
  player_a_name: 'Player A',
  player_a_points_on_serve: 0,
  player_a_forced_errors: 0,
  player_a_unforced_errors: 0,
  player_a_smash_wins: 0,
  player_a_lob_wins: 0,
  player_a_drive_wins: 0,
  player_a_net_errors: 0,
  player_a_missed_errors: 0,
  player_a_out_errors: 0,
  player_b_name: 'Player B',
  player_b_points_on_serve: 0,
  player_b_forced_errors: 0,
  player_b_unforced_errors: 0,
  player_b_smash_wins: 0,
  player_b_lob_wins: 0,
  player_b_drive_wins: 0,
  player_b_net_errors: 0,
  player_b_missed_errors: 0,
  player_b_out_errors: 0,
  singlebar_visible: true,
  doublebar_visible: true,
  doublebar_metric: 'points_on_serve',
  singleplayer_visible: true,
  singleplayer_player: 'a',
  singleplayer_metric: 'points_on_serve',
  triplebar_visible: true,
  triplebar_player: 'a',
  triplebar_type: 'shotwins',
  errorscomparison_visible: true,
  errorscomparison_player: 'a'
};

if (!fs.existsSync(DATA_FILE)) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2), 'utf8');
}

function extractRemoteState(raw, selectedGame = 1) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const gameKey = `game_${selectedGame}`;
  const game = raw.games && raw.games[gameKey];
  
  if (!game || !game.players) {
    return null;
  }

  const playerA = game.players.player_a || {};
  const playerB = game.players.player_b || {};
  const matchMetadata = raw.match_metadata || {};

  const normalized = {
    rally_count: matchMetadata.rally_count || 0,
    player_a_name: playerA.name || 'Player A',
    player_a_points_on_serve: playerA.points_on_serve || 0,
    player_a_forced_errors: playerA.forced_errors || 0,
    player_a_unforced_errors: playerA.unforced_errors || 0,
    player_a_smash_wins: playerA.smash_wins || 0,
    player_a_lob_wins: playerA.lob_wins || 0,
    player_a_drive_wins: playerA.drive_wins || 0,
    player_a_net_errors: playerA.net || 0,
    player_a_missed_errors: playerA.missed || 0,
    player_a_out_errors: playerA.out || 0,
    player_b_name: playerB.name || 'Player B',
    player_b_points_on_serve: playerB.points_on_serve || 0,
    player_b_forced_errors: playerB.forced_errors || 0,
    player_b_unforced_errors: playerB.unforced_errors || 0,
    player_b_smash_wins: playerB.smash_wins || 0,
    player_b_lob_wins: playerB.lob_wins || 0,
    player_b_drive_wins: playerB.drive_wins || 0,
    player_b_net_errors: playerB.net || 0,
    player_b_missed_errors: playerB.missed || 0,
    player_b_out_errors: playerB.out || 0
  };

  return normalized;
}

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

const allowedKeys = new Set([
  'selected_game',
  'rally_count',
  'player_a_name',
  'player_a_points_on_serve',
  'player_a_forced_errors',
  'player_a_unforced_errors',
  'player_a_smash_wins',
  'player_a_lob_wins',
  'player_a_drive_wins',
  'player_a_net_errors',
  'player_a_missed_errors',
  'player_a_out_errors',
  'player_b_name',
  'player_b_points_on_serve',
  'player_b_forced_errors',
  'player_b_unforced_errors',
  'player_b_smash_wins',
  'player_b_lob_wins',
  'player_b_drive_wins',
  'player_b_net_errors',
  'player_b_missed_errors',
  'player_b_out_errors',
  'singlebar_visible',
  'doublebar_visible',
  'doublebar_metric',
  'singleplayer_visible',
  'singleplayer_player',
  'singleplayer_metric',
  'triplebar_visible',
  'triplebar_player',
  'triplebar_type',
  'errorscomparison_visible',
  'errorscomparison_player'
]);

function readState() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch (error) {
    console.error('Failed to read state file. Falling back to defaults.', error);
    return { ...defaultState };
  }
}

let state = readState();

function writeState(nextState) {
  state = nextState;
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
}

app.get('/controller', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'controller.html'));
});

app.get('/singlebar', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'singlebar.html'));
});

app.get('/doublebar', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'doublebar.html'));
});

app.get('/singleplayer', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'singleplayer.html'));
});

app.get('/triplebar', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'triplebar.html'));
});

app.get('/api/state', (req, res) => {
  const current = readState();
  state = current;
  res.json(current);
});

app.post('/api/state', (req, res) => {
  const body = req.body || {};
  const latest = readState();
  const updated = { ...latest };

  Object.entries(body).forEach(([key, value]) => {
    if (!allowedKeys.has(key)) {
      return;
    }

    updated[key] = value;
  });

  writeState(updated);
  res.json(updated);
});

async function pollRemoteState() {
  if (!REMOTE_SOURCE_URL) {
    return;
  }

  try {
    const response = await fetch(REMOTE_SOURCE_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const remoteJson = await response.json();
    const currentState = readState();
    const selectedGame = currentState.selected_game || 1;
    
    const remoteState = extractRemoteState(remoteJson, selectedGame);
    if (!remoteState) {
      return;
    }

    // Preserve selected_game, visibility settings, and local-only fields
    // Only update fields that exist in remoteState (don't overwrite with defaults)
    const nextState = { ...currentState };
    
    // Update only fields that exist in remoteState
    Object.keys(remoteState).forEach(key => {
      if (remoteState[key] !== undefined && remoteState[key] !== null) {
        nextState[key] = remoteState[key];
      }
    });
    
    // Preserve UI control settings
    nextState.selected_game = selectedGame;
    if (currentState.singlebar_visible !== undefined) nextState.singlebar_visible = currentState.singlebar_visible;
    if (currentState.doublebar_visible !== undefined) nextState.doublebar_visible = currentState.doublebar_visible;
    if (currentState.doublebar_metric) nextState.doublebar_metric = currentState.doublebar_metric;
    if (currentState.singleplayer_visible !== undefined) nextState.singleplayer_visible = currentState.singleplayer_visible;
    if (currentState.singleplayer_player) nextState.singleplayer_player = currentState.singleplayer_player;
    if (currentState.singleplayer_metric) nextState.singleplayer_metric = currentState.singleplayer_metric;
    if (currentState.triplebar_visible !== undefined) nextState.triplebar_visible = currentState.triplebar_visible;
    if (currentState.triplebar_player) nextState.triplebar_player = currentState.triplebar_player;
    if (currentState.triplebar_type) nextState.triplebar_type = currentState.triplebar_type;

    if (JSON.stringify(currentState) !== JSON.stringify(nextState)) {
      writeState(nextState);
    }
  } catch (error) {
    console.warn('Remote poll failed:', error.message);
  }
}

if (REMOTE_SOURCE_URL) {
  pollRemoteState();
  setInterval(pollRemoteState, REMOTE_POLL_MS);
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

