// Tabla de posiciones. mode 'mini' (top 5 + tu puesto) o 'full' (podio).
export default function Leaderboard({ board, myId, mode = 'mini', title }) {
  if (!board || !board.length) return null;

  const limit = mode === 'full' ? 12 : 5;
  const medals = mode === 'full';
  const myI = board.findIndex((p) => p.id === myId);
  const topHasMe = board.slice(0, limit).some((p) => p.id === myId);
  const champ = board[0];
  const showMine = mode === 'full' ? myI >= 0 : !topHasMe && myI >= 0;
  const heading = title || (mode === 'full' ? '🏆 Tabla final' : '🏆 Ranking');

  return (
    <div className="card" style={mode === 'mini' ? { marginTop: 12, padding: 14 } : { marginTop: 16 }}>
      <label className="lbl">{heading}</label>

      {mode === 'full' && champ && (
        <div className="champ">
          Gana {champ.avatar} {champ.name} con {champ.score} pts 🎉
        </div>
      )}

      <div className="lb">
        {board.slice(0, limit).map((p, i) => {
          const me = p.id === myId;
          const rk = medals && i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1;
          return (
            <div key={p.id} className={'lbrow' + (me ? ' me' : '')}>
              <span className="rk">{rk}</span>
              <span className="av">{p.avatar}</span>
              <span className="nm">
                {p.name}
                {me ? ' (tú)' : ''}
              </span>
              <span className="pts">{p.score}</span>
            </div>
          );
        })}
      </div>

      {showMine && (
        <div className="lbmine">
          Vas <b>#{myI + 1}</b> · {board[myI].score} pts
        </div>
      )}
    </div>
  );
}
