// Fila de jugadores como chips. Si onPick está, son botones (para votar).
export default function PlayersRow({ players, myId, selectedId, onPick, disabledIds }) {
  return (
    <div className="players">
      {players.map((p) => {
        const me = p.id === myId;
        const selected = selectedId === p.id;
        const disabled = disabledIds && disabledIds.indexOf(p.id) >= 0;
        const base = 'pchip' + (onPick ? ' pick' : '') + (selected ? ' on' : '');
        const style = me && !onPick ? { border: '2px solid var(--gold)', background: '#fff6e0', color: 'var(--ink)' } : undefined;
        if (onPick) {
          return (
            <button key={p.id} className={base} style={style} disabled={disabled} onClick={() => onPick(p.id)}>
              <span className="a">{p.avatar}</span>
              {p.name}
              {me ? ' (tú)' : ''}
            </button>
          );
        }
        return (
          <span key={p.id} className={base} style={style}>
            <span className="a">{p.avatar}</span>
            {p.name}
            {me ? ' (tú)' : ''}
          </span>
        );
      })}
    </div>
  );
}
