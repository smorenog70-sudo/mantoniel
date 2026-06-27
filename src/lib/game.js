import { GENDER, TRIVIA, MOSTLIKELY, HANGMAN_WORDS, DRAW_WORDS } from './content';

export const GENDER_BONUS = 3;
export const TRIVIA_SECONDS = 20;
export const DRAW_SECONDS = 75;
export const MOSTLIKELY_SECONDS = 22;

// Modo fiesta: cantidad de mini-juegos al azar y pausas para ver resultados.
export const PARTY_GAMES = 15;
export const BET_SECONDS = 30;
export const INTRO_SECONDS = 5;
export const RESULT_SECONDS = 6;
export const DRAW_RESULT_SECONDS = 6;
export const HANG_RESULT_SECONDS = 5;

// Reemplaza {dad}/{mom} (y {papá}/{mamá}) por los nombres de los papás.
// Si no hay nombre, usa "Papá"/"Mamá" para que el texto siga teniendo sentido.
export function fill(text, dad, mom) {
  const d = (dad && String(dad).trim()) || 'Papá';
  const m = (mom && String(mom).trim()) || 'Mamá';
  return String(text || '')
    .replace(/\{dad\}/g, d)
    .replace(/\{mom\}/g, m)
    .replace(/\{papá\}/g, d)
    .replace(/\{mamá\}/g, m);
}

// Código corto de sala (sin caracteres ambiguos).
export function genCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// k índices distintos al azar de 0..n-1.
export function sampleIndices(n, k) {
  const all = [];
  for (let i = 0; i < n; i++) all.push(i);
  return shuffle(all).slice(0, Math.min(k, n));
}

// Normaliza texto para comparar adivinanzas (sin acentos, minúsculas).
export function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zñ0-9]/g, '')
    .trim();
}

export function colorOf(options, optId) {
  const o = (options || []).find((x) => x.id === optId);
  return o ? o.color : '#FFC94D';
}
export function labelOf(options, optId) {
  const o = (options || []).find((x) => x.id === optId);
  return o ? o.label : '';
}

export function maxKey(tally) {
  let best = null;
  let bv = -1;
  for (const k in tally) {
    if (tally[k] > bv) {
      bv = tally[k];
      best = k;
    }
  }
  return bv > 0 ? best : null;
}

// Conteo de una votación (trivia / más probable). answersForRound: {playerId: value}
export function tally(values) {
  const t = {};
  for (const k in values) {
    const v = values[k];
    if (v == null) continue;
    t[v] = (t[v] || 0) + 1;
  }
  return t;
}

// Reparte +1 a quien eligió la opción más votada (empate: todas las top).
function majorityDeltas(values) {
  const t = tally(values);
  let max = 0;
  for (const k in t) if (t[k] > max) max = t[k];
  const deltas = {};
  if (max <= 0) return deltas;
  const top = {};
  for (const k in t) if (t[k] === max) top[k] = true;
  for (const pid in values) if (top[values[pid]]) deltas[pid] = (deltas[pid] || 0) + 1;
  return deltas;
}

// Palabra oculta del ahorcado mostrada con guiones.
export function maskWord(word, lettersGuessed) {
  const set = new Set(lettersGuessed.map((x) => x.toUpperCase()));
  return word
    .split('')
    .map((ch) => (set.has(ch) ? ch : '_'))
    .join(' ');
}

export function hangmanState(word, letters) {
  const guessed = new Set(letters.map((x) => x.l.toUpperCase()));
  const wrong = [...guessed].filter((l) => word.indexOf(l) < 0);
  const solved = word.split('').every((ch) => guessed.has(ch));
  return { wrong, wrongCount: wrong.length, solved, lives: 6 - wrong.length };
}

// Filtra el mapa de respuestas para una ronda concreta -> {playerId: value}
function answersForRound(answers, instance, round) {
  const prefix = instance + ':' + round + ':';
  const out = {};
  for (const key in answers) {
    if (key.indexOf(prefix) === 0) out[key.slice(prefix.length)] = answers[key];
  }
  return out;
}

/* ---------- PUNTOS por juego (se acreditan al terminar el juego) ----------
 * Recibe un "plain state" extraído del storage. Devuelve { playerId: delta }.
 */
