import { useEffect, useRef } from 'react';
import { useStorage, useMutation } from '@liveblocks/react';
import {
  computeDeltas,
  leaderboard,
  colorOf,
  sampleIndices,
  GENDER_BONUS,
  TRIVIA_SECONDS,
  DRAW_SECONDS,
} from './lib/game';
import { GENDER, TRIVIA, MOSTLIKELY, HANGMAN_WORDS, DRAW_WORDS } from './lib/content';
import { Sound } from './lib/sound';
import { fireConfetti } from './lib/confetti';

import Join from './screens/Join';
import Hub from './screens/Hub';
import Bet from './screens/Bet';
import Trivia from './screens/Trivia';
import MostLikely from './screens/MostLikely';
import Hangman from './screens/Hangman';
import Draw from './screens/Draw';
import Reveal from './screens/Reveal';

// Helpers sobre estructuras Live (se usan dentro de mutaciones).
function snapMap(m) {
  const o = {};
  m.forEach((v, k) => {
    o[k] = v;
  });
  return o;
}
function clearList(l) {
  while (l.length > 0) l.delete(0);
}
function clearMap(m) {
  const ks = [];
  m.forEach((_, k) => ks.push(k));
  ks.forEach((k) => m.delete(k));
}

function Loading({ text }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 90 }}>
      <span className="spinner" />
      <p className="muted">{text || 'Cargando…'}</p>
    </div>
  );
}
function NotFound({ onBack }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 70 }}>
      <div style={{ fontSize: 48 }}>🤔</div>
      <h2 className="display" style={{ color: '#fff' }}>Sala no encontrada</h2>
      <p className="muted">Revisa el código con quien te invitó.</p>
      <button className="btn btn-light" style={{ marginTop: 12 }} onClick={onBack}>
        ← Volver
      </button>
    </div>
  );
}

