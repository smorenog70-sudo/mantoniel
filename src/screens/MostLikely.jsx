import { useStorage } from '@liveblocks/react';
import Leaderboard from '../components/Leaderboard';
import PlayersRow from '../components/PlayersRow';
import { MOSTLIKELY } from '../lib/content';
import { tally, maxKey } from '../lib/game';
import { Sound } from '../lib/sound';

function roundAnswers(map, instance, round) {
  const prefix = instance + ':' + round + ':';
  const out = {};
  if (!map) return out;
  for (const [k, v] of map) if (k.indexOf(prefix) === 0) out[k.slice(prefix.length)] = v;
  return out;
}

export default function MostLikely({ game, players, board, myId, isHost, actions }) {
  const answersMap = useStorage((root) => root.answers);
  const prompt = MOSTLIKELY[game.contentIndex];
  const ans = roundAnswers(answersMap, game.instance, game.round);
  const myVote = ans[myId];
  const voted = Object.keys(ans).length;
  const t = tally(ans);
  const total = Object.values(t).reduce((a, b) => a + b, 0);
  const winId = maxKey(t);
  const pmap = {};
  players.forEach((p) => (pmap[p.id] = p));
  const winner = winId ? pmap[winId] : null;
  const isResult = game.phase === 'result';
  const isLast = game.round + 1 >= game.rounds;

  if (!prompt) return null;

  if (!isResult) {
    return (
      <div style={{ paddingTop: 24 }}>
        <div className="chips">
          <span className="chip" style={{ cursor: 'default' }}>
            🤔 {game.round + 1} de {game.rounds}
          </span>
        </div>
        <h2 className="resq display" style={{ marginTop: 16 }}>
          {prompt}
        </h2>
        <p className="muted" style={{ margin: '0 0 8px', fontWeight: 700 }}>
          Vota por alguien de la sala 👇
        </p>
        <PlayersRow
          players={players}
          myId={myId}
          selectedId={myVote}
          onPick={(id) => {
            Sound.tap();
            actions.submitAnswer(id);
          }}
        />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span className="chip" style={{ cursor: 'default', background: 'rgba(86,197,150,.18)', borderColor: 'rgba(86,197,150,.4)' }}>
            🟢 <b>{voted}</b>&nbsp;de {players.length} ya votaron
          </span>
        </div>
        {isHost && (
          <div className="hostbar">
            <div className="tag">⚙ Anfitrión</div>
            <div className="row">
              <button className="btn btn-light" onClick={() => actions.finishGame()}>
                Terminar juego
              </button>
              <button className="btn btn-primary" onClick={() => actions.mlShowResult()}>
                Ver el veredicto
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // resultados
  return (
    <div style={{ paddingTop: 24 }}>
      <h2 className="resq display" style={{ marginTop: 4 }}>
        {prompt}
      </h2>
      {winner && (
        <div className="card" style={{ textAlign: 'center', padding: 18, marginTop: 6 }}>
          <div style={{ fontSize: 52 }}>{winner.avatar}</div>
          <div className="display" style={{ fontWeight: 700, fontSize: 24, color: 'var(--ink)' }}>
            👑 {winner.name}
          </div>
          <div className="muted" style={{ color: '#8a7d55', fontWeight: 700 }}>
            con {t[winId]} {t[winId] === 1 ? 'voto' : 'votos'}
          </div>
        </div>
      )}
      <div className="card" style={{ marginTop: 10 }}>
        <label className="lbl">Votos</label>
        <div className="lb">
          {players
            .map((p) => ({ p, n: t[p.id] || 0 }))
            .sort((a, b) => b.n - a.n)
            .filter((x) => x.n > 0)
            .map(({ p, n }) => (
              <div key={p.id} className="lbrow">
                <span className="av">{p.avatar}</span>
                <span className="nm">{p.name}</span>
                <span className="pts">{n}</span>
              </div>
            ))}
        </div>
      </div>
      <Leaderboard board={board} myId={myId} mode="mini" title="🏆 Ranking de la fiesta" />
      {isHost && (
        <div className="hostbar">
          <div className="tag">⚙ Anfitrión</div>
          <div className="row">
            <button className="btn btn-light" onClick={() => actions.mlBack()}>
              ‹ Volver a votar
            </button>
            <button className="btn btn-primary" onClick={() => (isLast ? actions.finishGame() : actions.mlNext())}>
              {isLast ? 'Terminar 🏁' : 'Siguiente ›'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
