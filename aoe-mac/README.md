# Age of Empires clásico en Mac

`aoe.sh` instala y abre en macOS las versiones originales en CD de Microsoft usando
[Wine](https://www.winehq.org/), que traduce las llamadas de Windows a macOS:

| Juego | Año | Código |
|---|---|---|
| Age of Empires II: The Conquerors (expansión) | 2000 | `tc` |
| Age of Empires II: The Age of Kings | 1999 | `aok` |
| Age of Empires: The Rise of Rome (expansión) | 1998 | `ror` |
| Age of Empires | 1997 | `aoe` |

> El juego **no viene incluido**: necesitas tus CDs (o imágenes `.iso` de ellos) o la
> carpeta del juego ya instalada, copiada de un PC con Windows.

Funciona en Mac Intel y Apple Silicon (M1/M2/M3/M4…, mediante Rosetta 2), con macOS 10.15 o más nuevo.

## Instalación rápida

Abre la app **Terminal**, ve a esta carpeta y sigue estos pasos:

```bash
cd ruta/a/aoe-mac
chmod +x aoe.sh

./aoe.sh instalar-wine          # 1. Rosetta 2 + Wine (solo la primera vez)
./aoe.sh preparar               # 2. Crea el entorno de Windows para el juego
./aoe.sh instalar ~/Downloads/AOE2.iso   # 3. Disco 1: Age of Kings
./aoe.sh instalar ~/Downloads/AOC.iso    #    Disco 2: The Conquerors
./aoe.sh parche ~/Downloads/SetupAoC.exe # 4. UserPatch 1.5 (ver abajo)
./aoe.sh graficos               # 5. Arreglo de gráficos para pantallas modernas
./aoe.sh jugar                  # 6. ¡A jugar!
./aoe.sh crear-app tc           # (opcional) App con doble clic en ~/Applications
```

`instalar` acepta tres tipos de origen:

- una imagen del CD: `.iso`, `.cdr`, `.dmg` (se monta sola);
- la carpeta de un CD ya montado, p. ej. `/Volumes/AOE2` (tiene `setup.exe`);
- una carpeta con el juego **ya instalado** copiada de un PC, p. ej.
  `~/Downloads/Age of Empires II` (tiene `empires2.exe` y/o `age2_x1/age2_x1.exe`).
  Es la vía más fiable.

## Paso a paso y por qué

### 1. Wine

`./aoe.sh instalar-wine` instala Rosetta 2 si tu Mac es Apple Silicon y luego intenta instalar
Wine con Homebrew. **Ojo:** en septiembre de 2026 Homebrew deshabilitó el paquete
`wine-stable` porque no pasa la verificación de Gatekeeper. Si falla, el script te indica cómo
instalarlo a mano:

1. Descarga el `.tar.xz` de **wine-stable** de los paquetes oficiales de WineHQ para macOS:
   <https://github.com/Gcenx/macOS_Wine_builds/releases>
2. Descomprímelo y arrastra `Wine Stable.app` a `/Applications`.
3. Ejecuta otra vez `./aoe.sh instalar-wine`, que le quita la cuarentena de Gatekeeper.

Si ya usas otro Wine (CrossOver, Sikarugir/Kegworks, etc.) puedes indicar su binario:
`WINE=/ruta/a/bin/wine ./aoe.sh jugar`.

### 2–3. Instalar el juego

Todo queda en `~/Library/Application Support/AoEClasico/` (un "disco C:" privado del juego),
sin tocar el resto del Mac. Al instalar desde CD se abre el instalador original de Windows;
elige la instalación típica y di que **no** a DirectX o a reiniciar.

### 4. UserPatch (muy recomendado)

Los CDs originales usan una protección anticopia (SafeDisc) que ya no funciona en sistemas
modernos ni en Wine, así que el juego sin parchear suele decir "inserte el CD" o no abre.
**UserPatch 1.5** es el parche de la comunidad para The Conquerors que quita esa exigencia,
corrige errores, añade resoluciones panorámicas y mejora la IA.

1. Descárgalo de <https://userpatch.aiscripting.com/>.
2. `./aoe.sh parche ~/Downloads/SetupAoC.exe` — lo copia a la carpeta del juego y lo ejecuta.

Si UserPatch se queja de la versión, aplica antes el parche oficial **1.0c** de The Conquerors
con el mismo comando (`./aoe.sh parche archivo.exe`).

Para el Age of Empires 1 / Rise of Rome no existe UserPatch: usa su parche oficial más
reciente (1.0a para Rise of Rome) y, si te pide el CD, monta la `.iso` con doble clic y
vuelve a ejecutar `./aoe.sh instalar /Volumes/NOMBRE_DEL_CD` para que Wine lo vea como unidad `D:`.

### 5. Gráficos (cnc-ddraw)

Estos juegos dibujan con DirectDraw a 256 colores y cambian la resolución de la pantalla, cosa
que en un Mac moderno (y más con Retina) suele salir con colores raros, pantalla negra o
parpadeos. `./aoe.sh graficos` instala [cnc-ddraw](https://github.com/FunkyFr3sh/cnc-ddraw),
que reemplaza DirectDraw y escala el juego a tu pantalla manteniendo la proporción, sin cambiar
la resolución del Mac.

- `./aoe.sh graficos` → pantalla completa (sin bordes)
- `./aoe.sh graficos ventana` → en una ventana redimensionable
- `./aoe.sh graficos quitar` → desinstalarlo

Ajustes finos (filtros, FPS, etc.): edita `ddraw.ini` junto al `.exe` (`./aoe.sh carpeta`).

### 6. Jugar

```bash
./aoe.sh jugar        # el más nuevo instalado (normalmente The Conquerors)
./aoe.sh jugar aok    # Age of Kings sin la expansión
./aoe.sh jugar ror    # Age of Empires 1 con Rise of Rome
```

`./aoe.sh crear-app tc ~/imagen.png` crea `~/Applications/Age of Empires II - The Conquerors.app`,
con el icono que quieras, para abrirlo desde el Launchpad o el Dock. Si no arranca, la app
muestra un aviso y guarda el registro en `~/Library/Application Support/AoEClasico/ultimo-arranque.log`.

## Otros comandos

| Comando | Qué hace |
|---|---|
| `./aoe.sh estado` | Muestra Wine, el entorno y qué juegos están instalados |
| `./aoe.sh carpeta` | Abre la carpeta del juego en el Finder (escenarios, partidas, mods) |
| `./aoe.sh config` | Abre `winecfg` (configuración de Wine) |
| `./aoe.sh desinstalar` | Borra todo, **incluidas las partidas guardadas** |

## Problemas frecuentes

- **"Wine Stable.app está dañado" o "no se puede abrir"**: es Gatekeeper. Ejecuta
  `./aoe.sh instalar-wine` o `xattr -dr com.apple.quarantine "/Applications/Wine Stable.app"`.
- **Pide insertar el CD**: aplica UserPatch (paso 4).
- **Pantalla negra, colores psicodélicos o parpadeo**: `./aoe.sh graficos`. Si ya lo tienes,
  prueba el modo ventana o cambia `renderer=opengl` por `renderer=gdi` en `ddraw.ini`.
- **El ratón va desfasado**: usa el modo ventana, o en `ddraw.ini` pon `adjmouse=false`.
- **No hay sonido o música**: la música de AoE1 suena desde el CD (pistas de audio), así que
  con una `.iso` no hay música; los efectos sí deberían oírse.
- **Imagen `.bin/.cue`, `.nrg` o `.mdf`**: macOS no las monta; conviértelas a `.iso` antes
  (p. ej. `brew install bchunk` y `bchunk imagen.bin imagen.cue salida`).
- **Multijugador**: el antiguo servicio de la MSN Gaming Zone ya no existe. Para jugar en red
  local, usa la opción de red TCP/IP del juego con la IP del otro equipo.
