import { LiveObject, LiveMap, LiveList } from '@liveblocks/client';

export const PUBLIC_KEY = import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY;

// Estado inicial de una sala. Solo el PRIMER cliente que entra lo crea;
// los demás reciben el estado ya existente.
//
//   game     -> estado de la partida (fase, juego activo, ronda, etc.)
//   players  -> { id: { name, avatar } }
//   points   -> { id: puntos acumulados }
//   answers  -> respuestas de la ronda actual, clave "instancia:ronda:jugador"
//   bets     -> apuesta de género por jugador (persiste toda la fiesta)
//   segments -> trazos del dibujo de la ronda actual
//   guesses  -> adivinanzas (dibujo) con { by, text, correct, round, at }
//   letters  -> letras del ahorcado con { l, by }
export function makeInitialStorage() {
  return {
    game: new LiveObject({
      hostId: null,
      screen: 'hub',
      phase: 'idle',
      round: 0,
      rounds: 0,
      instance: 0,
      awarded: true,
      order: [],
      contentIndex: 0,
      drawerId: null,
      timerEnd: null,
      revealed: null,
    }),
    players: new LiveMap(),
    points: new LiveMap(),
    answers: new LiveMap(),
    bets: new LiveMap(),
    segments: new LiveList([]),
    guesses: new LiveList([]),
    letters: new LiveList([]),
  };
}
