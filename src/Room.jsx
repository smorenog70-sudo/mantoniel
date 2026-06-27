import { useEffect, useRef, useState } from 'react';
import { useStorage, useMutation, useBroadcastEvent, useEventListener } from '@liveblocks/react';
import {
  computeDeltas,
  computeStepDeltas,
  buildPlaylist,
  hangmanState,
  leaderboard,
  colorOf,
  sampleIndices,
  GENDER_BONUS,
  TRIVIA_SECONDS,
  DRAW_SECONDS,
  MOSTLIKELY_SECONDS,
  COUPLE_SECONDS,
  QUIP_WRITE_SECONDS,
  QUIP_VOTE_SECONDS,
  PREDICT_SECONDS,
  BET_SECONDS,
  INTRO_SECONDS,
  RESULT_SECONDS,
  DRAW_RESULT_SECONDS,
  HANG_RESULT_SECONDS,
  PARTY_GAMES,
} from './lib/game';
import { GENDER, TRIVIA, MOSTLIKELY, HANGMAN_WORDS, DRAW_WORDS } from './lib/content';
import { Sound } from './lib/sound';
import { fireConfetti } from './lib/confetti';

import Join from './screens/Join';
import Hub from './screens/Hub';
import Intro from './screens/Intro';
import Bet from './screens/Bet';
import Predict from './screens/Predict';
import Trivia from './screens/Trivia';
import Couple from './screens/Couple';
import Quip from './screens/Quip';
import MostLikely from './screens/MostLikely';
import Hangman from './screens/Hangman';
import Draw from './screens/Draw';
import Reveal from './screens/Reveal';
import { ReactionBar, ReactionsLayer } from './components/Reactions';

// ---- Helpers sobre estructuras Live (se usan dentro de mutaciones) ----
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
function clearTransient(storage) {
  clearList(storage.get('segments'));
  clearList(storage.get('guesses'));
  clearList(storage.get('letters'));
  clearMap(storage.get('answers'));
  clearMap(storage.get('texts'));
}

// Arranca un mini-juego del playlist (modo fiesta). idx fuera de rango => revelación.
// Empieza con una pantalla de "cómo se juega" (fase 'intro') y luego beginPlay().
function startSegment(g, storage, idx) {
  const playlist = g.get('playlist') || [];
  if (idx >= playlist.length) {
    g.update({ screen: 'reveal', phase: 'pending', timerEnd: null, resultEnd: null });
    return;
  }
  const seg = playlist[idx];
  const inst = (g.get('instance') || 0) + 1;
  clearTransient(storage);
  const base = {
    screen: seg.t,
    step: idx,
    instance: inst,
    round: 0,
    rounds: 1,
    contentIndex: seg.ci,
    drawerId: null,
    resultEnd: null,
    phase: 'intro',
    timerEnd: Date.now() + INTRO_SECONDS * 1000,
  };
  if (seg.t === 'draw') {
    const ids = Array.from(storage.get('players').keys());
    const turn = g.get('drawTurn') || 0;
    base.drawerId = ids.length ? ids[turn % ids.length] : null;
    g.set('drawTurn', turn + 1);
  }
  g.update(base);
}

// Termina la intro y arranca el juego con su cronómetro.
function beginPlay(g) {
  const screen = g.get('screen');
  if (screen === 'trivia') g.update({ phase: 'q', timerEnd: Date.now() + TRIVIA_SECONDS * 1000 });
  else if (screen === 'couple') g.update({ phase: 'q', timerEnd: Date.now() + COUPLE_SECONDS * 1000 });
  else if (screen === 'mostlikely') g.update({ phase: 'vote', timerEnd: Date.now() + MOSTLIKELY_SECONDS * 1000 });
  else if (screen === 'quip') g.update({ phase: 'write', timerEnd: Date.now() + QUIP_WRITE_SECONDS * 1000 });
  else if (screen === 'hangman') g.update({ phase: 'play', timerEnd: Date.now() + 60 * 1000 });
  else if (screen === 'draw') g.update({ phase: 'draw', timerEnd: Date.now() + DRAW_SECONDS * 1000 });
}

