#!/bin/bash
# aoe.sh — Corre los Age of Empires clásicos de Microsoft (versiones de CD) en macOS usando Wine.
#
#   Age of Empires II: The Age of Kings (1999)  + The Conquerors (2000)
#   Age of Empires (1997)                        + The Rise of Rome (1998)
#
# No incluye el juego: necesitas tus propios CDs/ISOs o una carpeta ya instalada.
# Compatible con el bash 3.2 que trae macOS. Ejecuta `./aoe.sh ayuda` para ver los comandos.

set -euo pipefail

APP_NAME="AoE Clasico"
DATA_DIR="${AOE_DATA_DIR:-$HOME/Library/Application Support/AoEClasico}"
PREFIX="${WINEPREFIX:-$DATA_DIR/prefix}"
CACHE_DIR="$DATA_DIR/cache"
CNC_DDRAW_URL="https://github.com/FunkyFr3sh/cnc-ddraw/releases/latest/download/cnc-ddraw.zip"
GCENX_RELEASES="https://github.com/Gcenx/macOS_Wine_builds/releases"
CD_DRIVE="d:"

export WINEPREFIX="$PREFIX"
export WINEDEBUG="${WINEDEBUG:--all}"

# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()    { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33m!\033[0m %s\n' "$*" >&2; }
die()   { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

confirm() {
    local reply
    read -r -p "$1 [s/N] " reply
    case "$reply" in s|S|si|SI|sí|Sí|y|Y) return 0 ;; *) return 1 ;; esac
}

is_macos() { [ "$(uname -s)" = "Darwin" ]; }

# Busca un binario de Wine: $WINE, el PATH o las apps de /Applications.
find_wine() {
    if [ -n "${WINE:-}" ] && [ -x "$WINE" ]; then echo "$WINE"; return 0; fi
    local cand
    for cand in wine wine64; do
        if command -v "$cand" >/dev/null 2>&1; then command -v "$cand"; return 0; fi
    done
    local app
    for app in "Wine Stable" "Wine Devel" "Wine Staging" "Wine Crossover"; do
        for cand in wine wine64; do
            for base in /Applications "$HOME/Applications"; do
                local p="$base/$app.app/Contents/Resources/wine/bin/$cand"
                if [ -x "$p" ]; then echo "$p"; return 0; fi
            done
        done
    done
    return 1
}

require_wine() {
    WINE_BIN="$(find_wine)" || die "No encontré Wine. Ejecuta primero: $0 instalar-wine"
}

wine_run() { "$WINE_BIN" "$@"; }

wineserver_wait() {
    local ws
    ws="$(dirname "$WINE_BIN")/wineserver"
    if [ -x "$ws" ]; then "$ws" -w || true; fi
}

# Escribe una clave de registro en la vista de 32 bits (donde miran los juegos de 1997-2000).
reg_add() {
    local key="$1" name="$2" type="$3" data="$4"
    wine_run reg add "$key" /v "$name" /t "$type" /d "$data" /f /reg:32 >/dev/null 2>&1 \
        || wine_run reg add "$key" /v "$name" /t "$type" /d "$data" /f >/dev/null 2>&1 \
        || warn "No pude escribir $key\\$name"
}

# Convierte una ruta de Unix dentro de drive_c a ruta de Windows (C:\...).
to_win_path() {
    local rel="${1#"$PREFIX/drive_c"}"
    # shellcheck disable=SC1003
    printf 'C:%s' "$(printf '%s' "$rel" | tr '/' '\\')"
}

ensure_prefix() {
    require_wine
    if [ ! -f "$PREFIX/system.reg" ]; then
        info "Creando el entorno de Wine en: $PREFIX"
        mkdir -p "$PREFIX"
        wine_run wineboot -u >/dev/null 2>&1 || true
        wineserver_wait
        [ -f "$PREFIX/system.reg" ] || die "Wine no pudo crear el prefijo. Prueba ejecutar '$WINE_BIN wineboot' a mano para ver el error."
        ok "Entorno creado"
    fi
}

# ---------------------------------------------------------------------------
# Localizar los juegos instalados
# ---------------------------------------------------------------------------

