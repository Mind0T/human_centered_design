# Conectar el backend en 5 minutos

Guía rápida para dejar el HCD Kit **funcional en vivo** (talleres, práctica, demos).
Esto hay que hacerlo desde tu navegador con tu cuenta de Google — es tu Sheet y tu script.
Para la referencia completa, ver [`backend-setup.md`](backend-setup.md).

## Paso a paso

1. **Crea el Google Sheet.** Entra a [sheets.new](https://sheets.new). No necesitas crear
   pestañas ni encabezados: el script arma todo solo la primera vez.

2. **Abre el editor de scripts.** En el Sheet: menú **Extensiones → Apps Script**.

3. **Pega el código.** Borra lo que venga por defecto (`function myFunction() {}`) y pega
   **todo** el contenido de [`Code.gs`](Code.gs) (ábrelo aquí en GitHub y copia el raw).
   Guarda con el disquete 💾.

4. **Publica como app web.**
   - Arriba a la derecha: **Implementar → Nueva implementación**.
   - Engranaje ⚙️ junto a "Seleccionar tipo" → **Aplicación web**.
   - **Ejecutar como:** Yo (tu cuenta).
   - **Quién tiene acceso:** **Cualquier persona**.  ← importante, si no las páginas no pueden escribir.
   - **Implementar** → Google te pedirá autorizar (es tu propio script, acéptalo; si avisa
     "no verificada", entra en *Configuración avanzada → Ir a (nombre) (no seguro)*).
   - Copia la **URL de la app web**, la que **termina en `/exec`**.

5. **Comprueba que responde.** Pega esa URL en el navegador con `?op=ping` al final:
   `https://script.google.com/macros/s/.../exec?op=ping`
   Debe responder algo como `{"ok":true,"pong":true,"version":2}`.

6. **Pégala en el kit.** Abre [`sync.js`](../sync.js) y, en la parte de arriba, pon tu URL:
   ```js
   var HARDCODED_ENDPOINT = "https://script.google.com/macros/s/.../exec";
   var DEFAULT_ROOM = "proyecto-demo";   // o el nombre de tu equipo/proyecto
   ```
   > Si cambias `DEFAULT_ROOM`, cámbialo **también** en `backend/Code.gs` (variable
   > `DEFAULT_ROOM`) para que las pestañas legibles se armen con ese mismo equipo.

7. **Haz commit y redespliega** (Vercel toma el cambio solo al hacer push a `main`).

¡Listo! Abre `empatia.html`, pon tu nombre en **⚙️ Conectar**, agrega una nota: debe
aparecer una fila en la pestaña **Datos** del Sheet y, a los segundos, en las pestañas
legibles (0 a 6).

## Para talleres / práctica

- **Equipo (room):** todos los que quieras que compartan datos deben usar el **mismo**
  nombre de equipo en la barra de conexión. El valor por defecto (`DEFAULT_ROOM`) ya los
  junta sin que hagan nada.
- **Columnas por persona:** en `Code.gs`, la lista `ROSTER` define quién tiene columna
  propia en las pestañas legibles. Ajústala a tu grupo (ojo con el *slug*: las páginas
  quitan acentos y espacios del nombre). Quien no esté en `ROSTER` igual guarda datos, solo
  que sin columna propia.
- **Empezar limpio otra vez:** borra las filas de la pestaña **Datos** (menos la primera,
  la de encabezados) y las vistas se vacían solas. O cambia el nombre de equipo para
  arrancar un "cuarto" nuevo sin tocar lo anterior.
- **Privacidad:** cualquiera con la URL `/exec` puede escribir en tu hoja, y esa URL queda
  en el repo si es público. Suficiente para talleres; no metas datos personales sensibles.
  Si quieres cerrar un taller, en Apps Script puedes **archivar la implementación** o
  cambiar el acceso.
