import { Sound } from '../lib/sound';

const EMOJIS = ['❤️', '😂', '😮', '🎉', '🔥', '👏'];

export function ReactionBar({ onReact }) {
  return (
    <div className="reactbar">
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => {
            Sound.tap();
            onReact(e);
          }}
          aria-label={'Reaccionar ' + e}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export function ReactionsLayer({ items }) {
  return (
    <div className="reactlayer">
      {items.map((it) => (
        <span key={it.id} style={{ left: it.x + '%' }}>
          {it.emoji}
        </span>
      ))}
    </div>
  );
}