# Devuelve el nombre del .exe para cada juego.
game_exe_name() {
    case "$1" in
        tc)  echo "age2_x1.exe" ;;
        aok) echo "empires2.exe" ;;
        ror) echo "empiresx.exe" ;;
        aoe) echo "empires.exe" ;;
        *)   return 1 ;;
    esac
}

game_title() {
    case "$1" in
        tc)  echo "Age of Empires II - The Conquerors" ;;
        aok) echo "Age of Empires II - The Age of Kings" ;;
        ror) echo "Age of Empires - The Rise of Rome" ;;
        aoe) echo "Age of Empires" ;;
    esac
}

find_game_exe() {
    local name
    name="$(game_exe_name "$1")" || return 1
    [ -d "$PREFIX/drive_c" ] || return 0
    # Si hay varias copias, la de ruta más corta (la instalación principal, no un backup).
    { find "$PREFIX/drive_c" -type f -iname "$name" \
        -not -ipath '*/windows/*' -not -ipath '*/users/*' 2>/dev/null || true; } \
        | awk 'NR == 1 || length($0) < length(best) { best = $0 } END { if (best != "") print best }'
}

# El juego espera arrancar desde la carpeta raíz de la instalación
# (The Conquerors vive en la subcarpeta age2_x1/).
game_root_for() {
    local dir
    dir="$(dirname "$1")"
    case "$(basename "$dir" | tr '[:upper:]' '[:lower:]')" in
        age2_x1) dirname "$dir" ;;
        *)       echo "$dir" ;;
    esac
}

default_game() {
    local g
    for g in tc aok ror aoe; do
        if [ -n "$(find_game_exe "$g")" ]; then echo "$g"; return 0; fi
    done
    return 1
}

# ---------------------------------------------------------------------------
# Registro: algunas versiones buscan aquí la ruta de instalación
# ---------------------------------------------------------------------------

register_games() {
    local exe root win
    exe="$(find_game_exe aok)"
    if [ -n "$exe" ]; then
        root="$(game_root_for "$exe")"; win="$(to_win_path "$root")"
        reg_add 'HKLM\Software\Microsoft\Microsoft Games\Age of Empires\2.0' "EXE Path" REG_SZ "$win"
        reg_add 'HKLM\Software\Microsoft\Microsoft Games\Age of Empires\2.0' "InstallationDirectory" REG_SZ "$win"
    fi
    exe="$(find_game_exe tc)"
    if [ -n "$exe" ]; then
        root="$(game_root_for "$exe")"; win="$(to_win_path "$root")"
        reg_add 'HKLM\Software\Microsoft\Microsoft Games\Age of Empires II: The Conquerors Expansion\1.0' "EXE Path" REG_SZ "$win"
        reg_add 'HKLM\Software\Microsoft\Microsoft Games\Age of Empires II: The Conquerors Expansion\1.0' "InstallationDirectory" REG_SZ "$win"
    fi
    exe="$(find_game_exe aoe)"; [ -n "$exe" ] || exe="$(find_game_exe ror)"
    if [ -n "$exe" ]; then
        win="$(to_win_path "$(dirname "$exe")")"
        reg_add 'HKLM\Software\Microsoft\Games\Age of Empires\1.00' "EXE Path" REG_SZ "$win"
        reg_add 'HKLM\Software\Microsoft\Games\Age of Empires\1.00' "InstallationDirectory" REG_SZ "$win"
    fi
}

# ---------------------------------------------------------------------------
# Comandos
# ---------------------------------------------------------------------------

