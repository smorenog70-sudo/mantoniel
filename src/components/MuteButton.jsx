import { useState } from 'react';
import { isMuted, setMuted } from '../lib/sound';

export default function MuteButton() {
  const [m, setM] = useState(isMuted());
  return (
    <button
      className="muteBtn"
      aria-label={m ? 'Activar sonido' : 'Silenciar'}
      onClick={() => {
        const next = !m;
        setMuted(next);
        setM(next);
      }}
    >
      {m ? '🔇' : '🔊'}
    </button>
  );
}
