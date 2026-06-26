import { useMemo } from 'react';

export default function Ambient() {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const items = useMemo(() => {
    if (reduce) return [];
    const em = ['🎈', '🍼', '👶', '⭐', '🌙', '🐺', '☭', '🎊', '🍭', '🧸'];
    return Array.from({ length: 11 }, (_, i) => ({
      e: em[i % em.length],
      left: ((i * 9.1 + (i % 3) * 5) % 96) + 2,
      dur: 16 + (i % 5) * 4,
      delay: -(i * 2.3),
      size: 22 + (i % 4) * 8,
    }));
  }, [reduce]);

  return (
    <div className="ambient">
      {items.map((it, i) => (
        <span
          key={i}
          style={{
            left: it.left + '%',
            fontSize: it.size,
            animationDuration: it.dur + 's',
            animationDelay: it.delay + 's',
          }}
        >
          {it.e}
        </span>
      ))}
    </div>
  );
}