cmd_instalar_wine() {
    is_macos || die "Este comando es solo para macOS."

    if [ "$(uname -m)" = "arm64" ]; then
        if ! /usr/bin/arch -x86_64 /usr/bin/true >/dev/null 2>&1; then
            info "Tu Mac es Apple Silicon: instalando Rosetta 2 (Wine para macOS es x86_64)…"
            softwareupdate --install-rosetta --agree-to-license || die "No se pudo instalar Rosetta 2."
        fi
        ok "Rosetta 2 disponible"
    fi

    if WINE_BIN="$(find_wine)"; then
        ok "Wine ya está instalado: $WINE_BIN"
        unquarantine_wine
        return 0
    fi

    if command -v brew >/dev/null 2>&1; then
        info "Intentando instalar Wine con Homebrew…"
        if brew install --cask wine-stable; then
            unquarantine_wine
            find_wine >/dev/null && { ok "Wine instalado"; return 0; }
        fi
        warn "Homebrew no pudo instalar 'wine-stable' (Homebrew lo deshabilitó en sept. 2026 por Gatekeeper)."
    else
        warn "No tienes Homebrew (https://brew.sh)."
    fi

    cat <<EOF

Instala Wine a mano (son los paquetes oficiales de WineHQ para macOS):

  1. Abre: $GCENX_RELEASES
  2. Descarga el .tar.xz de "wine-stable" (o "wine-devel") de la última versión.
  3. Haz doble clic para descomprimirlo y arrastra "Wine Stable.app" a /Applications.
  4. Vuelve a ejecutar:  $0 instalar-wine
     (quita la cuarentena de Gatekeeper para que macOS deje abrir Wine)

Alternativas: CrossOver (de pago) o Sikarugir/Kegworks. Si usas otro Wine, indica su
ruta con la variable WINE, por ejemplo:  WINE=/ruta/a/bin/wine $0 jugar
EOF
    exit 1
}

unquarantine_wine() {
    is_macos || return 0
    local app
    for app in /Applications/Wine*.app "$HOME"/Applications/Wine*.app; do
        [ -d "$app" ] || continue
        if xattr -p com.apple.quarantine "$app" >/dev/null 2>&1; then
            info "Quitando la cuarentena de Gatekeeper a $(basename "$app")"
            xattr -dr com.apple.quarantine "$app" 2>/dev/null \
                || sudo xattr -dr com.apple.quarantine "$app" \
                || warn "No pude quitar la cuarentena; ábrelo una vez con clic derecho → Abrir."
        fi
    done
}

cmd_preparar() {
    ensure_prefix
    ok "Listo. Ahora instala el juego:  $0 instalar <iso|carpeta-del-cd|carpeta-del-juego>"
}

# Instala desde un CD/ISO o copia una carpeta ya instalada.
cmd_instalar() {
    local src="${1:-}"
    [ -n "$src" ] || die "Uso: $0 instalar <archivo.iso | carpeta del CD | carpeta del juego ya instalado>"
    [ -e "$src" ] || die "No existe: $src"
    ensure_prefix

    local mounted=""
    if [ -f "$src" ]; then
        case "$(printf '%s' "$src" | tr '[:upper:]' '[:lower:]')" in
            *.iso|*.cdr|*.dmg|*.img) ;;
            *.bin|*.cue|*.nrg|*.mdf) die "Formato no soportado por macOS. Convierte la imagen a .iso primero (p. ej. con 'bchunk' para .bin/.cue)." ;;
            *) die "No sé qué hacer con el archivo: $src" ;;
        esac
        is_macos || die "Montar imágenes .iso solo está soportado en macOS."
        mounted="$(mktemp -d "${TMPDIR:-/tmp}/aoe-cd.XXXXXX")"
        info "Montando la imagen $src"
        hdiutil attach -readonly -nobrowse -mountpoint "$mounted" "$src" >/dev/null \
            || die "No se pudo montar la imagen."
        src="$mounted"
    fi

    local setup
    setup="$(cd_installer "$src")"
    if [ -n "$setup" ]; then
        install_from_cd "$src" "$setup"
    else
        install_from_folder "$src"
    fi

    if [ -n "$mounted" ]; then
        wineserver_wait
        rm -f "$PREFIX/dosdevices/$CD_DRIVE"
        hdiutil detach "$mounted" >/dev/null 2>&1 || warn "No pude desmontar $mounted; expúlsalo desde el Finder."
        rmdir "$mounted" 2>/dev/null || true
    fi

    register_games
    show_status
    cat <<EOF