export function computeDeltas(plain) {
  const { screen, instance, rounds, players } = plain;
  const playerIds = Object.keys(players);
  const deltas = {};
  const add = (id, n) => {
    if (id != null) deltas[id] = (deltas[id] || 0) + n;
  };

  if (screen === 'trivia' || screen === 'mostlikely') {
    for (let r = 0; r < rounds; r++) {
      const vals = answersForRound(plain.answers, instance, r);
      const d = majorityDeltas(vals);
      for (const id in d) add(id, d[id]);
    }
  } else if (screen === 'hangman') {
    const word = HANGMAN_WORDS[plain.contentIndex] || '';
    // +1 por cada letra correcta a quien la adivinó.
    (plain.letters || []).forEach((entry) => {
      const L = String(entry.l || '').toUpperCase();
      if (word.indexOf(L) >= 0) add(entry.by, 1);
    });
  } else if (screen === 'draw') {
    for (let r = 0; r < rounds; r++) {
      const drawer = playerIds[r % Math.max(1, playerIds.length)];
      const correct = (plain.guesses || [])
        .filter((g) => g.round === r && g.correct)
        .sort((a, b) => a.at - b.at);
      correct.forEach((g, i) => add(g.by, i === 0 ? 3 : i === 1 ? 2 : 1));
      if (correct.length > 0) add(drawer, 2); // premio al dibujante
    }
  }
  return deltas;
}

// Tabla de posiciones a partir de players {id:{name,avatar}} y points {id:n}.
export function leaderboard(players, points) {
  const board = Object.keys(players).map((id) => ({
    id,
    name: players[id].name,
    avatar: players[id].avatar,
    score: (points && points[id]) || 0,
  }));
  board.sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)));
  return board;
}

export const revealEmoji = (label) => {
  const l = (label || '').toLowerCase();
  if (l.indexOf('hombre') >= 0 || l.indexOf('niño') >= 0) return '👦';
  if (l.indexOf('mujer') >= 0 || l.indexOf('niña') >= 0) return '👧';
  if (l.indexOf('therian') >= 0) return '🐺';
  if (l.indexOf('comunista') >= 0) return '☭';
  return '🎉';
};

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Rango [0..n-1]
function range(n) {
  const a = [];
  for (let i = 0; i < n; i++) a.push(i);
  return a;
}

// Arma la lista de la fiesta: n mini-juegos mezclados, sin repetir contenido
// dentro de cada tipo y evitando el mismo tipo dos veces seguidas.
// Devuelve [{ t: tipo, ci: índice de contenido }]
export function buildPlaylist(n) {
  const want = { trivia: 5, mostlikely: 4, hangman: 3, draw: 3 };
  let types = [];
  Object.keys(want).forEach((t) => {
    for (let i = 0; i < want[t]; i++) types.push(t);
  });
  types = shuffle(types);
  // Si piden más de los disponibles, rellena repitiendo tipos.
  while (types.length < n) types.push(['trivia', 'mostlikely', 'hangman', 'draw'][types.length % 4]);
  types = types.slice(0, n);
  // Evita el mismo tipo adyacente (pasada ligera).
  for (let i = 1; i < types.length; i++) {
    if (types[i] === types[i - 1]) {
      for (let j = i + 1; j < types.length; j++) {
        if (types[j] !== types[i]) {
          const tmp = types[i];
          types[i] = types[j];
          types[j] = tmp;
          break;
        }
      }
    }
  }
  const pools = {
    trivia: shuffle(range(TRIVIA.length)),
    mostlikely: shuffle(range(MOSTLIKELY.length)),
    hangman: shuffle(range(HANGMAN_WORDS.length)),
    draw: shuffle(range(DRAW_WORDS.length)),
  };
  const ctr = { trivia: 0, mostlikely: 0, hangman: 0, draw: 0 };
  return types.map((t) => {
    const pool = pools[t];
    const ci = pool[ctr[t] % pool.length];
    ctr[t]++;
    return { t, ci };
  });
}

// Puntos de UNA sola ronda (modo fiesta). plain: { type, instance, contentIndex,
// drawerId, players, answers, guesses, letters }. Devuelve { id: delta }.
export function computeStepDeltas(plain) {
  const { type } = plain;
  const deltas = {};
  const add = (id, n) => {
    if (id != null) deltas[id] = (deltas[id] || 0) + n;
  };
  if (type === 'trivia' || type === 'mostlikely') {
    const vals = answersForRound(plain.answers, plain.instance, 0);
    const d = majorityDeltas(vals);
    for (const id in d) add(id, d[id]);
  } else if (type === 'hangman') {
    const word = HANGMAN_WORDS[plain.contentIndex] || '';
    (plain.letters || []).forEach((entry) => {
      const L = String(entry.l || '').toUpperCase();
      if (word.indexOf(L) >= 0) add(entry.by, 1);
    });
  } else if (type === 'draw') {
    const correct = (plain.guesses || []).filter((g) => g.round === 0 && g.correct).sort((a, b) => a.at - b.at);
    correct.forEach((g, i) => add(g.by, i === 0 ? 3 : i === 1 ? 2 : 1));
    if (correct.length > 0) add(plain.drawerId, 2);
  }
  return deltas;
}

export { GENDER, TRIVIA, MOSTLIKELY, HANGMAN_WORDS, DRAW_WORDS };
