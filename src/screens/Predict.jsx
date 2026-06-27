import { useStorage } from '@liveblocks/react';
import TimerRing from '../components/TimerRing';
import { GENDER, PREDICT } from '../lib/content';
import { fill, PREDICT_SECONDS } from '../lib/game';
import { Sound } from '../lib/sound';

export default function Predict({ game, players, bets, predictions, myId, isHost, actions }) {
  // re-render al cambiar predicciones
  useStorage((root) => root.predictions);
  const myBet = bets[myId];
  const count = Object.keys(bets).length;
  const g = (q) => ({ text: fill(q.text, game.dad, game.mom), options: q.options.map((o) => ({ ...o, label: fill(o.label, game.dad, game.mom) })) });
  const gender = g(GENDER);

  return (
    <div style={{ paddingTop: 22 }}>
      <div className="topbar">
        <div className="chips">
          <span className="chip" style={{ cursor: 'default' }}>📋 Boleta de predicciones</span>
        </div>
        <TimerRing endsAt={game.timerEnd} total={PREDICT_SECONDS} runKey={'predict'} />
      </div>

      <p className="muted" style={{ fontWeight: 700, margin: '12px 0 4px', textAlign: 'center' }}>
        Adivina cómo será el bebé. ¡La apuesta del género da <b>+3</b>!
      </p>

      <div className="card" style={{ marginTop: 8, border: '2px solid var(--gold)' }}>
        <label className="lbl">🎲 {gender.text} (apuesta principal)</label>
        {gender.options.map((o) => (
          <button
            key={o.id}
            className={'opt' + (myBet === o.id ? ' sel' : '')}
            onClick={() => {
              Sound.tap();
              actions.placeBet(o.id);
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

      {PREDICT.map((q0, qi) => {
        const q = g(q0);
        const mine = predictions[myId + ':' + qi];
        return (
          <div className="card" style={{ marginTop: 10, padding: 14 }} key={qi}>
            <label className="lbl">{q.text}</label>
            <div className="players">
              {q.options.map((o) => (
                <button
                  key={o.id}
                  className={'pchip pick' + (mine === o.id ? ' on' : '')}
                  onClick={() => {
                    Sound.tap();
                    actions.setPrediction(qi, o.id);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <span className="chip" style={{ cursor: 'default', background: 'rgba(86,197,150,.18)', borderColor: 'rgba(86,197,150,.4)' }}>
          🟢 <b>{count}</b>&nbsp;de {players.length} ya apostaron el género
        </span>
      </div>
      <p className="muted" style={{ textAlign: 'center', marginTop: 12, fontWeight: 700 }}>
        Los juegos empiezan solos cuando acabe el tiempo… 🎮
      </p>
    </div>
  );
}