Siguiente paso recomendado:
  • Si tienes un segundo disco (p. ej. The Conquerors), instálalo igual:  $0 instalar <disco2>
  • Aplica UserPatch 1.5 (quita la exigencia del CD y arregla muchos fallos):
        $0 parche ~/Downloads/UserPatch*.exe
  • Instala el arreglo de gráficos (recomendado en Mac):  $0 graficos
  • Juega:  $0 jugar
EOF
}

# Si la carpeta parece un CD de instalación, imprime el nombre de su instalador.
# Una carpeta con el juego ya instalado no tiene setup.exe ni autorun.inf.
cd_installer() {
    local dir="$1" exe auto
    exe="$(find "$dir" -maxdepth 1 -iname 'setup.exe' 2>/dev/null | awk 'NR==1')"
    if [ -z "$exe" ]; then
        auto="$(find "$dir" -maxdepth 1 -iname 'autorun.inf' 2>/dev/null | awk 'NR==1')"
        if [ -n "$auto" ]; then
            exe="$(tr -d '\r' < "$auto" | awk -F= 'tolower($1) == "open" { split($2, a, " "); print a[1]; exit }')"
        fi
    fi
    # shellcheck disable=SC1003
    [ -n "$exe" ] && basename "$(printf '%s' "$exe" | tr '\\' '/')"
    return 0
}

install_from_cd() {
    local cd="$1" setup="$2"
    info "Asignando el CD a la unidad ${CD_DRIVE} de Wine"
    mkdir -p "$PREFIX/dosdevices"
    ln -sfn "$cd" "$PREFIX/dosdevices/$CD_DRIVE"
    wine_run reg add 'HKLM\Software\Wine\Drives' /v "$CD_DRIVE" /t REG_SZ /d cdrom /f >/dev/null 2>&1 || true

    info "Abriendo el instalador original. Sigue los pasos (instalación \"Típica\" está bien)."
    warn "Si el instalador te ofrece instalar DirectX o reiniciar, puedes decir que no."
    (cd "$cd" && wine_run "${CD_DRIVE}\\$setup") || warn "El instalador terminó con error (a veces es normal al final)."
    wineserver_wait
    ok "Instalador terminado"
}

install_from_folder() {
    local src="$1" name dest
    name="$(basename "$src")"
    dest="$PREFIX/drive_c/Games/$name"
    [ -n "$(find "$src" -maxdepth 3 \( -iname 'empires2.exe' -o -iname 'age2_x1.exe' -o -iname 'empires.exe' -o -iname 'empiresx.exe' \) 2>/dev/null | awk 'NR==1')" ] \
        || die "En $src no hay setup.exe ni ejecutables del juego (empires2.exe, age2_x1.exe, empires.exe…)."
    if [ -e "$dest" ]; then
        confirm "Ya existe $dest. ¿Reemplazarlo?" || die "Cancelado."
        rm -rf "$dest"
    fi
    info "Copiando el juego a $dest"
    mkdir -p "$(dirname "$dest")"
    cp -R "$src" "$dest"
    chmod -R u+w "$dest"
    ok "Juego copiado"
}

# Ejecuta un instalador/parche (.exe) dentro del entorno: UserPatch, parche 1.0c, etc.
cmd_parche() {
    local exe="${1:-}"
    [ -n "$exe" ] && [ -f "$exe" ] || die "Uso: $0 parche <archivo.exe>   (p. ej. UserPatch o el parche oficial 1.0c)"
    ensure_prefix
    local game root
    game="$(default_game)" || warn "Aún no encuentro el juego instalado; el parche podría pedirte la carpeta."
    if [ -n "${game:-}" ]; then
        root="$(game_root_for "$(find_game_exe "$game")")"
        info "El juego está en: $(to_win_path "$root")"
        info "Copio el parche ahí y lo ejecuto (UserPatch debe correr desde la carpeta del juego)."
        cp "$exe" "$root/"
        (cd "$root" && wine_run "$(basename "$exe")") || warn "El parche terminó con error."
    else
        (cd "$(dirname "$exe")" && wine_run "$(basename "$exe")") || warn "El parche terminó con error."
    fi
    wineserver_wait
    register_games
    ok "Parche ejecutado"
}