export default function Room({ myId, wantHost, saved, onLeave }) {
  const game = useStorage((root) => root.game);
  const playersMap = useStorage((root) => root.players);
  const pointsMap = useStorage((root) => root.points);
  const betsMap = useStorage((root) => root.bets);

  // ---------- mutaciones ----------
  const join = useMutation(
    ({ storage }, name, avatar) => {
      const g = storage.get('game');
      if (wantHost && !g.get('hostId')) g.set('hostId', myId);
      storage.get('players').set(myId, { name, avatar });
      if (storage.get('points').get(myId) == null) storage.get('points').set(myId, 0);
    },
    [myId, wantHost]
  );

  const startGame = useMutation(({ storage }, screen) => {
    const g = storage.get('game');
    const inst = (g.get('instance') || 0) + 1;
    clearList(storage.get('segments'));
    clearList(storage.get('guesses'));
    clearList(storage.get('letters'));
    g.update({ screen, instance: inst, round: 0, awarded: false, revealed: null, timerEnd: null, drawerId: null, order: [], contentIndex: 0, rounds: 1, phase: 'idle' });

    if (screen === 'bet') {
      g.set('phase', 'open');
    } else if (screen === 'trivia') {
      const rounds = Math.min(6, TRIVIA.length);
      const order = sampleIndices(TRIVIA.length, rounds);
      g.update({ rounds, order, contentIndex: order[0], phase: 'q', timerEnd: Date.now() + TRIVIA_SECONDS * 1000 });
    } else if (screen === 'mostlikely') {
      const rounds = Math.min(5, MOSTLIKELY.length);
      const order = sampleIndices(MOSTLIKELY.length, rounds);
      g.update({ rounds, order, contentIndex: order[0], phase: 'vote' });
    } else if (screen === 'hangman') {
      g.update({ rounds: 1, contentIndex: Math.floor(Math.random() * HANGMAN_WORDS.length), phase: 'play' });
    } else if (screen === 'draw') {
      const ids = Array.from(storage.get('players').keys());
      const rounds = Math.max(1, Math.min(4, ids.length));
      const order = sampleIndices(DRAW_WORDS.length, rounds);
      g.update({ rounds, order, contentIndex: order[0], drawerId: ids[0] || null, phase: 'draw', timerEnd: Date.now() + DRAW_SECONDS * 1000 });
    }
  }, []);

  const submitAnswer = useMutation(
    ({ storage }, value) => {
      const g = storage.get('game');
      storage.get('answers').set(g.get('instance') + ':' + g.get('round') + ':' + myId, value);
    },
    [myId]
  );

  const placeBet = useMutation(({ storage }, opt) => storage.get('bets').set(myId, opt), [myId]);

  const triviaShowResult = useMutation(({ storage }) => {
    const g = storage.get('game');
    if (g.get('screen') === 'trivia' && g.get('phase') === 'q') g.set('phase', 'result');
  }, []);
  const triviaBack = useMutation(({ storage }) => {
    storage.get('game').update({ phase: 'q', timerEnd: Date.now() + TRIVIA_SECONDS * 1000 });
  }, []);
  const triviaNext = useMutation(({ storage }) => {
    const g = storage.get('game');
    const round = g.get('round') + 1;
    if (round >= g.get('rounds')) return;
    g.update({ round, contentIndex: g.get('order')[round], phase: 'q', timerEnd: Date.now() + TRIVIA_SECONDS * 1000 });
  }, []);

  const mlShowResult = useMutation(({ storage }) => {
    const g = storage.get('game');
    if (g.get('screen') === 'mostlikely' && g.get('phase') === 'vote') g.set('phase', 'result');
  }, []);
  const mlBack = useMutation(({ storage }) => storage.get('game').set('phase', 'vote'), []);
  const mlNext = useMutation(({ storage }) => {
    const g = storage.get('game');
    const round = g.get('round') + 1;
    if (round >= g.get('rounds')) return;
    g.update({ round, contentIndex: g.get('order')[round], phase: 'vote' });
  }, []);

  const guessLetter = useMutation(
    ({ storage }, L) => {
      const letters = storage.get('letters');
      if (letters.toArray().some((x) => String(x.l).toUpperCase() === L)) return;
      letters.push({ l: L, by: myId });
    },
    [myId]
  );

  const pushSegment = useMutation(({ storage }, seg) => storage.get('segments').push(seg), []);
  const clearCanvas = useMutation(({ storage }) => clearList(storage.get('segments')), []);
  const guessDraw = useMutation(
    ({ storage }, text) => {
      const g = storage.get('game');
      const word = DRAW_WORDS[g.get('contentIndex')] || '';
      const correct = require_norm(text) === require_norm(word);
      storage.get('guesses').push({ by: myId, text: correct ? '' : text, correct, round: g.get('round'), at: Date.now() });
    },
    [myId]
  );

  const drawNext = useMutation(({ storage }) => {
    const g = storage.get('game');
    const round = g.get('round') + 1;
    if (round >= g.get('rounds')) return;
    const ids = Array.from(storage.get('players').keys());
    clearList(storage.get('segments'));
    g.update({ round, contentIndex: g.get('order')[round], drawerId: ids[round % Math.max(1, ids.length)] || null, phase: 'draw', timerEnd: Date.now() + DRAW_SECONDS * 1000 });
  }, []);

  const finishGame = useMutation(({ storage }) => {
    const g = storage.get('game');
    if (!g.get('awarded')) {
      const plain = {
        screen: g.get('screen'),
        instance: g.get('instance'),
        rounds: g.get('rounds'),
        contentIndex: g.get('contentIndex'),
        players: snapMap(storage.get('players')),
        answers: snapMap(storage.get('answers')),
        guesses: storage.get('guesses').toArray(),
        letters: storage.get('letters').toArray(),
      };
      const deltas = computeDeltas(plain);
      const pts = storage.get('points');
      for (const id in deltas) pts.set(id, (pts.get(id) || 0) + deltas[id]);
      g.set('awarded', true);
    }
    g.update({ screen: 'hub', phase: 'idle', timerEnd: null });
  }, []);

  const goReveal = useMutation(({ storage }) => {
    const g = storage.get('game');
    g.update({ screen: 'reveal', phase: g.get('revealed') ? 'done' : 'pending', timerEnd: null });
  }, []);
  const revealGender = useMutation(({ storage }, opt) => {
    const g = storage.get('game');
    if (g.get('revealed')) return;
    g.update({ revealed: opt, phase: 'done' });
    const bets = snapMap(storage.get('bets'));
    const pts = storage.get('points');
    for (const id in bets) if (bets[id] === opt) pts.set(id, (pts.get(id) || 0) + GENDER_BONUS);
  }, []);
  const backToHub = useMutation(({ storage }) => storage.get('game').update({ screen: 'hub', phase: 'idle', timerEnd: null }), []);
  const resetParty = useMutation(({ storage }) => {
    const pts = storage.get('points');
    const pk = [];
    pts.forEach((_, k) => pk.push(k));
    pk.forEach((k) => pts.set(k, 0));
    clearMap(storage.get('bets'));
    clearMap(storage.get('answers'));
    clearList(storage.get('segments'));
    clearList(storage.get('guesses'));
    clearList(storage.get('letters'));
    storage.get('game').update({ screen: 'hub', phase: 'idle', revealed: null, awarded: true, round: 0, rounds: 0 });
  }, []);

  // ---------- efectos: audio + confetti en transiciones ----------
  const fxKey = useRef('');
  useEffect(() => {
    const h = () => Sound.unlock();
    window.addEventListener('pointerdown', h);
    return () => window.removeEventListener('pointerdown', h);
  }, []);
  useEffect(() => {
    if (!game) return;
    if ((game.screen === 'trivia' || game.screen === 'mostlikely') && game.phase === 'result') {
      const k = 'res:' + game.screen + ':' + game.instance + ':' + game.round;
      if (fxKey.current !== k) {
        fxKey.current = k;
        Sound.results();
        fireConfetti(['#FFC94D', '#FBF7F0', '#fff', '#56C596']);
      }
    }
    if (game.screen === 'reveal' && game.revealed) {
      const k = 'rev:' + game.revealed;
      if (fxKey.current !== k) {
        fxKey.current = k;
        const col = colorOf(GENDER.options, game.revealed);
        Sound.reveal();
        fireConfetti([col, '#FFC94D', '#fff', col]);
      }
    }
  }, [game]);

  // ---------- ruteo ----------
  if (game == null || playersMap == null) return <Loading text="Conectando a la sala…" />;

  const players = playersMap ? Array.from(playersMap, ([id, v]) => ({ id, ...v })) : [];
  const playersObj = Object.fromEntries(playersMap || []);
  const points = pointsMap ? Object.fromEntries(pointsMap) : {};
  const board = leaderboard(playersObj, points);
  const betsObj = Object.fromEntries(betsMap || []);
  const betsCount = betsMap ? betsMap.size : 0;
  const me = playersMap.get(myId);
  const isHost = game.hostId === myId;

  if (!wantHost && game.hostId == null && !me) return <NotFound onBack={onLeave} />;

  if (!me) {
    const started = game.screen !== 'hub' || betsCount > 0;
    const doJoin = (n, a) => {
      try {
        localStorage.setItem('grUser', JSON.stringify({ name: n, avatar: a }));
      } catch (e) {}
      return join(n, a);
    };
    return <Join roomCode={roomCodeFromUrl()} started={started} saved={saved} onJoin={doJoin} onBack={onLeave} />;
  }

  const actions = {
    startGame, finishGame, submitAnswer, placeBet,
    triviaShowResult, triviaBack, triviaNext,
    mlShowResult, mlBack, mlNext,
    guessLetter, pushSegment, clearCanvas, guessDraw, drawNext,
    goReveal, revealGender, backToHub, resetParty,
  };
  const common = { game, players, board, myId, isHost, actions };

  switch (game.screen) {
    case 'bet':
      return <Bet {...common} bets={betsObj} />;
    case 'trivia':
      return <Trivia {...common} />;
    case 'mostlikely':
      return <MostLikely {...common} />;
    case 'hangman':
      return <Hangman {...common} />;
    case 'draw':
      return <Draw {...common} />;
    case 'reveal':
      return <Reveal {...common} />;
    case 'hub':
    default:
      return <Hub {...common} roomCode={roomCodeFromUrl()} betsCount={betsCount} />;
  }
}

function roomCodeFromUrl() {
  try {
    return (new URLSearchParams(location.search).get('room') || '').toUpperCase();
  } catch (e) {
    return '';
  }
}
function require_norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zñ0-9]/g, '')
    .trim();
}
