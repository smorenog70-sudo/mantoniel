import { useEffect, useState } from 'react';
import { useStorage } from '@liveblocks/react';
import TimerRing from '../components/TimerRing';
import Leaderboard from '../components/Leaderboard';
import { TRIVIA } from '../lib/content';
import { tally, maxKey, labelOf, colorOf, TRIVIA_SECONDS } from '../lib/game';
import { Sound } from '../lib/sound';

function roundAnswers(map, instance, round) {
  const prefix = instance + ':' + round + ':';
  const out = {};
  if (!map) return out;
  for (const [k, v] of map) if (k.indexOf(prefix) === 0) out[k.slice(prefix.length)] = v;
  return out;
}

function Bar({ o, n, pct, voters, win }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="bar">
      <div className="top">
        <span style={{ fontSize: 18 }}>{o.id === win ? '👑' : ''}</span>
        <b>{o.label}</b>
        <span className="pct">
          {n} · {pct}%
        </span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: w + '%', background: o.color }} />
      </div>
      <div className="voters">
        {voters.map((v, i) => (
          <span key={i} className="voter">
            <span>{v.avatar}</span>
            {v.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Trivia({ game, players, board, myId, isHost, actions }) {
  const answersMap = useStorage((root) => root.answers);
  const q = TRIVIA[game.contentIndex];
  const pmap = {};
  players.forEach((p) => (pmap[p.id] = p));
  const ans = roundAnswers(answersMap, game.instance, game.round);
  const answered = Object.keys(ans).length;
  const myAnswer = ans[myId];
  const t = tally(ans);
  const total = Object.values(t).reduce((a, b) => a + b, 0);
  const win = maxKey(t);
  const isResult = game.phase === 'result';
  const isLast = game.round + 1 >= game.rounds;

  if (!q) return null;
  const pct = Math.round(((game.round + 1) / game.rounds) * 100);

  // votación
  if (!isResult) {
    return (
      <div style={{ paddingTop: 18 }}>
        <div className="topbar">
          <div className="chips">
            <span className="chip" style={{ cursor: 'default' }}>
              🎯 {game.round + 1} de {game.rounds}
            </span>
          </div>
          <TimerRing
            endsAt={game.timerEnd}
            total={TRIVIA_SECONDS}
            runKey={game.instance + ':' + game.round}
            onEnd={isHost ? actions.triviaShowResult : undefined}
          />
        </div>
        <div className="progress" style={{ marginTop: 10 }}>
          <i style={{ width: pct + '%' }} />
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
            🟢 <b>{answered}</b>&nbsp;de {players.length} ya respondieron
          </span>
        </div>
        {isHost && (
          <div className="hostbar">
            <div className="tag">⚙ Anfitrión</div>
            <div className="row">
              <button className="btn btn-light" onClick={() => actions.finishGame()}>
                Terminar juego
              </button>
              <button className="btn btn-primary" onClick={() => actions.triviaShowResult()}>
                Mostrar resultados
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // resultados
  return (
    <div style={{ paddingTop: 18 }}>
      <div className="chips">
        <span className="chip" style={{ cursor: 'default' }}>
          Resultados · {game.round + 1}/{game.rounds}
        </span>
        <span className="chip" style={{ cursor: 'default' }}>
          🗳️ {total} {total === 1 ? 'voto' : 'votos'}
        </span>
      </div>
      <h2 className="resq display" style={{ marginTop: 16 }}>
        {q.text}
      </h2>
      {win && (
        <p className="muted" style={{ textAlign: 'center', fontWeight: 700, margin: '0 0 6px' }}>
          La mayoría dice… {labelOf(q.options, win)} 🎉
        </p>
      )}
      <div className="card" style={{ marginTop: 8 }}>
        {q.options.map((o) => {
          const voters = Object.keys(ans)
            .filter((pid) => ans[pid] === o.id)
            .map((pid) => pmap[pid] || { name: '?', avatar: '👤' });
          return <Bar key={o.id} o={o} n={t[o.id] || 0} pct={total ? Math.round((t[o.id] || 0) / total * 100) : 0} voters={voters} win={win} />;
        })}
      </div>
      <Leaderboard board={board} myId={myId} mode="mini" title="🏆 Ranking de la fiesta" />
      {isHost && (
        <div className="hostbar">
          <div className="tag">⚙ Anfitrión</div>
          <div className="row">
            <button className="btn btn-light" onClick={() => actions.triviaBack()}>
              ‹ Volver a votar
            </button>
            <button className="btn btn-primary" onClick={() => (isLast ? actions.finishGame() : actions.triviaNext())}>
              {isLast ? 'Terminar 🏁' : 'Siguiente ›'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
