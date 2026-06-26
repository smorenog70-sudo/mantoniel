import { useEffect, useRef, useState } from 'react';
import { Sound } from '../lib/sound';

const R = 26;
const C = 2 * Math.PI * R;

// Cuenta regresiva sincronizada: calcula el tiempo a partir de un sello
// absoluto (endsAt, epoch ms) que pone el anfitrión. Llama onEnd UNA vez.
export default function TimerRing({ endsAt, total, onEnd, runKey }) {
  const [rem, setRem] = useState(total);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    const ticked = {};
    let ended = false;

    function compute() {
      const r = endsAt ? Math.max(0, (endsAt - Date.now()) / 1000) : total;
      setRem(r);
      const sec = Math.ceil(r);
      if (sec <= 3 && sec >= 1 && !ticked[sec] && r > 0) {
        ticked[sec] = true;
        Sound.tick();
      }
      if (endsAt && r <= 0 && !ended) {
        ended = true;
        clearInterval(id);
        if (onEndRef.current) onEndRef.current();
      }
    }

    compute();
    const id = setInterval(compute, 200);
    return () => clearInterval(id);
  }, [endsAt, total, runKey]);

  const sec = Math.ceil(rem);
  const frac = total > 0 ? Math.max(0, Math.min(1, rem / total)) : 0;
  const color = sec <= 5 ? '#E0524E' : sec <= 10 ? '#FFC94D' : '#56C596';

  return (
    <svg width="62" height="62" viewBox="0 0 62 62" style={{ flex: '0 0 auto' }}>
      <circle cx="31" cy="31" r={R} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="6" />
      <circle
        cx="31"
        cy="31"
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - frac)}
        transform="rotate(-90 31 31)"
        style={{ transition: 'stroke-dashoffset .2s linear' }}
      />
      <text
        x="31"
        y="31"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Fredoka,sans-serif"
        fontWeight="700"
        fontSize="22"
        fill={color}
      >
        {sec}
      </text>
    </svg>
  );
}
