# 🎉 La Gran Revelación

Hub de mini-juegos multijugador **en tiempo real** para un *gender reveal*. Todos juegan desde su celular entrando a una sala con un código. El anfitrión lanza juegos desde un panel, los puntos se acumulan entre todos y la **Gran Revelación** es el gran final.

Hecho con **React + Vite + Liveblocks**. Sin servidor propio, sin base de datos que administrar, sin login. Se publica gratis en **Vercel** y **no necesitas la terminal** para nada.

---

## 🎮 Qué incluye

- 🎲 **La apuesta del bebé** — cada quien apuesta el género (Hombre / Mujer / Therian / Comunista). Queda guardada hasta el final.
- 🎯 **Trivia de apuestas** — preguntas de opinión; gana quien piensa como la mayoría. Con cronómetro.
- 🎨 **Dibujo (Pictionary)** — alguien dibuja en un lienzo compartido en vivo y los demás adivinan escribiendo.
- 🔤 **Ahorcado en equipo** — todos comparten un teclado para adivinar la palabra antes de quedarse sin vidas.
- 🤔 **¿Quién es más probable?** — votas por una persona de la sala; se corona al más votado.
- 🎊 **Gran Revelación** — el anfitrión revela la verdad, explota el confetti y se reparten +3 a quienes le atinaron.

Cada juego es corto y con dinámica distinta para que no se haga monótono. El ranking de la fiesta es uno solo y se acumula a lo largo de todos los juegos.

---

## 🚀 Puesta en marcha (rápida)

Necesitas **Node 18 o superior** instalado una sola vez (https://nodejs.org).

### 1) Tu llave de Liveblocks (gratis, sin tarjeta)

1. Entra a **https://liveblocks.io** y crea una cuenta.
2. Crea un proyecto nuevo.
3. Ve a **API keys** y copia la **Public key** (empieza con `pk_`).

### 2) Configura el proyecto

1. Copia el archivo `.env.example` y renómbralo a **`.env`**.
2. Pega tu llave:
   ```
   VITE_LIVEBLOCKS_PUBLIC_KEY=pk_tu_llave_aqui
   ```

### 3) Pruébalo en tu compu

```
npm install
npm run dev
```

Abre el link que aparece (algo como `http://localhost:5173`). Crea una sala y entra desde tu celular con el código para probar en vivo. ✅

---

## ☁️ Publicar SIN terminal (para que todos entren por internet)

La idea: subes el proyecto a **GitHub** y lo conectas a **Vercel**. Vercel lo compila en la nube y te da un dominio gratis tipo `tufiesta.vercel.app`.

### Paso A — Subir a GitHub (sin comandos)
- Opción fácil: instala **GitHub Desktop** (https://desktop.github.com), arrastra esta carpeta, y dale *Publish repository*.
- O en **github.com**: *New repository* → *uploading an existing file* → arrastra **todos los archivos del proyecto** (¡menos la carpeta `node_modules`!).

### Paso B — Conectar Vercel
1. Entra a **https://vercel.com** y crea cuenta con tu GitHub.
2. *Add New… → Project* → elige tu repositorio. Vercel detecta Vite solo.
3. **MUY IMPORTANTE:** antes de *Deploy*, abre **Environment Variables** y agrega:
   - Name: `VITE_LIVEBLOCKS_PUBLIC_KEY`
   - Value: tu llave `pk_…`
4. Dale **Deploy**. En ~1 minuto tienes tu dominio gratis. 🎈

Cada vez que cambies algo en GitHub, Vercel vuelve a publicar solo.

> Alternativa: **Netlify** funciona igual (conecta el repo y agrega la misma variable de entorno).

---

## 🕹️ Cómo se juega

1. El **anfitrión** crea la sala y comparte el código (o el link) por WhatsApp.
2. Cada invitado entra, pone su nombre y elige avatar.
3. El anfitrión toca **▶️ Empezar la fiesta** y la app hace todo sola:
   - primero todos hacen su **apuesta** del género (con cuenta regresiva),
   - luego salen **15 mini-juegos al azar**, uno tras otro,
   - **antes de cada juego** aparece una pantalla de "cómo se juega" con su cuenta regresiva, para que todos sepan qué hacer,
   - cada juego avanza solo, muestra resultados y sigue al siguiente,
   - al final llega la **Gran Revelación**: el anfitrión toca la respuesta real y se reparte el bono.
4. Como todo avanza solo, **el anfitrión también juega**. Solo le queda una barrita con ⏭️ Saltar y 🎊 Revelación por si quiere brincar algo.

¿Prefieres control total? En el hub hay un "▼ lanzar los juegos a mano" que despliega el modo manual (lanzas cada juego y avanzas tú).

El que crea la sala es el anfitrión y su teléfono es el que dirige la fiesta. Si recarga la página sigue siendo anfitrión y la fiesta se retoma sola.

---

## ✏️ Personalizar

Todo el contenido editable está en **`src/lib/content.js`**:

- `GENDER` — las opciones de la apuesta/revelación.
- `TRIVIA` — preguntas de opinión (agrega las que quieras).
- `DRAW_WORDS` — palabras para dibujar.
- `HANGMAN_WORDS` — palabras del ahorcado (sin acentos; la Ñ sí se vale).
- `MOSTLIKELY` — frases de “¿quién es más probable?”.

Otros ajustes rápidos en **`src/lib/game.js`**: `TRIVIA_SECONDS`, `DRAW_SECONDS`, `GENDER_BONUS`, y el número de rondas (en `src/Room.jsx`, dentro de `startGame`).

Después de editar: si ya está en Vercel, solo sube el cambio a GitHub y se republica solo.

---

## 🧠 Notas técnicas

- **Sin backend propio.** Liveblocks sincroniza el estado de la sala (storage) en tiempo real con tu llave pública. No hay funciones de servidor ni base de datos que mantener.
- **Identidad sin login:** cada dispositivo guarda un id estable en `localStorage`.
- **Salas:** el id en Liveblocks es `lagranrevelacion-CÓDIGO`. El código va en la URL (`?room=XXXX`).
- **Puntos:** se acreditan una vez al terminar cada juego (con un candado para no contar doble). El género suma +3 al revelar.
- **Plan gratis** de Liveblocks alcanza de sobra para una fiesta. Si esperas mucha gente, revisa los límites de conexiones simultáneas de tu plan.
