import { useEffect, useRef, useState } from 'react';
import { useStorage } from '@liveblocks/react';
import TimerRing from '../components/TimerRing';
import { DRAW_WORDS } from '../lib/content';
import { norm, DRAW_SECONDS } from '../lib/game';
import { Sound } from '../lib/sound';

const PALETTE = ['#2A2342', '#E0524E', '#4F9DE0', '#56C596', '#FFC94D', '#F08FB7'];

export default function Draw({ game, players, myId, isHost, actions }) {
  const segments = useStorage((root) => root.segments);
  const guesses = useStorage((root) => root.guesses);
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [color, setColor] = useState(PALETTE[0]);
  const [eraser, setEraser] = useState(false);
  const [sizeTick, setSizeTick] = useState(0);
  const [text, setText] = useState('');

  const amDrawer = myId === game.drawerId;
  const word = DRAW_WORDS[game.contentIndex] || '';
  const drawerName = (players.find((p) => p.id === game.drawerId) || {}).name || '—';
  const myGuesses = (guesses || []).filter((g) => g.round === game.round);
  const iGotIt = myGuesses.some((g) => g.by === myId && g.correct);

  // Ajusta el tamaño del lienzo a su contenedor.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    function fit() {
      const rect = c.getBoundingClientRect();
      c.width = Math.round(rect.width);
      c.height = Math.round(rect.height);
      setSizeTick((t) => t + 1);
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Redibuja todos los trazos cuando cambian (o cambia el tamaño).
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const scale = c.width / 360;
    (segments || []).forEach((s) => {
      ctx.strokeStyle = s.c;
      ctx.lineWidth = Math.max(1, s.w * scale);
      ctx.beginPath();
      ctx.moveTo(s.x0 * c.width, s.y0 * c.height);
      ctx.lineTo(s.x1 * c.width, s.y1 * c.height);
      ctx.stroke();
    });
  }, [segments, sizeTick]);

  function pt(e) {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  }
  function down(e) {
    if (!amDrawer) return;
    drawing.current = true;
    last.current = pt(e);
    e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!amDrawer || !drawing.current) return;
    const cur = pt(e);
    const p = last.current;
    const d = Math.hypot(cur.x - p.x, cur.y - p.y);
    if (d < 0.004) return;
    actions.pushSegment({ x0: p.x, y0: p.y, x1: cur.x, y1: cur.y, c: eraser ? '#ffffff' : color, w: eraser ? 18 : 4 });
    last.current = cur;
  }
  function up() {
    drawing.current = false;
  }

  function send() {
    const tx = text.trim();
    if (!tx) return;
    setText('');
    const correct = norm(tx) === norm(word);
    if (correct) Sound.correct();
    actions.guessDraw(tx, correct, game.round);
  }

  const isLast = game.round + 1 >= game.rounds;

  return (
    <div style={{ paddingTop: 16 }}>
      <div className="topbar">
        <div className="chips">
          <span className="chip" style={{ cursor: 'default' }}>
            🎨 {game.mode === 'party' ? `Juego ${game.step + 1}/${game.playlistLen}` : `${game.round + 1}/${game.rounds}`}
          </span>
          <span className="chip" style={{ cursor: 'default' }}>
            ✏️ {amDrawer ? 'Dibujas tú' : drawerName}
          </span>
        </div>
        <TimerRing
          endsAt={game.timerEnd}
          total={DRAW_SECONDS}
          runKey={game.instance + ':' + game.round}
          onEnd={isHost && game.mode !== 'party' ? (isLast ? actions.finishGame : actions.drawNext) : undefined}
        />
      </div>

      {game.phase === 'result' ? (
        <div className="card" style={{ marginTop: 12, textAlign: 'center', padding: 14, background: '#fff6e0' }}>
          <span className="lbl" style={{ display: 'inline' }}>La palabra era: </span>
          <span className="display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>
            {word.toUpperCase()}
          </span>
          <div style={{ marginTop: 6, fontWeight: 700, color: '#1f8a5b', fontSize: 14 }}>
            {(() => {
              const got = myGuesses
                .filter((g) => g.correct)
                .map((g) => (players.find((p) => p.id === g.by) || {}).name)
                .filter(Boolean);
              return got.length ? `Adivinaron: ${got.join(', ')} 🎉` : 'Nadie adivinó esta vez 😅';
            })()}
          </div>
        </div>
      ) : amDrawer ? (
        <div className="card" style={{ marginTop: 12, textAlign: 'center', padding: 12 }}>
          <span className="lbl" style={{ display: 'inline' }}>Dibuja: </span>
          <span className="display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>
            {word.toUpperCase()}
          </span>
        </div>
      ) : iGotIt ? (
        <div className="card" style={{ marginTop: 12, textAlign: 'center', padding: 12, background: '#e9f9f1' }}>
          <b style={{ color: '#1f8a5b' }}>¡Adivinaste! 🎉 Espera la siguiente ronda.</b>
        </div>
      ) : (
        <p className="muted" style={{ textAlign: 'center', marginTop: 12, fontWeight: 700 }}>
          Adivina qué está dibujando 👇
        </p>
      )}

      <div className="canvasbox" style={{ marginTop: 12 }}>
        <canvas
          ref={canvasRef}
          className="drawcanvas"
          style={{ touchAction: 'none', cursor: amDrawer ? 'crosshair' : 'default', pointerEvents: amDrawer ? 'auto' : 'none' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
      </div>

      {amDrawer && (
        <div className="drawtools">
          {PALETTE.map((c) => (
            <button
              key={c}
              className={'swatch' + (!eraser && color === c ? ' on' : '')}
              style={{ background: c }}
              onClick={() => {
                setEraser(false);
                setColor(c);
              }}
            />
          ))}
          <button className={'swatch eraser' + (eraser ? ' on' : '')} onClick={() => setEraser(true)} title="Borrador">
            🩹
          </button>
          <button className="btn btn-light" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => actions.clearCanvas()}>
            Limpiar
          </button>
        </div>
      )}

      {!amDrawer && !iGotIt && game.phase !== 'result' && (
        <div className="guessbar">
          <input
            className="txt"
            placeholder="Escribe tu respuesta…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn btn-primary" style={{ padding: '12px 16px' }} onClick={send}>
            Enviar
          </button>
        </div>
      )}

      <div className="card" style={{ marginTop: 12, padding: 12 }}>
        <label className="lbl">Adivinanzas</label>
        <div className="guesslist">
          {myGuesses.length === 0 && <span className="faint" style={{ fontSize: 13 }}>Aún nadie adivina…</span>}
          {myGuesses
            .slice(-8)
            .reverse()
            .map((g, i) => {
              const who = (players.find((p) => p.id === g.by) || {}).name || '?';
              return (
                <div key={i} className={'gitem' + (g.correct ? ' ok' : '')}>
                  <b>{who}:</b> {g.correct ? '¡adivinó! ✅' : g.text}
                </div>
              );
            })}
        </div>
      </div>

      {isHost && game.mode !== 'party' && (
        <div className="hostbar">
          <div className="tag">⚙ Anfitrión</div>
          <div className="row">
            <button className="btn btn-light" onClick={() => actions.finishGame()}>
              Terminar juego
            </button>
            <button className="btn btn-primary" onClick={() => (isLast ? actions.finishGame() : actions.drawNext())}>
              {isLast ? 'Terminar 🏁' : 'Siguiente dibujante ›'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
