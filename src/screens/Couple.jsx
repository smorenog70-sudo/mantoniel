import { useEffect, useState } from 'react';
import { useStorage } from '@liveblocks/react';
import TimerRing from '../components/TimerRing';
import Leaderboard from '../components/Leaderboard';
import { COUPLE } from '../lib/content';
import { tally, labelOf, fill, COUPLE_SECONDS } from '../lib/game';
import { Sound } from '../lib/sound';

function roundAnswers(map, instance) {
  const prefix = instance + ':0:';
  const out = {};
  if (!map) return out;
  for (const [k, v] of map) if (k.indexOf(prefix) === 0) out[k.slice(prefix.length)] = v;
  return out;
}

function Bar({ o, n, pct, isCorrect }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="bar">
      <div className="top">
        <span style={{ fontSize: 18 }}>{isCorrect ? '✅' : ''}</span>
        <b>{o.label}</b>
        <span className="pct">
          {n} · {pct}%
        </span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: w + '%', background: isCorrect ? '#56C596' : o.color }} />
      </div>
    </div>
  );
}

export default function Couple({ game, players, board, myId, isHost, actions, coupleAnswers }) {
  const answersMap = useStorage((root) => root.answers);
  const q0 = COUPLE[game.contentIndex];
  const q = q0
    ? { text: fill(q0.text, game.dad, game.mom), options: q0.options.map((o) => ({ ...o, label: fill(o.label, game.dad, game.mom) })) }
    : null;
  const correct = coupleAnswers ? coupleAnswers[String(game.contentIndex)] : null;
  const ans = roundAnswers(answersMap, game.instance);
  const answered = Object.keys(ans).length;
  const myAnswer = ans[myId];
  const t = tally(ans);
  const total = Object.values(t).reduce((a, b) => a + b, 0);
  const isResult = game.phase === 'result';
  const pmap = {};
  players.forEach((p) => (pmap[p.id] = p));

  if (!q) return null;

  if (!isResult) {
    return (
      <div style={{ paddingTop: 18 }}>
        <div className="topbar">
          <div className="chips">
            <span className="chip" style={{ cursor: 'default' }}>
              💍 Juego {game.step + 1}/{game.playlistLen}
            </span>
            <span className="chip" style={{ cursor: 'default' }}>
              Conoce a la pareja
            </span>
          </div>
          <TimerRing endsAt={game.timerEnd} total={COUPLE_SECONDS} runKey={game.instance + ':c'} />
        </div>
        <h2 className="resq display" style={{ marginTop: 16 }}>
          {q.text}
        </h2>
        <div className="opts">
          {q.options.map((o) => (
            <button
              key={o.id}
              className={'opt' + (myAnswer === o.id ? ' sel' : '')}
              onClick={() => {
                Sound.tap();
                actions.submitAnswer(o.id);
              }}
            >
              <span className="dot" style={{ background: o.color }} />
              {o.label}
              <span className="check" style={{ background: o.color }}>
                ✓
              </span>
            </button>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span className="chip" style={{ cursor: 'default', background: 'rgba(86,197,150,.18)', borderColor: 'rgba(86,197,150,.4)' }}>
            🟢 <b>{answered}</b>&nbsp;de {players.length} respondieron
          </span>
        </div>
      </div>
    );
  }

  const scorers = correct ? Object.keys(ans).filter((pid) => ans[pid] === correct).map((pid) => pmap[pid]).filter(Boolean) : [];
  return (
    <div style={{ paddingTop: 18 }}>
      <div className="chips">
        <span className="chip" style={{ cursor: 'default' }}>
          💍 Resultado · Juego {game.step + 1}/{game.playlistLen}
        </span>
      </div>
      <h2 className="resq display" style={{ marginTop: 16 }}>
        {q.text}
      </h2>
      {correct ? (
        <p className="muted" style={{ textAlign: 'center', fontWeight: 800, margin: '0 0 6px', color: '#fff' }}>
          Respuesta correcta: <span style={{ color: '#7Ce0b0' }}>{labelOf(q.options, correct)}</span> ✅
        </p>
      ) : (
        <p className="faint" style={{ textAlign: 'center' }}>El anfitrión no marcó la respuesta de esta 🤷</p>
      )}
      <div className="card" style={{ marginTop: 8 }}>
        {q.options.map((o) => (
          <Bar key={o.id} o={o} n={t[o.id] || 0} pct={total ? Math.round((t[o.id] || 0) / total * 100) : 0} isCorrect={o.id === correct} />
        ))}
      </div>
      <div className="card" style={{ marginTop: 8, padding: '11px 14px', textAlign: 'center' }}>
        {scorers.length ? (
          <span style={{ fontWeight: 800, color: 'var(--ink)' }}>
            🏅 <span style={{ color: '#1f8a5b' }}>+1 punto</span> para {scorers.map((s) => s.name).join(', ')}
          </span>
        ) : (
          <span style={{ fontWeight: 800, color: '#9a93a6' }}>Nadie le atinó 🙈</span>
        )}
      </div>
      <Leaderboard board={board} myId={myId} mode="mini" title="🏆 Ranking de la fiesta" />
    </div>
  );
}
