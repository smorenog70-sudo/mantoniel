import { GENDER } from '../lib/content';
import { Sound } from '../lib/sound';

export default function Bet({ players, bets, myId, isHost, actions }) {
  const myBet = bets[myId];
  const count = Object.keys(bets).length;

  return (
    <div style={{ paddingTop: 28 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>🎲</div>
        <h1 className="title display" style={{ fontSize: 28 }}>
          Haz tu apuesta
        </h1>
        <p className="sub" style={{ maxWidth: 320, margin: '0 auto' }}>
          ¿Qué crees que será? Tu apuesta queda guardada hasta la Gran Revelación. Le atinas = <b>+3 puntos</b>.
        </p>
      </div>

      <div style={{ marginTop: 18 }}>
        {GENDER.options.map((o) => (
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

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <span className="chip" style={{ cursor: 'default', background: 'rgba(86,197,150,.18)', borderColor: 'rgba(86,197,150,.4)' }}>
          🟢 <b>{count}</b>&nbsp;de {players.length} ya apostaron
        </span>
      </div>

      {isHost && (
        <div className="hostbar">
          <div className="tag">⚙ Anfitrión</div>
          <button className="btn btn-primary full" onClick={() => actions.finishGame()}>
            Listo, volver al hub ›
          </button>
        </div>
      )}
    </div>
  );
}
