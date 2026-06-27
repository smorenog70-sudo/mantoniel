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
// Usa {dad}/{mom} para los nombres (se rellenan con lo que ponga el anfitrión).
export const TRIVIA = [
  ['¿A quién se va a parecer el bebé?', 'A {mom}', 'A {dad}', 'A la abuela', 'Al vecino 👀'],
  ['¿Quién va a malcriar más al bebé?', '{mom}', '{dad}', 'Los abuelos', 'Los tíos'],
  ['¿Quién va a ser el más estricto criando?', '{mom}', '{dad}', 'Los dos', 'Nadie se atreve'],
  ['¿Quién va a llevar al bebé al gym desde chiquito?', '{dad}', '{mom}', 'Nadie', 'Hasta los 18'],
  ['¿Quién va a poner Betty la Fea de fondo en la casa?', '{mom}', '{dad}', 'La abuela', 'Nadie, por piedad'],
  ['¿Quién va a salir más tacaño con los juguetes?', '{dad}', '{mom}', 'Igualito los dos', 'Los abuelos compran todo'],
  ['El bebé va a salir bien fiestero… ¿a quién?', '{dad}', '{mom}', 'A los tíos', 'A los abuelos'],
  ['¿De quién hereda el bebé la flojera para el ejercicio?', '{mom}', '{dad}', 'De nadie, será atleta', 'Pura flojera'],
  ['¿Quién va a armar el primer cumple estilo Halloween?', '{mom}', '{dad}', 'Los abuelos', 'Nadie, será en verano'],
  ['¿Quién va a enseñarle al bebé a jugar volleyball?', '{dad}', '{mom}', 'El tío', 'Nadie'],
  ['¿Quién va a llorar más en el parto?', '{dad}', '{mom}', 'Los dos', 'El doctor'],
  ['¿Quién se va a despertar a media noche por el bebé?', '{mom}', '{dad}', 'Los dos', 'La abuela'],
  ['¿Cuál será la primera palabra del bebé?', '"Mamá"', '"Papá"', '"No"', '"Wifi"'],
  ['¿Quién va a consentir de más al bebé?', '{dad}', '{mom}', 'Los abuelos', 'Los tíos'],
  ['¿Por qué irá a terapia el bebé de grande?', 'Por {mom}', 'Por {dad}', 'Por la familia', 'Por este gender reveal'],
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
