# Baches SCZ — Backend / API REST

API REST del Sistema Web de Reporte, Geolocalización y Gestión de Baches del
Departamento de Santa Cruz, Bolivia. Implementa autenticación con roles,
CRUD de reportes con geolocalización, y el módulo de grafos (BFS, DFS,
Dijkstra, A* y una heurística de tipo TSP para rutas multi-bache).

## Estructura

```
backend/
├── db/schema.sql              # DDL PostgreSQL + PostGIS (tablas, índices, seed)
├── src/
│   ├── server.js              # Punto de entrada Express
│   ├── config/db.js           # Pool de conexión a PostgreSQL
│   ├── middleware/            # auth (JWT/RBAC), validate (Zod), upload (multer), rateLimiter
│   ├── schemas/                # Esquemas de validación Zod
│   ├── controllers/           # authController, reportesController, grafoController
│   ├── routes/                # authRoutes, reportesRoutes, grafoRoutes
│   └── services/
│       ├── graphBuilder.js    # Construye el grafo (nodos + aristas con peso Haversine)
│       ├── traversal.js       # BFS y DFS
│       ├── shortestPath.js    # Dijkstra y A*
│       └── routeHeuristic.js  # Heurística TSP: vecino más cercano + 2-opt
└── .env.example
```

## Puesta en marcha

Este servidor sirve **tanto la API como el frontend** (carpeta `../frontend`)
desde el mismo puerto — no hace falta un segundo servidor ni configurar CORS.

```bash
npm install
cp .env.example .env          # completar credenciales de PostgreSQL y JWT_SECRET
psql -U postgres -d baches_scz -f db/schema.sql
mkdir uploads
npm start                     # o: npm run dev (con recarga automática)
```

Abre **http://localhost:4000** — te lleva a la landing page. Para tener un
usuario administrador, regístrate normalmente desde la web y luego ejecuta:

```bash
npm run crear-admin -- tu-correo@ejemplo.com
```

Requiere PostgreSQL con la extensión PostGIS habilitada.

## Probar el módulo de algoritmos sin base de datos

Los servicios en `src/services/` son funciones puras que no dependen de la
base de datos, por lo que se pueden probar de forma aislada:

```js
const { construirGrafo } = require("./src/services/graphBuilder");
const { bfs } = require("./src/services/traversal");

const reportes = [{ id: 1, latitud: -17.7739, longitud: -63.1822 }, /* ... */];
const { adyacencia } = construirGrafo(reportes);
console.log(bfs(adyacencia, 1));
```

## Pruebas automatizadas

El proyecto incluye 25 pruebas unitarias (`node:test`, sin dependencias
externas) que cubren todo el módulo de algoritmos: `test/haversine.test.js`,
`test/graphBuilder.test.js`, `test/traversal.test.js` (BFS/DFS),
`test/shortestPath.test.js` (Dijkstra/A*) y `test/routeHeuristic.test.js`
(heurística TSP: Vecino más Cercano + 2-opt).

```bash
npm test
# 25 pruebas, 25 pasan
```

Estas pruebas no requieren PostgreSQL: validan directamente la lógica de
`src/services/`, por lo que corren en cualquier máquina con Node.js
instalado y son el respaldo del Capítulo VI (Pruebas) del informe.

## Endpoints principales

| Método | Endpoint | Rol requerido |
|---|---|---|
| POST | /api/register | público |
| POST | /api/login | público |
| GET | /api/reportes | público |
| GET | /api/reportes/:id | público |
| POST | /api/reportes | autenticado (multipart: campo `foto`) |
| PUT | /api/reportes/:id | administrador |
| DELETE | /api/reportes/:id | administrador |
| GET | /api/reportes/mapa | público (GeoJSON) |
| GET | /api/reportes/zona | público |
| GET | /api/reportes/mios | autenticado (reportes propios del usuario logueado) |
| GET | /api/reportes/estadisticas | administrador |
| GET | /api/usuarios | administrador |
| PUT | /api/usuarios/:id | administrador (cambiar rol o suspender/activar) |
| POST | /api/grafo/bfs | administrador |
| POST | /api/grafo/dfs | administrador |
| POST | /api/grafo/ruta-optima | administrador |

## Seguridad implementada

- Contraseñas con `bcrypt` (12 rounds).
- Autenticación JWT + autorización por roles (RBAC) vía middleware.
- Validación de entrada con Zod en cada endpoint de escritura.
- Rate limiting en `/api/login` y `/api/register`.
- Cabeceras de seguridad con `helmet`.
- Validación de tipo MIME y tamaño máximo de fotografías (multer).
- Restricción de coordenadas al bounding box de Santa Cruz, Bolivia.
- Consultas parametrizadas (`pg`) en toda la capa de datos — sin concatenación de SQL.
