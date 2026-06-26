import Leaderboard from '../components/Leaderboard';
import PlayersRow from '../components/PlayersRow';
import { Sound } from '../lib/sound';

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
  { key: 'bet', emoji: '🎲', label: 'La apuesta del bebé', hint: 'primero esto' },
  { key: 'trivia', emoji: '🎯', label: 'Trivia de apuestas' },
  { key: 'draw', emoji: '🎨', label: 'Dibujo (Pictionary)' },
  { key: 'hangman', emoji: '🔤', label: 'Ahorcado en equipo' },
  { key: 'mostlikely', emoji: '🤔', label: '¿Quién es más probable?' },
];

export default function Hub({ roomCode, players, board, betsCount, myId, isHost, actions }) {
  const hasScores = board.some((p) => p.score > 0);
  const started = hasScores || betsCount > 0;

  return (
    <div style={{ paddingTop: 22 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🎈</div>
        <h1 className="title display" style={{ fontSize: 28 }}>
          {started ? 'Hub de la fiesta' : 'Sala de espera'}
        </h1>
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
        <div className="card mt">
          <label className="lbl">🎮 Lanza un juego</label>
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
                {g.key === 'bet' && betsCount === 0 && <span className="gtag">empieza aquí</span>}
                {g.key === 'bet' && betsCount > 0 && <span className="gtag ok">{betsCount} apuestas ✓</span>}
              </button>
            ))}
          </div>
          <button className="btn btn-primary full mt" onClick={() => actions.goReveal()}>
            🎊 Gran Revelación (final)
          </button>
          {started && (
            <button className="btn btn-ghost full mt8" onClick={() => actions.resetParty()}>
              ↺ Reiniciar puntajes
            </button>
          )}
        </div>
      ) : (
        <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontWeight: 700 }}>
          Esperando a que el anfitrión lance un juego… 🍿
        </p>
      )}
    </div>
  );
}
