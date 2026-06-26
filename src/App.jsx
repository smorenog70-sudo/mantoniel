import { useMemo, useState } from 'react';
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react';
import { PUBLIC_KEY, makeInitialStorage } from './lib/liveblocks';
import Ambient from './components/Ambient';
import MuteButton from './components/MuteButton';
import Landing from './screens/Landing';
import Room from './Room';
import { genCode } from './lib/game';

// Identidad estable por dispositivo (sin login).
function getId() {
  try {
    let id = localStorage.getItem('grId');
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('grId', id);
    }
    return id;
  } catch (e) {
    return 'u_' + Math.random().toString(36).slice(2);
  }
}
function getSaved() {
  try {
    return JSON.parse(localStorage.getItem('grUser') || '{}');
  } catch (e) {
    return {};
  }
}
function initialRoom() {
  try {
    return (new URLSearchParams(location.search).get('room') || '').toUpperCase();
  } catch (e) {
    return '';
  }
}
function setUrl(code) {
  try {
    history.replaceState(null, '', code ? '?room=' + code : location.pathname);
  } catch (e) {}
}

export default function App() {
  const myId = useMemo(getId, []);
  const saved = useMemo(getSaved, []);
  const [roomCode, setRoomCode] = useState(initialRoom());
  const [wantHost, setWantHost] = useState(false);

  const initialStorage = useMemo(() => makeInitialStorage(), [roomCode]);

  function create() {
    const code = genCode();
    setWantHost(true);
    setRoomCode(code);
    setUrl(code);
  }
  function enter(code) {
    setWantHost(false);
    setRoomCode(code);
    setUrl(code);
  }
  function leave() {
    setRoomCode('');
    setWantHost(false);
    setUrl('');
  }

  let content;
  if (!PUBLIC_KEY) {
    content = (
      <div style={{ paddingTop: 60 }}>
        <div className="card">
          <h2 className="display" style={{ marginTop: 0, color: 'var(--ink)' }}>Falta tu llave de Liveblocks</h2>
          <p style={{ color: '#5a546b', fontWeight: 600 }}>
            Crea el archivo <b>.env</b> (copia <b>.env.example</b>) y pega tu llave pública de Liveblocks en{' '}
            <b>VITE_LIVEBLOCKS_PUBLIC_KEY</b>. En Vercel, agrégala en Settings → Environment Variables.
          </p>
        </div>
      </div>
    );
  } else if (!roomCode) {
    content = <Landing onCreate={create} onEnter={enter} />;
  } else {
    content = (
      <LiveblocksProvider publicApiKey={PUBLIC_KEY}>
        <RoomProvider id={'lagranrevelacion-' + roomCode} initialPresence={{}} initialStorage={initialStorage}>
          <Room myId={myId} wantHost={wantHost} saved={saved} onLeave={leave} />
        </RoomProvider>
      </LiveblocksProvider>
    );
  }

  return (
    <>
      <Ambient />
      <MuteButton />
      <div className="wrap">{content}</div>
    </>
  );
}
