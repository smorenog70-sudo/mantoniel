import { useState } from 'react';
import { useStorage } from '@liveblocks/react';
import TimerRing from '../components/TimerRing';
import Leaderboard from '../components/Leaderboard';
import { QUIP } from '../lib/content';
import { fill, QUIP_WRITE_SECONDS, QUIP_VOTE_SECONDS } from '../lib/game';
import { Sound } from '../lib/sound';

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export default function Quip({ game, players, board, myId, isHost, actions }) {
  const textsMap = useStorage((root) => root.texts);
  const answersMap = useStorage((root) => root.answers);
  const [text, setText] = useState('');

  const prompt = fill(QUIP[game.contentIndex] || '', game.dad, game.mom);
  const pmap = {};
  players.forEach((p) => (pmap[p.id] = p));

  // respuestas de esta ronda
  const pre = game.instance + ':';
  const entries = [];
  for (const [k, v] of textsMap || []) {
    if (k.indexOf(pre) === 0) entries.push({ pid: k.slice(pre.length), text: v });
  }
  entries.sort((a, b) => hashStr(a.pid + game.instance) - hashStr(b.pid + game.instance));
  const myText = (entries.find((e) => e.pid === myId) || {}).text || '';

  // votos
  const vpre = game.instance + ':0:';
  const votes = {};
  let myVote = null;
  for (const [k, v] of answersMap || []) {
    if (k.indexOf(vpre) === 0) {
      const voter = k.slice(vpre.length);
      if (voter === myId) myVote = v;
      if (v && v !== voter) votes[v] = (votes[v] || 0) + 1;
    }
  }

  const phase = game.phase;

  // ---- ESCRIBIR ----
  if (phase === 'write') {
    return (
      <div style={{ paddingTop: 18 }}>
        <div className="topbar">
          <div className="chips">
            <span className="chip" style={{ cursor: 'default' }}>
              ✍️ Juego {game.step + 1}/{game.playlistLen}
            </span>
          </div>
          <TimerRing endsAt={game.timerEnd} total={QUIP_WRITE_SECONDS} runKey={game.instance + ':w'} />
        </div>
        <h2 className="resq display" style={{ marginTop: 16 }}>
          {prompt}
        </h2>
        <p className="muted" style={{ fontWeight: 700, margin: '0 0 8px' }}>
          Escribe la respuesta más chistosa 😏 (luego todos votan)
        </p>
        <div className="guessbar">
          <input
            className="txt"
            maxLength={120}
            placeholder="Tu respuesta…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && text.trim()) {
                actions.submitText(text.trim());
                Sound.tap();
              }
            }}
          />
          <button
            className="btn btn-primary"
            style={{ padding: '12px 16px' }}
            onClick={() => {
              if (text.trim()) {
                actions.submitText(text.trim());
                Sound.tap();
              }
            }}
          >
            Enviar
          </button>
        </div>
        {myText && (
          <div className="card" style={{ marginTop: 12, padding: 12, background: '#e9f9f1' }}>
            <span className="lbl" style={{ display: 'inline' }}>Tu respuesta: </span>
            <b style={{ color: '#1f8a5b' }}>{myText}</b>
            <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>Puedes cambiarla antes de que acabe el tiempo.</div>
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <span className="chip" style={{ cursor: 'default', background: 'rgba(86,197,150,.18)', borderColor: 'rgba(86,197,150,.4)' }}>
            🟢 <b>{entries.length}</b>&nbsp;de {players.length} ya escribieron
          </span>
        </div>
      </div>
    );
  }

  // ---- VOTAR ----
  if (phase === 'vote') {
    const options = entries.filter((e) => e.pid !== myId);
    const voted = Object.keys(answersMap ? Object.fromEntries([...answersMap].filter(([k]) => k.indexOf(vpre) === 0)) : {}).length;
    return (
      <div style={{ paddingTop: 18 }}>
        <div className="topbar">
          <div className="chips">
            <span className="chip" style={{ cursor: 'default' }}>
              🗳️ Juego {game.step + 1}/{game.playlistLen}
            </span>
          </div>
          <TimerRing endsAt={game.timerEnd} total={QUIP_VOTE_SECONDS} runKey={game.instance + ':v'} />
        </div>
        <h2 className="resq display" style={{ marginTop: 16 }}>
          {prompt}
        </h2>
        <p className="muted" style={{ fontWeight: 700, margin: '0 0 8px' }}>
          Vota por la más chistosa 👇
        </p>
        {options.length === 0 ? (
          <p className="faint">Nadie más escribió 🙈</p>
        ) : (
          <div className="opts">
            {options.map((e) => (
              <button
                key={e.pid}
                className={'opt' + (myVote === e.pid ? ' sel' : '')}
                style={{ fontSize: 15 }}
                onClick={() => {
                  Sound.tap();
                  actions.submitAnswer(e.pid);
                }}
              >
                {e.text}
                <span className="check" style={{ background: '#56C596' }}>
                  ✓
                </span>
              </button>
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <span className="chip" style={{ cursor: 'default', background: 'rgba(86,197,150,.18)', borderColor: 'rgba(86,197,150,.4)' }}>
            🟢 <b>{voted}</b>&nbsp;de {players.length} votaron
          </span>
        </div>
      </div>
    );
  }

  // ---- RESULTADO ----
  let max = 0;
  for (const a in votes) if (votes[a] > max) max = votes[a];
  const ranked = entries.map((e) => ({ ...e, n: votes[e.pid] || 0 })).sort((a, b) => b.n - a.n);

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="chips">
        <span className="chip" style={{ cursor: 'default' }}>
          😂 Resultado · Juego {game.step + 1}/{game.playlistLen}
        </span>
      </div>
      <h2 className="resq display" style={{ marginTop: 16 }}>
        {prompt}
      </h2>
      <div className="card" style={{ marginTop: 8 }}>
        {ranked.length === 0 && <span className="faint" style={{ fontSize: 13 }}>Nadie escribió esta vez 🙈</span>}
        {ranked.map((e) => {
          const who = pmap[e.pid] || { name: '?', avatar: '👤' };
          const win = e.n > 0 && e.n === max;
          return (
            <div key={e.pid} className={'quipres' + (win ? ' win' : '')}>
              <div className="qtext">
                {win ? '👑 ' : ''}
                {e.text}
              </div>
              <div className="qmeta">
                <span>
                  {who.avatar} {who.name}
                </span>
                <b>
                  {e.n} {e.n === 1 ? 'voto' : 'votos'}
                </b>
              </div>
            </div>
          );
        })}
      </div>
      <Leaderboard board={board} myId={myId} mode="mini" title="🏆 Ranking de la fiesta" />
    </div>
  );
}
