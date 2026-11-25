# Backend en Google Sheets (v2)

Las páginas **aterrizar.html**, **empatia.html** y **riesgo.html** guardan todo en un
Google Sheet a través de una app web de Apps Script. **insights.html** lee esas mismas
bases para armar la presentación de insights y el borrador de requerimientos.

> **Este machote nace sin backend a propósito.** `sync.js` trae `HARDCODED_ENDPOINT = ""`
> y `DEFAULT_ROOM = "proyecto-demo"`. Para cada proyecto nuevo creas **tu propio** Sheet y
> pegas su URL `/exec` (sección *Instalación desde cero*, abajo). No reutilices el endpoint
> de otro proyecto o escribirás sobre sus datos. Mientras no haya endpoint, las páginas
> trabajan en local (localStorage) en cada dispositivo.

Una vez que pegues tu URL `/exec` en `sync.js`, todo tu equipo queda conectado
automáticamente. Todos deben usar el mismo nombre de equipo (el `DEFAULT_ROOM` que elijas).

## Cómo está organizada la hoja

| Pestaña | Qué contiene | Una fila es… |
|---|---|---|
| **0 · LEEME** | Cómo leer la hoja y diccionario de claves | — |
| **1 · Aterrizar** | Canvas, “¿Cómo podríamos…?”, autorrevisión, matriz de elección e ideación | un recuadro, una pregunta o una idea |
| **2 · Empatía** | POV y notas del mapa de empatía, ordenadas por votos | una nota |
| **3 · Riesgo · Cédulas** | Cédula 1 (peligros) + su lugar en la matriz, cédula 2 (prioridades y control) y cédula 4 (lienzo T·U·C·E·I) | un peligro, una prioridad o una caja |
| **4 · Riesgo · Eventos** | Eventos del panel con escalera, C·E·P, GP, GR, matriz y control | un evento |
| **5 · Riesgo · Autorreportes** | Cédula 3 con suma, línea base previa y señal | un autorreporte |
| **6 · Insumos requerimientos** | Materia prima de cada sección de la hoja de requerimientos, con su fuente | un insumo |
| **Datos** | Almacén crudo que usan las páginas | un campo, una nota o un registro |

- Las pestañas **0 a 6 se reconstruyen solas**: cada vez que alguien escribe (máximo cada
  20 s), al abrir la hoja, desde el menú **ORBITAL › Actualizar pestañas legibles** y cada
  vez que se abre **insights.html**.
- **No editen las pestañas 0 a 6 a mano** (se sobrescriben). Editen desde las páginas.
- **No borren ni renombren “Datos”.**

## Instalación desde cero (el camino normal para un proyecto nuevo)

1. Crea un Google Sheet nuevo → **Extensiones → Apps Script** → pega el contenido de
   `Code.gs` (esta carpeta) → guarda (💾).
2. **Implementar → Nueva implementación** → tipo **Aplicación web**, ejecutar como **Yo**,
   acceso **Cualquier persona** → **Implementar** → autoriza (es tu propio script).
3. Copia la URL que termina en `/exec` y pégala en `HARDCODED_ENDPOINT` de `sync.js`.
   Cambia también `DEFAULT_ROOM` por el nombre de tu equipo/proyecto.
4. Comprueba: abre la URL `/exec?op=ping`; debe responder `"version":2`.
5. Abre `insights.html`: en la diapositiva “La base” debe decir **Backend v2**, y en el
   Sheet aparecerán las pestañas 0 a 6.

## Actualizar el código del script (cuando cambie `Code.gs`)

1. Abre tu Sheet → **Extensiones → Apps Script**.
2. Reemplaza todo el código por el nuevo `Code.gs` y guarda (💾).
3. **Implementar → Administrar implementaciones → ✎ (editar)** → **Versión: Nueva versión**
   → **Implementar**. La URL `/exec` no cambia.

## Privacidad

Cualquiera con la URL `/exec` puede escribir en la hoja, y la URL está en el repositorio
público. Es suficiente para el hackathon, pero **no pongan datos personales sensibles**.