# Pone un valor key=value dentro de la sección [ddraw] de un ddraw.ini (respeta CRLF).
ini_set() {
    local file="$1" key="$2" value="$3" tmp
    tmp="$(mktemp)"
    awk -v key="$key" -v value="$value" '
        { line = $0; sub(/\r$/, "", line) }
        line ~ /^\[/ { in_ddraw = (line == "[ddraw]") }
        in_ddraw && index(line, key "=") == 1 { print key "=" value "\r"; done = 1; next }
        { print }
    ' "$file" > "$tmp"
    cat "$tmp" > "$file"
    rm -f "$tmp"
}

# Instala cnc-ddraw: reemplazo de DirectDraw que escala el juego a la pantalla del Mac
# (Retina incluida) sin cambiar la resolución, y arregla colores y parpadeos.
cmd_graficos() {
    local mode="${1:-pantalla}"
    case "$mode" in
        pantalla|ventana) ;;
        quitar) remove_ddraw; return 0 ;;
        *) die "Uso: $0 graficos [pantalla|ventana|quitar]" ;;
    esac
    ensure_prefix
    mkdir -p "$CACHE_DIR"
    local zip="$CACHE_DIR/cnc-ddraw.zip" unpacked="$CACHE_DIR/cnc-ddraw"
    if [ ! -f "$zip" ]; then
        info "Descargando cnc-ddraw…"
        curl -fL --progress-bar -o "$zip.part" "$CNC_DDRAW_URL" || die "No se pudo descargar $CNC_DDRAW_URL"
        mv "$zip.part" "$zip"
    fi
    rm -rf "$unpacked"; mkdir -p "$unpacked"
    unzip -q -o "$zip" -d "$unpacked" || die "El zip de cnc-ddraw está dañado; borra $zip y reintenta."

    local g exe dir found=0
    for g in tc aok ror aoe; do
        exe="$(find_game_exe "$g")"
        [ -n "$exe" ] || continue
        dir="$(dirname "$exe")"
        found=1
        if [ ! -f "$dir/ddraw.ini" ] || ! grep -q 'cnc-ddraw' "$dir/ddraw.ini"; then
            cp "$unpacked/ddraw.dll" "$unpacked/ddraw.ini" "$dir/"
            rm -rf "$dir/Shaders"; cp -R "$unpacked/Shaders" "$dir/"
        fi
        ini_set "$dir/ddraw.ini" renderer opengl
        ini_set "$dir/ddraw.ini" maintas true
        if [ "$mode" = "ventana" ]; then
            ini_set "$dir/ddraw.ini" fullscreen false
            ini_set "$dir/ddraw.ini" windowed true
        else
            # Ventana sin bordes a pantalla completa: evita cambios de resolución en macOS.
            ini_set "$dir/ddraw.ini" fullscreen true
            ini_set "$dir/ddraw.ini" windowed true
        fi
        ok "cnc-ddraw ($mode) en: $(game_title "$g")"
    done
    [ "$found" = 1 ] || die "No encontré ningún juego instalado. Usa primero: $0 instalar …"

    wine_run reg add 'HKCU\Software\Wine\DllOverrides' /v ddraw /t REG_SZ /d native,builtin /f >/dev/null 2>&1 \
        || warn "No pude configurar el override de ddraw.dll"
    ok "Gráficos configurados. Ajustes finos: edita ddraw.ini junto al .exe del juego."
}

remove_ddraw() {
    require_wine
    local g exe dir
    for g in tc aok ror aoe; do
        exe="$(find_game_exe "$g")"; [ -n "$exe" ] || continue
        dir="$(dirname "$exe")"
        if [ -f "$dir/ddraw.ini" ] && grep -q 'cnc-ddraw' "$dir/ddraw.ini"; then
            rm -rf "$dir/ddraw.dll" "$dir/ddraw.ini" "$dir/Shaders"
            ok "cnc-ddraw quitado de: $(game_title "$g")"
        fi
    done
    wine_run reg delete 'HKCU\Software\Wine\DllOverrides' /v ddraw /f >/dev/null 2>&1 || true
}

