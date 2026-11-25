# Human-Centered Design Kit

Plataforma reutilizable de **diseño centrado en el humano**: un centro de apoyo para generar soluciones de forma más eficaz y, a la vez, aprender diseño centrado en el humano, diseño centrado en el usuario, diseño de experiencias, de interfaces y *design thinking*.

Cada herramienta es una presentación que **explica el método** y, a la vez, te deja **capturar datos reales** con tu equipo (sincronizados a Google Sheets). Es un **machote**: lo clonas para cada proyecto nuevo —personal, escolar, hackatón o emprendimiento— y lo rellenas con tu contenido.

> Derivado de la herramienta creada para la propuesta **ORBITAL** (reto *Health Monitoring Software for Astronauts*, NASA Space Apps Challenge CDMX 2026). Ese contenido se conserva **como ejemplo de un reto real**.

## Estructura

**`index.html`** — Portada. Describe la metodología HCD (HCD → UCD → UX/UI → design thinking) y organiza las herramientas en dos categorías.

### Categoría 1 · Herramientas y enseñanza
| Página | Tipo | Qué hace |
|---|---|---|
| `empatia.html` | Colaborativa | Mapa de empatía en 6 zonas → deriva una necesidad. Captura y votación en equipo. |
| `aterrizar.html` | Colaborativa | Taller para convertir un reto amplio en un problema potente y una idea. |
| `riesgo.html` | Colaborativa | Escalera del riesgo, grado de peligrosidad/riesgo, jerarquía de controles y cédulas. |
| `manual-pitch.html` | Informativa | Guía de cómo armar un pitch ganador. Solo consulta. |
| `investigacion.html` | Informativa · *ejemplo* | Cómo documentar la investigación de un reto (ejemplo NASA). |
| `reto.html` | Informativa · *ejemplo* | Cómo analizar los objetivos de un reto (ejemplo NASA). |

### Categoría 2 · Descripción del proyecto y resultados
| Página | Qué hace |
|---|---|
| `proyecto.html` | Plantilla de descripción del proyecto + botones a los resultados. |
| `insights.html` | Presentación de hallazgos; retoma lo capturado en las herramientas colaborativas. |
| `pitch-jurado.html` | Pitch final a pantalla completa para jurado, stakeholders o inversionistas. |

Las tres herramientas colaborativas (`empatia`, `aterrizar`, `riesgo`) escriben a un Google Sheet mediante `sync.js` + Apps Script (`backend/Code.gs`); `insights.html` lee esas mismas bases.

## Cómo usar este machote para un proyecto nuevo

1. **Clona** este repositorio con el nombre de tu proyecto.
2. **Conecta tu propio Sheet** (paso único, ~5 min): sigue la guía rápida [`backend/CONECTAR.md`](backend/CONECTAR.md) (o la referencia completa en [`backend/backend-setup.md`](backend/backend-setup.md)). Creas tu Google Sheet + Apps Script y pegas su URL `/exec` en `sync.js` (`HARDCODED_ENDPOINT`); cambia también `DEFAULT_ROOM` por el nombre de tu equipo (en `sync.js` **y** en `backend/Code.gs`). **No reutilices el endpoint de otro proyecto** o escribirás sobre sus datos. Sin conectar nada, las páginas funcionan en local (localStorage).
3. **Rellena** `proyecto.html` sustituyendo los marcadores `[ así ]` y los textos en cursiva por tu contenido. Haz lo mismo con la marca editable en `index.html`.
4. **Agrega herramientas**: el index tiene una tarjeta "Más herramientas" para ir sumando lo que aprendas (journey map, card sorting, pruebas de usabilidad, etc.).

## Identidad visual
Navy profundo, azul rey y acento lima-amarillo; anillos concéntricos tipo radar; tipografía Archivo + Overpass. La marca del index es un **placeholder editable** (`[ Marca del proyecto · editable ]`): cámbiala por la de cada proyecto.

## Autor
**Irving Soriano** — Licenciatura en Ciencia de Datos, ESCOM-IPN.
- GitHub: [Mind0T](https://github.com/Mind0T)
- LinkedIn: [Irving Soriano](https://www.linkedin.com/in/irving-soriano)
