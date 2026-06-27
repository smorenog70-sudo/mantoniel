import TimerRing from '../components/TimerRing';
import { INTRO_SECONDS } from '../lib/game';

const INFO = {
  trivia: {
    e: '🎯',
    name: 'Trivia de apuestas',
    how: 'Responde lo que creas que va a contestar la MAYORÍA. Si tu respuesta es la más votada, ganas puntos. ¡Corre el reloj!',
  },
  draw: {
    e: '🎨',
    name: 'Dibujo',
    how: 'A una persona le toca dibujar una palabra y los demás adivinan escribiendo. Entre más rápido adivines, más puntos.',
  },
  hangman: {
    e: '🔤',
    name: 'Ahorcado en equipo',
    how: 'Entre todos toquen letras para descubrir la palabra antes de quedarse sin vidas. Cada letra correcta da puntos a quien la adivinó.',
  },
  mostlikely: {
    e: '🤔',
    name: '¿Quién es más probable?',
    how: 'Vota por la persona de la sala que mejor le quede a la frase. Ganas si votas como la mayoría.',
  },
  couple: {
    e: '💍',
    name: '¿Conoces a la pareja?',
    how: 'Pregunta real sobre los papás. Gana quien le atine a la respuesta verdadera que ellos dejaron.',
  },
  quip: {
    e: '😂',
    name: 'Escribe y vota',
    how: 'Escribe la respuesta más chistosa al prompt; luego todos votan la mejor (anónimo). Te dan puntos por cada voto que recibas.',
  },
};

export default function Intro({ game, players, myId, isHost, onBegin }) {
  const info = INFO[game.screen] || { e: '🎮', name: 'Juego', how: '' };
  const amDrawer = game.screen === 'draw' && game.drawerId === myId;
  const drawerName = (players.find((p) => p.id === game.drawerId) || {}).name || 'alguien';

  return (
    <div style={{ paddingTop: 40 }}>
      <div className="introbox">
        <span className="chip" style={{ cursor: 'default', alignSelf: 'center' }}>
          🎉 Juego {Math.min(game.step + 1, game.playlistLen)}/{game.playlistLen}
        </span>
        <div className="intro-emoji">{info.e}</div>
        <h1 className="title display" style={{ fontSize: 30, margin: '2px 0 4px' }}>
          {info.name}
        </h1>
        <p className="intro-how">{info.how}</p>

        {game.screen === 'draw' && (
          <div className="intro-draw">
            {amDrawer ? '✏️ ¡Te toca dibujar a ti!' : `✏️ Le toca dibujar a ${drawerName}`}
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <TimerRing endsAt={game.timerEnd} total={INTRO_SECONDS} runKey={'intro:' + game.step} />
        </div>
        <p className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>
          Empieza en…
        </p>

        {isHost && (
          <button className="btn btn-primary" style={{ marginTop: 12, padding: '12px 26px' }} onClick={onBegin}>
            ▶️ Empezar ya
          </button>
        )}
      </div>
    </div>
  );
}