cmd_jugar() {
    require_wine
    [ -f "$PREFIX/system.reg" ] || die "Aún no has preparado nada. Empieza con: $0 preparar"
    local game="${1:-}"
    [ $# -gt 0 ] && shift
    if [ -z "$game" ]; then
        game="$(default_game)" || die "No encontré ningún juego instalado. Usa: $0 instalar …"
    fi
    game_exe_name "$game" >/dev/null || die "Juego desconocido '$game'. Usa: tc, aok, ror o aoe."
    local exe root
    exe="$(find_game_exe "$game")"
    [ -n "$exe" ] || die "$(game_title "$game") no está instalado."
    root="$(game_root_for "$exe")"
    info "Iniciando $(game_title "$game")"
    cd "$root"
    exec "$WINE_BIN" "$(to_win_path "$exe")" "$@"
}

# Crea una app en ~/Applications para abrir el juego desde el Launchpad/Dock.
cmd_crear_app() {
    is_macos || die "Este comando es solo para macOS."
    require_wine
    local game="${1:-}"
    [ -n "$game" ] || game="$(default_game)" || die "No encontré ningún juego instalado."
    game_exe_name "$game" >/dev/null || die "Juego desconocido '$game'. Usa: tc, aok, ror o aoe."
    [ -n "$(find_game_exe "$game")" ] || die "$(game_title "$game") no está instalado."

    local title app
    title="$(game_title "$game")"
    app="$HOME/Applications/$title.app"
    mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources"
    cp "$0" "$app/Contents/Resources/aoe.sh"
    chmod +x "$app/Contents/Resources/aoe.sh"

    cat > "$app/Contents/MacOS/launcher" <<EOF
#!/bin/bash
# Lanzador generado por aoe.sh
export PATH="/opt/homebrew/bin:/usr/local/bin:\$PATH"
export AOE_DATA_DIR="$DATA_DIR"
export WINEPREFIX="$PREFIX"
export WINE="$WINE_BIN"
LOG="$DATA_DIR/ultimo-arranque.log"
"\$(dirname "\$0")/../Resources/aoe.sh" jugar $game >"\$LOG" 2>&1 || {
    osascript -e 'display alert "No se pudo iniciar $title" message "Revisa el registro en: '"\$LOG"'"'
}
EOF
    chmod +x "$app/Contents/MacOS/launcher"

    cat > "$app/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key><string>$title</string>
    <key>CFBundleDisplayName</key><string>$title</string>
    <key>CFBundleIdentifier</key><string>local.aoe-clasico.$game</string>
    <key>CFBundleVersion</key><string>1.0</string>
    <key>CFBundlePackageType</key><string>APPL</string>
    <key>CFBundleExecutable</key><string>launcher</string>
    <key>CFBundleIconFile</key><string>icon</string>
    <key>LSMinimumSystemVersion</key><string>10.15</string>
    <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
EOF

    if [ -n "${2:-}" ] && [ -f "$2" ]; then
        make_icon "$2" "$app/Contents/Resources/icon.icns" || warn "No pude convertir el icono."
    fi
    touch "$app"
    ok "App creada: $app"
    echo "  Ábrela desde Finder → Aplicaciones (de tu usuario) o arrástrala al Dock."
    echo "  Para ponerle icono:  $0 crear-app $game /ruta/a/imagen.png"
}

make_icon() {
    local src="$1" out="$2" set
    set="$(mktemp -d)/icon.iconset"
    mkdir -p "$set"
    local s
    for s in 16 32 128 256 512; do
        sips -z "$s" "$s" "$src" --out "$set/icon_${s}x${s}.png" >/dev/null
        sips -z $((s * 2)) $((s * 2)) "$src" --out "$set/icon_${s}x${s}@2x.png" >/dev/null
    done
    iconutil -c icns "$set" -o "$out"
    rm -rf "$(dirname "$set")"
}

cmd_config() { ensure_prefix; wine_run winecfg; }

cmd_carpeta() {
    local exe game
    game="$(default_game)" || { open_or_echo "$PREFIX/drive_c"; return; }
    exe="$(find_game_exe "$game")"
    open_or_echo "$(game_root_for "$exe")"
}

open_or_echo() { if is_macos; then open "$1"; else echo "$1"; fi; }

show_status() {
    echo
    echo "Estado de $APP_NAME"
    echo "  Wine:    $(find_wine 2>/dev/null || echo 'no instalado')"
    echo "  Entorno: $PREFIX $([ -f "$PREFIX/system.reg" ] && echo '(creado)' || echo '(sin crear)')"
    local g exe dir extra
    for g in tc aok ror aoe; do
        exe="$(find_game_exe "$g" 2>/dev/null || true)"
        if [ -n "$exe" ]; then
            dir="$(dirname "$exe")"; extra=""
            [ -f "$dir/ddraw.ini" ] && grep -q cnc-ddraw "$dir/ddraw.ini" && extra=" [cnc-ddraw]"
            printf '  %-4s ✓ %s%s\n' "$g" "$(game_title "$g")" "$extra"
        else
            printf '  %-4s · %s (no instalado)\n' "$g" "$(game_title "$g")"
        fi
    done
}

cmd_estado() { show_status; }

cmd_desinstalar() {
    [ -d "$DATA_DIR" ] || { ok "No hay nada que borrar."; return; }
    warn "Esto borrará el entorno de Wine con los juegos instalados y TUS PARTIDAS GUARDADAS:"
    echo "  $DATA_DIR"
    confirm "¿Seguro?" || die "Cancelado."
    if WINE_BIN="$(find_wine)"; then
        local ws; ws="$(dirname "$WINE_BIN")/wineserver"
        [ -x "$ws" ] && "$ws" -k 2>/dev/null || true
    fi
    rm -rf "$DATA_DIR"
    ok "Borrado. (Las apps en ~/Applications puedes tirarlas a la papelera.)"
}

usage() {
    cat <<EOF
$APP_NAME — Age of Empires clásico (CD de Microsoft) en macOS con Wine

Uso: $0 <comando> [opciones]

Primeros pasos (en orden):
  instalar-wine                 Instala Rosetta 2 (Apple Silicon) y Wine si faltan
  preparar                      Crea el entorno de Wine para los juegos
  instalar <origen>             Instala el juego. <origen> puede ser:
                                  • una imagen .iso / .cdr / .dmg del CD
                                  • la carpeta del CD montado (con setup.exe)
                                  • una carpeta con el juego ya instalado (copiada de un PC)
  parche <archivo.exe>          Ejecuta un parche en la carpeta del juego (UserPatch, 1.0c…)
  graficos [pantalla|ventana]   Instala cnc-ddraw (recomendado). 'quitar' lo desinstala
  jugar [tc|aok|ror|aoe]        Abre el juego (por defecto el más nuevo instalado)
  crear-app [juego] [icono.png] Crea una app en ~/Applications para abrirlo con doble clic

Otros:
  estado        Muestra qué está instalado
  carpeta       Abre la carpeta del juego en el Finder (para mods, escenarios, partidas)
  config        Abre winecfg
  desinstalar   Borra todo (entorno, juegos y partidas guardadas)

Juegos:  tc  = AoE II: The Conquerors     aok = AoE II: The Age of Kings
         ror = AoE: The Rise of Rome      aoe = Age of Empires

Variables: WINE=/ruta/a/wine   AOE_DATA_DIR=/otra/carpeta
EOF
}

main() {
    local cmd="${1:-ayuda}"
    [ $# -gt 0 ] && shift
    case "$cmd" in
        instalar-wine)          cmd_instalar_wine "$@" ;;
        preparar|setup)         cmd_preparar "$@" ;;
        instalar|install)       cmd_instalar "$@" ;;
        parche|patch)           cmd_parche "$@" ;;
        graficos|gráficos)      cmd_graficos "$@" ;;
        jugar|play)             cmd_jugar "$@" ;;
        crear-app)              cmd_crear_app "$@" ;;
        estado|status)          cmd_estado "$@" ;;
        carpeta)                cmd_carpeta "$@" ;;
        config)                 cmd_config "$@" ;;
        desinstalar)            cmd_desinstalar "$@" ;;
        ayuda|help|-h|--help)   usage ;;
        *) usage; exit 1 ;;
    esac
}

main "$@"
