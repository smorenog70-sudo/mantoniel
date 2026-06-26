import { useStorage } from '@liveblocks/react';
import Leaderboard from '../components/Leaderboard';
import { HANGMAN_WORDS } from '../lib/content';
import { maskWord, hangmanState } from '../lib/game';
import { Sound } from '../lib/sound';

const ROWS = ['ABCDEFGHIJ', 'KLMNÑOPQR', 'STUVWXYZ'];

export default function Hangman({ game, board, myId, isHost, actions }) {
  const lettersList = useStorage((root) => root.letters);
  const word = HANGMAN_WORDS[game.contentIndex] || '';
  const letters = (lettersList || []).map((x) => ({ l: String(x.l).toUpperCase(), by: x.by }));
  const used = new Set(letters.map((x) => x.l));
  const { wrong, solved, lives } = hangmanState(word, letters);
  const dead = lives <= 0;
  const over = solved || dead;
  const masked = maskWord(word, dead ? word.split('') : letters.map((x) => x.l));

  return (
    <div style={{ paddingTop: 22 }}>
      <div className="chips">
        <span className="chip" style={{ cursor: 'default' }}>
          🔤 Ahorcado en equipo
        </span>
        <span className="chip" style={{ cursor: 'default' }}>
          {'❤️'.repeat(Math.max(0, lives))}
          {'🤍'.repeat(Math.max(0, 6 - Math.max(0, lives)))}
        </span>
      </div>

      <p className="muted" style={{ textAlign: 'center', marginTop: 12, fontWeight: 700 }}>
        {over ? (solved ? '¡Lo lograron! 🎉' : '¡Se acabaron las vidas! 😬') : 'Adivinen la palabra entre todos'}
      </p>

      <div className="hword display">{masked}</div>

      {wrong.length > 0 && (
        <p className="faint" style={{ textAlign: 'center', marginTop: 4 }}>
          Falladas: {wrong.join(' · ')}
        </p>
      )}

      {!over && (
        <div className="keyboard">
          {ROWS.map((row, ri) => (
            <div key={ri} className="krow">
              {row.split('').map((L) => {
                const isUsed = used.has(L);
                const inWord = word.indexOf(L) >= 0;
                const cls = 'key' + (isUsed ? (inWord ? ' good' : ' bad') : '');
                return (
                  <button
                    key={L}
                    className={cls}
                    disabled={isUsed}
                    onClick={() => {
                      if (word.indexOf(L) >= 0) Sound.correct();
                      else Sound.wrong();
                      actions.guessLetter(L);
                    }}
                  >
                    {L}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {over && dead && (
        <p className="muted" style={{ textAlign: 'center', marginTop: 8, fontWeight: 800, color: 'var(--ink)' }}>
          La palabra era: <b>{word}</b>
        </p>
      )}

      {over && <Leaderboard board={board} myId={myId} mode="mini" title="🏆 Ranking de la fiesta" />}

      {isHost && (
        <div className="hostbar">
          <div className="tag">⚙ Anfitrión</div>
          <div className="row">
            <button className="btn btn-light" onClick={() => actions.startGame('hangman')}>
              Otra palabra ↻
            </button>
            <button className="btn btn-primary" onClick={() => actions.finishGame()}>
              Terminar 🏁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
