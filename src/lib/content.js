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

// ---- DIBUJO (Pictionary): palabras para dibujar (temática bebé, colombiano) ----
export const DRAW_WORDS = [
  'tetero', 'pañal', 'cuna', 'sonajero', 'cigüeña', 'chupo', 'coche', 'peluche',
  'ecografía', 'mordedor', 'tina', 'gateo', 'babero', 'pañalera',
];

// ---- AHORCADO (en equipo): palabras sin acentos, colombiano (la Ñ sí se vale) ----
export const HANGMAN_WORDS = [
  'TETERO', 'CHUPO', 'PAÑAL', 'PAÑALERA', 'CUNA', 'COCHE', 'TRASNOCHO', 'ANTOJO',
  'MORDEDOR', 'SONAJERO', 'ABUELA', 'FAMILIA', 'PARTO', 'CIGUENA', 'GATEO',
  'LACTANCIA', 'CONSENTIDO', 'CHINO',
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

// ---- TRIVIA DE LA PAREJA (respuestas reales; el anfitrión las configura) ----
// El "correcto" no está aquí: lo marca el anfitrión en el hub (game/coupleAnswers).
export const COUPLE = [
  ['¿Quién dijo "te amo" primero?', '{dad}', '{mom}', 'Los dos igual'],
  ['¿Cuántos años llevan juntos?', 'Menos de 2', '2 a 3', '4 a 5', '6 o más'],
  ['¿Cómo se conocieron?', 'En el trabajo', 'Por amigos', 'En una app', 'En una fiesta'],
  ['¿Quién es más celoso/a?', '{dad}', '{mom}', 'Ninguno'],
  ['¿Quién cocina mejor?', '{dad}', '{mom}', 'Piden domicilio'],
  ['¿Quién es más ordenado/a?', '{dad}', '{mom}'],
  ['¿Quién llega tarde siempre?', '{dad}', '{mom}'],
  ['¿Quién gana las discusiones?', '{dad}', '{mom}', 'Nadie cede'],
  ['¿De quién fue la idea del bebé?', '{dad}', '{mom}', 'De los dos'],
  ['¿Quién es más fiestero/a?', '{dad}', '{mom}'],
].map(buildQ);

// ---- ESCRIBE Y VOTA (prompts abiertos estilo Quiplash) ----
export const QUIP = [
  'El peor consejo para los nuevos papás es…',
  'Si es niño, de cariño le van a decir…',
  'Lo primero que va a hacer {mom} cuando nazca el bebé es…',
  'La regla más estricta que va a poner {mom} es…',
  '{dad} va a malcriar al bebé comprándole…',
  'El bebé va a heredar de {dad} la obsesión por…',
  'Son las 3am y el bebé llora porque…',
  'El primer berrinche épico del bebé va a ser por…',
  'El talento secreto de este bebé va a ser…',
  'Lo que jamás le vamos a contar al bebé de la fiesta de hoy es…',
  'El bebé va a salir experto en…',
  'La excusa de {dad} para no cambiar el pañal va a ser…',
];

// ---- BOLETA DE PREDICCIONES (extras; el género va aparte en GENDER) ----
export const PREDICT = [
  ['¿A quién se va a parecer?', 'A {dad}', 'A {mom}', 'A la abuela', 'Al vecino 👀'],
  ['¿Cuánto va a pesar al nacer?', 'Menos de 3 kg', '3 a 3.5 kg', '3.5 a 4 kg', 'Campeón +4 kg'],
  ['¿Cuándo va a nacer?', 'Antes de la fecha', 'El día exacto', 'Después de la fecha'],
  ['¿Qué va a ser de grande?', 'Deportista', 'Artista', 'Científico', 'Influencer'],
  ['¿Cuál será su primera palabra?', '"Mamá"', '"Papá"', '"No"', '"Wifi"'],
].map(buildQ);
