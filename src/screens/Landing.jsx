import { useState } from 'react';
import { Sound } from '../lib/sound';

export default function Landing({ onCreate, onEnter }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  function enter() {
    Sound.unlock();
    const c = code.trim().toUpperCase();
    if (c.length < 4) {
      setErr('Escribe el código de 4 letras');
      return;
    }
    setErr('');
    onEnter(c);
  }

  return (
    <div style={{ paddingTop: 48 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, display: 'inline-block', animation: 'wob 3s ease-in-out infinite' }}>🎉</div>
        <h1 className="title display">La Gran Revelación</h1>
        <p className="sub" style={{ maxWidth: 340, margin: '0 auto' }}>
          El party game para tu gender reveal: apuestas, trivia, dibujo, ahorcado y la gran sorpresa final. Todos juegan desde su celular.
        </p>
      </div>

      <button
        className="btn btn-primary full mt"
        style={{ animation: 'pulseGold 2.4s infinite' }}
        onClick={() => {
          Sound.unlock();
          onCreate();
        }}
      >
        ✨ Crear sala nueva
      </button>

      <div className="card mt">
        <label className="lbl">¿Te invitaron? Entra con el código</label>
        <input
          className="txt"
          maxLength={6}
          placeholder="Ej. KPR4"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && enter()}
          style={{ textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 800 }}
        />
        {err && <p style={{ color: '#E0524E', fontWeight: 700, fontSize: 13, margin: '8px 0 0' }}>{err}</p>}
        <button className="btn btn-light full mt8" onClick={enter}>
          Unirse a la sala
        </button>
      </div>
    </div>
  );
}
