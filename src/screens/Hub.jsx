import { useState } from 'react';
import Leaderboard from '../components/Leaderboard';
import PlayersRow from '../components/PlayersRow';
import { Sound } from '../lib/sound';
import { PARTY_GAMES } from '../lib/game';

function shareLink(roomCode) {
  const url = `${location.origin}${location.pathname}?room=${roomCode}`;
  const msg = `🎉 ¡Entra a La Gran Revelación! Sala ${roomCode}: ${url}`;
  if (navigator.share) {
    navigator.share({ title: 'La Gran Revelación', text: msg, url }).catch(() => {});
    return;
  }
  if (navigator.clipboard) navigator.clipboard.writeText(msg).catch(() => {});
}

const GAMES = [
  { key: 'bet', emoji: '🎲', label: 'La apuesta del bebé' },
  { key: 'trivia', emoji: '🎯', label: 'Trivia de apuestas' },
  { key: 'draw', emoji: '🎨', label: 'Dibujo (Pictionary)' },
  { key: 'hangman', emoji: '🔤', label: 'Ahorcado en equipo' },
  { key: 'mostlikely', emoji: '🤔', label: '¿Quién es más probable?' },
];

export default function Hub({ game, roomCode, players, board, betsCount, myId, isHost, actions }) {
  const [showManual, setShowManual] = useState(false);
  const [dad, setDad] = useState((game && game.dad) || '');
  const [mom, setMom] = useState((game && game.mom) || '');
  const hasScores = board.some((p) => p.score > 0);
  const started = hasScores || betsCount > 0;
  const namesLine = (game && (game.dad || game.mom)) ? `${game.dad || 'Papá'} & ${game.mom || 'Mamá'}` : '';

  return (
    <div style={{ paddingTop: 22 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🎈</div>
        <h1 className="title display" style={{ fontSize: 28 }}>
          {started ? 'Hub de la fiesta' : 'Sala de espera'}
        </h1>
        {namesLine ? (
          <p className="sub" style={{ fontWeight: 800 }}>
            👶 El bebé de {namesLine}
          </p>
        ) : null}
        <p className="sub">
          {players.length} {players.length === 1 ? 'persona' : 'personas'} en la sala
        </p>
        <div className="roomcode">{roomCode}</div>
      </div>

      <button className="btn btn-light full mt" onClick={() => shareLink(roomCode)}>
        Compartir invitación
      </button>

      <div className="card mt">
        <label className="lbl">En la sala</label>
        {players.length ? (
          <PlayersRow players={players} myId={myId} />
        ) : (
          <span className="faint" style={{ fontSize: 13 }}>
            Esperando a la banda…
          </span>
        )}
      </div>

      {hasScores && <Leaderboard board={board} myId={myId} mode="mini" title="🏆 Ranking de la fiesta" />}

      {isHost ? (
        <>
          <div className="card mt" style={{ background: 'linear-gradient(150deg,#fff,#fff6e0)' }}>
            <label className="lbl">🎉 Modo fiesta</label>
            <p style={{ fontSize: 13, color: '#6f6880', fontWeight: 600, margin: '0 0 10px' }}>
              {PARTY_GAMES} mini-juegos al azar, uno tras otro. Avanzan solos: tú también juegas. Termina en la Gran Revelación.
            </p>

            <label className="lbl">Nombres de los protagonistas (opcional)</label>
            <div className="row" style={{ marginBottom: 12 }}>
              <input
                className="txt"
                maxLength={24}
                placeholder="Papá"
                value={dad}
                onChange={(e) => setDad(e.target.value)}
                onBlur={() => actions.setParents(dad, mom)}
              />
              <input
                className="txt"
                maxLength={24}
                placeholder="Mamá"
                value={mom}
                onChange={(e) => setMom(e.target.value)}
                onBlur={() => actions.setParents(dad, mom)}
              />
            </div>

            <button
              className="btn btn-primary full"
              style={{ fontSize: 18, animation: 'pulseGold 2.4s infinite' }}
              onClick={() => {
                Sound.tap();
                actions.startParty(dad, mom);
              }}
            >
              ▶️ Empezar la fiesta ({PARTY_GAMES} juegos)
            </button>
          </div>

          <p
            className="faint"
            style={{ textAlign: 'center', marginTop: 14, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
            onClick={() => setShowManual((v) => !v)}
          >
            {showManual ? '▲ Ocultar control manual' : '▼ ¿Prefieres lanzar los juegos a mano?'}
          </p>

          {showManual && (
            <div className="card" style={{ marginTop: 6 }}>
              <label className="lbl">🎮 Lanza un juego suelto</label>
              <div className="gamegrid">
                {GAMES.map((g) => (
                  <button
                    key={g.key}
                    className="gamebtn"
                    onClick={() => {
                      Sound.tap();
                      actions.startGame(g.key);
                    }}
                  >
                    <span className="ge">{g.emoji}</span>
                    <span className="gl">{g.label}</span>
                  </button>
                ))}
              </div>
              <button className="btn btn-light full mt" onClick={() => actions.goReveal()}>
                🎊 Ir a la Gran Revelación
              </button>
              {started && (
                <button className="btn btn-ghost full mt8" onClick={() => actions.resetParty()}>
                  ↺ Reiniciar puntajes
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontWeight: 700 }}>
          Esperando a que el anfitrión empiece la fiesta… 🍿
        </p>
      )}
    </div>
  );
}
