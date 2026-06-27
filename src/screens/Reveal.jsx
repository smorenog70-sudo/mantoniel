import { useStorage } from '@liveblocks/react';
import Leaderboard from '../components/Leaderboard';
import { GENDER, PREDICT } from '../lib/content';
import { colorOf, labelOf, revealEmoji, shade, fill, maxKey, tally } from '../lib/game';
import { Sound } from '../lib/sound';
import { fireConfetti } from '../lib/confetti';

export default function Reveal({ game, players, board, myId, isHost, actions, predictions }) {
  const bets = useStorage((root) => root.bets) || new Map();
  const pmap = {};
  players.forEach((p) => (pmap[p.id] = p));
  const betEntries = [];
  for (const [pid, opt] of bets) betEntries.push({ pid, opt });

  // resumen de predicciones de la banda (opción más elegida por pregunta)
  const recap = PREDICT.map((q0, qi) => {
    const vals = {};
    players.forEach((p) => {
      const v = predictions && predictions[p.id + ':' + qi];
      if (v) vals[p.id] = v;
    });
    const top = maxKey(tally(vals));
    return { text: fill(q0.text, game.dad, game.mom), top: top ? fill(labelOf(q0.options, top), game.dad, game.mom) : null, n: Object.keys(vals).length };
  }).filter((r) => r.top);

  // antes de revelar
  if (!game.revealed) {
    const placed = betEntries.length;
    return (
      <div style={{ paddingTop: 28 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 60, animation: 'wob 3s ease-in-out infinite', display: 'inline-block' }}>🥁</div>
          <h1 className="title display">¡Llegó el momento!</h1>
          <p className="sub" style={{ maxWidth: 320, margin: '0 auto' }}>
            {placed} {placed === 1 ? 'persona apostó' : 'personas apostaron'}. Es hora de la verdad…
          </p>
        </div>

        <Leaderboard board={board} myId={myId} mode="full" title="🏆 Así van antes del bono" />

        {recap.length > 0 && (
          <div className="card mt">
            <label className="lbl">📋 Lo que predijo la banda</label>
            <div className="lb">
              {recap.map((r, i) => (
                <div key={i} className="lbrow" style={{ alignItems: 'flex-start' }}>
                  <span className="nm" style={{ flex: 1 }}>{r.text}</span>
                  <span className="pts" style={{ color: '#1f8a5b', fontSize: 14 }}>{r.top}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isHost ? (
          <div className="card mt">
            <label className="lbl">🎊 Revela la verdad</label>
            <p style={{ fontSize: 12.5, color: '#8a7d55', fontWeight: 600, margin: '0 0 6px' }}>
              Toca la respuesta real. Explota todo y se reparten +3 a quienes le atinaron.
            </p>
            {GENDER.options.map((o) => (
              <button
                key={o.id}
                className="btn full"
                style={{ background: o.color, color: '#fff', marginTop: 8, fontFamily: "'Fredoka',sans-serif", fontWeight: 700 }}
                onClick={() => actions.revealGender(o.id)}
              >
                Revelar: {o.label}
              </button>
            ))}
            <button className="btn btn-ghost full" style={{ marginTop: 12 }} onClick={() => actions.backToHub()}>
              ‹ Volver al hub
            </button>
          </div>
        ) : (
          <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontWeight: 700 }}>
            El anfitrión va a revelar… 🥁
          </p>
        )}
      </div>
    );
  }

  // revelado
  const col = colorOf(GENDER.options, game.revealed);
  const lab = labelOf(GENDER.options, game.revealed);
  const winners = betEntries.filter((b) => b.opt === game.revealed).map((b) => pmap[b.pid]).filter(Boolean);
  const losers = betEntries.filter((b) => b.opt !== game.revealed).map((b) => pmap[b.pid]).filter(Boolean);

  return (
    <div style={{ paddingTop: 8 }}>
      <div
        style={{
          borderRadius: 28,
          padding: '34px 20px 28px',
          textAlign: 'center',
          marginTop: 10,
          background: `linear-gradient(160deg, ${col} 0%, ${shade(col, -28)} 100%)`,
          boxShadow: `0 24px 60px ${col}66`,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.9 }}>La verdad es…</div>
        <div style={{ fontSize: 96, lineHeight: 1, margin: '6px 0', animation: 'popIn .7s cubic-bezier(.2,1.2,.3,1) both' }}>
          {revealEmoji(lab)}
        </div>
        <div className="display" style={{ fontWeight: 700, fontSize: 46, lineHeight: 1, textShadow: '0 3px 14px rgba(0,0,0,.25)' }}>
          ¡Es {lab}!
        </div>
        {(game.dad || game.mom) && (
          <div style={{ marginTop: 8, fontWeight: 800, fontSize: 15, opacity: 0.95 }}>
            👶 {game.dad || 'Papá'} &amp; {game.mom || 'Mamá'}
          </div>
        )}
        <button
          className="btn"
          style={{ marginTop: 16, background: 'rgba(255,255,255,.22)', color: '#fff', border: '2px solid rgba(255,255,255,.5)' }}
          onClick={() => {
            Sound.reveal();
            fireConfetti([col, '#FFC94D', '#fff']);
          }}
        >
          🎊 Más confetti
        </button>
      </div>

      <div className="card mt">
        <label className="lbl">🍼 Le atinaron ({winners.length})</label>
        <div className="players">
          {winners.length ? (
            winners.map((v) => (
              <span key={v.id} className="pchip" style={{ background: col, color: '#fff' }}>
                <span className="a">{v.avatar}</span>
                {v.name}
              </span>
            ))
          ) : (
            <span className="faint" style={{ fontSize: 13 }}>
              Nadie. Los sorprendió a todos 😅
            </span>
          )}
        </div>
        {losers.length > 0 && (
          <>
            <label className="lbl" style={{ marginTop: 14, color: '#9a93a6' }}>
              No le atinaron ({losers.length}) 😬
            </label>
            <div className="players">
              {losers.map((v) => (
                <span key={v.id} className="pchip" style={{ color: '#9a93a6' }}>
                  <span className="a">{v.avatar}</span>
                  {v.name}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <Leaderboard board={board} myId={myId} mode="full" title="🏆 Tabla final" />

      {isHost && (
        <div className="row mt">
          <button className="btn btn-light" onClick={() => actions.backToHub()}>
            Volver al hub
          </button>
          <button className="btn btn-primary" onClick={() => actions.resetParty()}>
            ↺ Jugar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