// Acredita los puntos de la ronda actual UNA sola vez (modo fiesta).
function commitStep(g, storage) {
  const step = g.get('step');
  if (g.get('lastScored') === step) return;
  const plain = {
    type: g.get('screen'),
    instance: g.get('instance'),
    contentIndex: g.get('contentIndex'),
    drawerId: g.get('drawerId'),
    coupleCorrect: storage.get('coupleAnswers').get(String(g.get('contentIndex'))),
    players: snapMap(storage.get('players')),
    answers: snapMap(storage.get('answers')),
    guesses: storage.get('guesses').toArray(),
    letters: storage.get('letters').toArray(),
  };
  const deltas = computeStepDeltas(plain);
  const pts = storage.get('points');
  for (const id in deltas) pts.set(id, (pts.get(id) || 0) + deltas[id]);
  g.set('lastScored', step);
}

function hangmanOverFrom(game, lettersList) {
  const word = HANGMAN_WORDS[game.contentIndex] || '';
  const letters = (lettersList || []).map((x) => ({ l: String(x.l).toUpperCase() }));
  const st = hangmanState(word, letters);
  return st.solved || st.lives <= 0;
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
function PartyBar({ step, len, onAdvance, onReveal }) {
  return (
    <div className="partybar">
      <span className="pb-step">🎉 {Math.min(step + 1, len)}/{len}</span>
      <button className="pb-btn" onClick={onAdvance}>
        ⏩ Avanzar
      </button>
      <button className="pb-btn gold" onClick={onReveal}>
        🎊 Final
      </button>
    </div>
  );
}

export default function Room({ myId, wantHost, saved, onLeave }) {
  const game = useStorage((root) => root.game);
  const playersMap = useStorage((root) => root.players);
  const pointsMap = useStorage((root) => root.points);
  const betsMap = useStorage((root) => root.bets);
  const coupleAnswersMap = useStorage((root) => root.coupleAnswers);
  const predictionsMap = useStorage((root) => root.predictions);
  const lettersForEngine = useStorage((root) => root.letters);

  // ---------- mutaciones (modo manual) ----------
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
    clearTransient(storage);
    g.update({ mode: 'manual', screen, instance: inst, round: 0, awarded: false, revealed: null, timerEnd: null, resultEnd: null, drawerId: null, order: [], contentIndex: 0, rounds: 1, phase: 'idle' });
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
  const setPrediction = useMutation(({ storage }, qIdx, opt) => storage.get('predictions').set(myId + ':' + qIdx, opt), [myId]);
  const submitText = useMutation(
    ({ storage }, text) => {
      const g = storage.get('game');
      storage.get('texts').set(g.get('instance') + ':' + myId, String(text || '').slice(0, 120));
    },
    [myId]
  );
  const setCoupleAnswer = useMutation(({ storage }, qIdx, opt) => storage.get('coupleAnswers').set(String(qIdx), opt), []);

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
    g.update({ screen: 'reveal', phase: g.get('revealed') ? 'done' : 'pending', timerEnd: null, resultEnd: null });
  }, []);
  const revealGender = useMutation(({ storage }, opt) => {
    const g = storage.get('game');
    if (g.get('revealed')) return;
    g.update({ revealed: opt, phase: 'done' });
    const bets = snapMap(storage.get('bets'));
    const pts = storage.get('points');
    for (const id in bets) if (bets[id] === opt) pts.set(id, (pts.get(id) || 0) + GENDER_BONUS);
  }, []);
  const backToHub = useMutation(({ storage }) => storage.get('game').update({ mode: 'manual', screen: 'hub', phase: 'idle', timerEnd: null, resultEnd: null }), []);
  const resetParty = useMutation(({ storage }) => {
    const pts = storage.get('points');
    const pk = [];
    pts.forEach((_, k) => pk.push(k));
    pk.forEach((k) => pts.set(k, 0));
    clearMap(storage.get('bets'));
    clearTransient(storage);
    storage.get('game').update({ mode: 'manual', screen: 'hub', phase: 'idle', revealed: null, awarded: true, round: 0, rounds: 0, step: 0, lastScored: -1 });
  }, []);

  // ---------- mutaciones (modo fiesta) ----------
  const setParents = useMutation(({ storage }, dad, mom) => {
    storage.get('game').update({ dad: (dad || '').slice(0, 24), mom: (mom || '').slice(0, 24) });
  }, []);

  const startParty = useMutation(({ storage }, dad, mom) => {
    const g = storage.get('game');
    const coupleIdx = Array.from(storage.get('coupleAnswers').keys()).map((k) => Number(k));
    const playlist = buildPlaylist(PARTY_GAMES, { coupleIdx });
    clearTransient(storage);
    clearMap(storage.get('predictions'));
    const pts = storage.get('points');
    const ks = [];
    pts.forEach((_, k) => ks.push(k));
    ks.forEach((k) => pts.set(k, 0));
    clearMap(storage.get('bets'));
    g.update({
      mode: 'party',
      dad: (dad || g.get('dad') || '').slice(0, 24),
      mom: (mom || g.get('mom') || '').slice(0, 24),
      playlist,
      playlistLen: playlist.length,
      step: 0,
      drawTurn: 0,
      lastScored: -1,
      revealed: null,
      awarded: true,
      screen: 'predict',
      phase: 'open',
      timerEnd: Date.now() + PREDICT_SECONDS * 1000,
      resultEnd: null,
      instance: (g.get('instance') || 0) + 1,
    });
  }, []);

  // Motor: avanza fases del modo fiesta. Idempotente (revisa estado actual).
  const partyTransition = useMutation(({ storage }) => {
    const g = storage.get('game');
    if (g.get('mode') !== 'party') return;
    const screen = g.get('screen');
    const phase = g.get('phase');
    if (screen === 'bet' || screen === 'predict') {
      startSegment(g, storage, 0);
      return;
    }
    if (phase === 'intro') {
      beginPlay(g);
      return;
    }
    if (phase === 'result') {
      startSegment(g, storage, g.get('step') + 1);
      return;
    }
    // Quiplash: de escribir a votar (sin puntos todavía).
    if (screen === 'quip' && phase === 'write') {
      g.update({ phase: 'vote', timerEnd: Date.now() + QUIP_VOTE_SECONDS * 1000 });
      return;
    }
    // fin de la fase de juego -> acreditar puntos y mostrar resultados
    if (screen === 'trivia' && phase === 'q') {
      commitStep(g, storage);
      g.update({ phase: 'result', resultEnd: Date.now() + RESULT_SECONDS * 1000 });
    } else if (screen === 'couple' && phase === 'q') {
      commitStep(g, storage);
      g.update({ phase: 'result', resultEnd: Date.now() + RESULT_SECONDS * 1000 });
    } else if (screen === 'mostlikely' && phase === 'vote') {
      commitStep(g, storage);
      g.update({ phase: 'result', resultEnd: Date.now() + RESULT_SECONDS * 1000 });
    } else if (screen === 'quip' && phase === 'vote') {
      commitStep(g, storage);
      g.update({ phase: 'result', resultEnd: Date.now() + RESULT_SECONDS * 1000 });
    } else if (screen === 'draw' && phase === 'draw') {
      commitStep(g, storage);
      g.update({ phase: 'result', resultEnd: Date.now() + DRAW_RESULT_SECONDS * 1000 });
    } else if (screen === 'hangman' && phase === 'play') {
      commitStep(g, storage);
      g.update({ phase: 'result', resultEnd: Date.now() + HANG_RESULT_SECONDS * 1000 });
    }
  }, []);

  const partySkip = useMutation(({ storage }) => {
    const g = storage.get('game');
    if (g.get('mode') !== 'party') return;
    if (g.get('screen') === 'bet' || g.get('screen') === 'predict') startSegment(g, storage, 0);
    else startSegment(g, storage, g.get('step') + 1);
  }, []);
  const partyToReveal = useMutation(({ storage }) => {
    const g = storage.get('game');
    g.update({ screen: 'reveal', phase: g.get('revealed') ? 'done' : 'pending', timerEnd: null, resultEnd: null });
  }, []);

  // ---------- derivados ----------
  const isHost = game ? game.hostId === myId : false;
  const hangmanOver = game && game.screen === 'hangman' && game.phase === 'play' ? hangmanOverFrom(game, lettersForEngine) : false;

  // ---------- efectos ----------
  useEffect(() => {
    const h = () => Sound.unlock();
    window.addEventListener('pointerdown', h);
    return () => window.removeEventListener('pointerdown', h);
  }, []);

  // Reacciones efímeras (emojis flotantes) vía broadcast.
  const broadcast = useBroadcastEvent();
  const [reactions, setReactions] = useState([]);
  const spawnReaction = (emoji) => {
    const id = Math.random().toString(36).slice(2);
    const x = 8 + Math.random() * 80;
    setReactions((r) => [...r.slice(-24), { id, emoji, x }]);
    setTimeout(() => setReactions((r) => r.filter((z) => z.id !== id)), 2600);
  };
  useEventListener(({ event }) => {
    if (event && event.type === 'reaction') spawnReaction(event.emoji);
  });
  const react = (emoji) => {
    spawnReaction(emoji);
    broadcast({ type: 'reaction', emoji });
  };

  const fxKey = useRef('');
  useEffect(() => {
    if (!game) return;
    if ((game.screen === 'trivia' || game.screen === 'mostlikely' || game.screen === 'couple' || game.screen === 'quip') && game.phase === 'result') {
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

  // Motor del modo fiesta: solo el anfitrión programa las transiciones.
  useEffect(() => {
    if (!isHost || !game || game.mode !== 'party') return;
    if (game.screen === 'hangman' && game.phase === 'play') {
      if (hangmanOver) {
        const id = setTimeout(() => partyTransition(), 700);
        return () => clearTimeout(id);
      }
      // si no terminó, cae al límite de tiempo de seguridad (timerEnd) de abajo
    }
    const deadline = game.phase === 'result' ? game.resultEnd : game.timerEnd;
    if (!deadline) return;
    const ms = Math.max(0, deadline - Date.now());
    const id = setTimeout(() => partyTransition(), ms + 80);
    return () => clearTimeout(id);
    // eslint-disable-next-line
  }, [isHost, game && game.mode, game && game.screen, game && game.phase, game && game.timerEnd, game && game.resultEnd, game && game.step, hangmanOver]);

  // ---------- ruteo ----------
  if (game == null || playersMap == null) return <Loading text="Conectando a la sala…" />;

  const players = Array.from(playersMap, ([id, v]) => ({ id, ...v }));
  const playersObj = Object.fromEntries(playersMap);
  const points = pointsMap ? Object.fromEntries(pointsMap) : {};
  const board = leaderboard(playersObj, points);
  const betsObj = Object.fromEntries(betsMap || []);
  const coupleAnswersObj = Object.fromEntries(coupleAnswersMap || []);
  const predictionsObj = Object.fromEntries(predictionsMap || []);
  const betsCount = betsMap ? betsMap.size : 0;
  const me = playersMap.get(myId);

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
    startGame, startParty, setParents, setCoupleAnswer, setPrediction, submitText, finishGame, submitAnswer, placeBet,
    triviaShowResult, triviaBack, triviaNext,
    mlShowResult, mlBack, mlNext,
    guessLetter, pushSegment, clearCanvas, guessDraw, drawNext,
    goReveal, revealGender, backToHub, resetParty,
  };
  const common = { game, players, board, myId, isHost, actions };

  let el;
  if (game.mode === 'party' && game.phase === 'intro') {
    el = <Intro game={game} players={players} myId={myId} isHost={isHost} onBegin={partyTransition} />;
  } else
    switch (game.screen) {
    case 'bet':
      el = <Bet {...common} bets={betsObj} />;
      break;
    case 'predict':
      el = <Predict {...common} bets={betsObj} predictions={predictionsObj} />;
      break;
    case 'trivia':
      el = <Trivia {...common} />;
      break;
    case 'couple':
      el = <Couple {...common} coupleAnswers={coupleAnswersObj} />;
      break;
    case 'quip':
      el = <Quip {...common} />;
      break;
    case 'mostlikely':
      el = <MostLikely {...common} />;
      break;
    case 'hangman':
      el = <Hangman {...common} />;
      break;
    case 'draw':
      el = <Draw {...common} />;
      break;
    case 'reveal':
      el = <Reveal {...common} predictions={predictionsObj} />;
      break;
    case 'hub':
    default:
      el = <Hub {...common} roomCode={roomCodeFromUrl()} betsCount={betsCount} coupleAnswers={coupleAnswersObj} />;
  }

  const showPartyBar = isHost && game.mode === 'party' && game.screen !== 'reveal';
  return (
    <>
      {el}
      <ReactionsLayer items={reactions} />
      <ReactionBar onReact={react} />
      {showPartyBar && <PartyBar step={game.step} len={game.playlistLen} onAdvance={partyTransition} onReveal={partyToReveal} />}
    </>
  );
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
