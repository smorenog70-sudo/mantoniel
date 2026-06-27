import { GENDER } from '../lib/content';
import { BET_SECONDS } from '../lib/game';
import TimerRing from '../components/TimerRing';
import { Sound } from '../lib/sound';

export default function Bet({ game, players, bets, myId, isHost, actions }) {
  const myBet = bets[myId];
  const count = Object.keys(bets).length;
  const party = game && game.mode === 'party';

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

      {party && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <TimerRing endsAt={game.timerEnd} total={BET_SECONDS} runKey={'bet'} />
        </div>
      )}

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

      {party && (
        <p className="muted" style={{ textAlign: 'center', marginTop: 14, fontWeight: 700 }}>
          Empiezan los juegos cuando acabe el tiempo… 🎮
        </p>
      )}

      {isHost && !party && (
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
