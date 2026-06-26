import { useState } from 'react';
import { Sound } from '../lib/sound';

const AVS = ['🎈', '🍼', '🧸', '⭐', '🌙', '🐣', '🦊', '🐺', '🍭', '👶', '🦄', '🐥'];

export default function Join({ roomCode, started, saved, onJoin, onBack }) {
  const [name, setName] = useState((saved && saved.name) || '');
  const [avatar, setAvatar] = useState((saved && saved.avatar) || AVS[Math.floor(Math.random() * AVS.length)]);
  const [busy, setBusy] = useState(false);

  function go() {
    Sound.unlock();
    if (!name.trim()) return;
    setBusy(true);
    Promise.resolve(onJoin(name.trim(), avatar))
      .then(() => Sound.join())
      .catch(() => setBusy(false));
  }

  return (
    <div style={{ paddingTop: 40 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🎈</div>
        <h1 className="title display" style={{ fontSize: 28 }}>
          Sala {roomCode}
        </h1>
        <p className="sub">{started ? '¡La fiesta ya empezó! Entra rápido' : 'Pon tu nombre para entrar'}</p>
      </div>

      <div className="card mt">
        <label className="lbl">Tu nombre</label>
        <input
          className="txt"
          maxLength={20}
          placeholder="Ej. Santiago"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
        />

        <label className="lbl" style={{ marginTop: 16 }}>
          Elige tu avatar
        </label>
        <div className="avatars">
          {AVS.map((a) => (
            <button
              key={a}
              className={a === avatar ? 'sel' : ''}
              onClick={() => {
                Sound.unlock();
                setAvatar(a);
              }}
            >
              {a}
            </button>
          ))}
        </div>

        <button
          className="btn btn-primary full"
          style={{ marginTop: 18, animation: 'pulseGold 2.4s infinite' }}
          onClick={go}
          disabled={busy}
        >
          {busy ? 'Entrando…' : 'Entrar a la pachanga 🎈'}
        </button>
      </div>

      <p className="faint" style={{ textAlign: 'center', marginTop: 8, fontSize: 12, cursor: 'pointer' }} onClick={onBack}>
        ← Salir
      </p>
    </div>
  );
}
