// Color por posición de opción (1=azul, 2=rosa, 3=morado, 4=rojo...).
export const COLORS = ['#4F9DE0', '#F08FB7', '#9B86D9', '#E0524E', '#FFC94D', '#56C596'];

function buildQ(row) {
  return {
    text: row[0],
    options: row
      .slice(1)
      .filter(Boolean)
      .map((label, i) => ({ id: 'o' + i, label, color: COLORS[i % COLORS.length] })),
  };
}

// ---- LA APUESTA / REVELACIÓN (la pregunta del género) ----
// Se guarda al inicio y se revela en el gran final.
export const GENDER = buildQ(['¿Qué crees que será?', 'Hombre', 'Mujer', 'Therian', 'Comunista']);

// ---- TRIVIA DE APUESTAS (opiniones; gana quien piensa como la mayoría) ----
export const TRIVIA = [
  ['¿A quién se va a parecer?', 'A la mamá', 'Al papá', 'A la abuela', 'Al vecino 👀'],
  ['¿Cuál será su primera palabra?', '"Mamá"', '"Papá"', '"No"', '"Wifi"'],
  ['¿Quién va a cambiar más pañales?', 'La mamá', 'El papá', 'Los abuelos', 'Nadie, niñera'],
  ['¿Qué carácter va a heredar?', 'La calma de mamá', 'El relajo de papá', 'Lo terco de los dos', 'Algo nuevo y peligroso'],
  ['¿Nacerá antes o después de la fecha?', 'Antes', 'El día exacto', 'Después', 'Cuando se le antoje'],
  ['¿Cuál será su talento de grande?', 'Deportista', 'Artista', 'Científico', 'Influencer sin oficio'],
  ['¿Quién lo va a malcriar más?', 'La mamá', 'El papá', 'Los abuelos', 'Los tíos'],
  ['¿Qué va a estudiar?', 'Medicina', 'Ingeniería', 'Arte', 'La revolución ☭'],
  ['¿Cuánto va a pesar al nacer?', 'Menos de 3 kg', '3 a 3.5 kg', '3.5 a 4 kg', 'Campeón de +4 kg'],
  ['¿Será el consentido o el rebelde?', 'El consentido', 'El rebelde', 'Las dos cosas', 'El que une a la familia'],
  ['¿Este bebé los une o los quiebra?', 'Los une para siempre', 'Aguantan "por el niño"', 'Divorcio en 5 años', 'Pelean por la custodia 👀'],
  ['¿Por qué irá a terapia de grande?', 'Por los papás', 'Por los abuelos', 'Por toda la familia', 'Por este gender reveal'],
  ['¿Quién le enseñará la primera grosería?', 'Un tío', 'El papá distraído', 'La abuela "sin querer"', 'El internet'],
  ['¿A qué hora despertará a todos?', '5 a.m. en punto', 'A media noche', 'Nunca duerme', 'Cuando te dormiste'],
  ['¿Cuál será su superpoder de bebé?', 'Llorar con eco', 'Sonrisa que desarma', 'Dormir donde sea', 'Vomitar con puntería'],
].map(buildQ);

// ---- DIBUJO (Pictionary): palabras para dibujar (temática bebé) ----
export const DRAW_WORDS = [
  'biberón', 'pañal', 'cuna', 'sonajero', 'cigüeña', 'chupón', 'carriola', 'peluche',
  'ecografía', 'mordedera', 'bañera', 'gateo', 'baberito', 'cangurera',
];

// ---- AHORCADO (en equipo): palabras sin acentos para teclado simple ----
// (Incluye Ñ; el teclado del juego la trae.)
export const HANGMAN_WORDS = [
  'BIBERON', 'PAÑAL', 'CUNA', 'DESVELO', 'ANTOJO', 'SONAJERO', 'CARRIOLA',
  'PELUCHE', 'ABUELA', 'FAMILIA', 'PARTO', 'CIGUENA', 'GATEO', 'LACTANCIA',
];

// ---- ¿QUIÉN ES MÁS PROBABLE? (votas por una persona de la sala) ----
export const MOSTLIKELY = [
  '¿Quién es más probable que llore primero en el parto?',
  '¿Quién va a malcriar más al bebé?',
  '¿Quién se va a quedar dormido cambiando pañales?',
  '¿Quién le va a enseñar la primera grosería?',
  '¿Quién va a tomar mil fotos de cada bostezo?',
  '¿Quién va a discutir por el nombre del bebé?',
  '¿Quién va a llegar tarde al bautizo?',
  '¿Quién va a consentir al bebé hasta arruinarlo?',
  '¿Quién va a dar el peor consejo de crianza?',
  '¿Quién se va a poner a llorar viendo la ecografía?',
];
