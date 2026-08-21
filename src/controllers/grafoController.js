const pool = require("../config/db");
const { construirGrafo } = require("../services/graphBuilder");
const { bfs, dfs } = require("../services/traversal");
const { dijkstra, aEstrella, reconstruirRuta } = require("../services/shortestPath");
const { rutaAproximada } = require("../services/routeHeuristic");

// Obtiene los reportes solicitados y arma { nodos, adyacencia, coordenadas }
async function obtenerGrafoDeReportes(reporteIds) {
  const { rows } = await pool.query(
    `SELECT id, latitud, longitud FROM reportes WHERE id = ANY($1::int[])`,
    [reporteIds]
  );
  if (rows.length !== reporteIds.length) {
    throw new Error("Uno o más reportes indicados no existen.");
  }
  const { nodos, adyacencia } = construirGrafo(rows.map((r) => ({ id: r.id, latitud: r.latitud, longitud: r.longitud })));
  const coordenadas = {};
  rows.forEach((r) => (coordenadas[r.id] = { lat: r.latitud, lng: r.longitud }));
  return { nodos, adyacencia, coordenadas };
}

async function registrarEjecucion({ adminId, zonaId = null, tipo, nodosEntrada, resultado }) {
  await pool.query(
    `INSERT INTO ejecuciones_algoritmo (admin_id, zona_id, tipo_algoritmo, nodos_entrada, resultado)
     VALUES ($1,$2,$3,$4,$5)`,
    [adminId, zonaId, tipo, JSON.stringify(nodosEntrada), JSON.stringify(resultado)]
  );
}

// POST /api/grafo/bfs
async function ejecutarBFS(req, res) {
  const { reporteIds, nodoInicial } = req.validated;
  try {
    const { adyacencia } = await obtenerGrafoDeReportes(reporteIds);
    const resultado = bfs(adyacencia, nodoInicial);
    await registrarEjecucion({ adminId: req.user.id, tipo: "BFS", nodosEntrada: reporteIds, resultado });
    res.json({ algoritmo: "BFS", ...resultado });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// POST /api/grafo/dfs
async function ejecutarDFS(req, res) {
  const { reporteIds, nodoInicial } = req.validated;
  try {
    const { adyacencia } = await obtenerGrafoDeReportes(reporteIds);
    const resultado = dfs(adyacencia, nodoInicial);
    await registrarEjecucion({ adminId: req.user.id, tipo: "DFS", nodosEntrada: reporteIds, resultado });
    res.json({ algoritmo: "DFS", ...resultado });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// POST /api/grafo/ruta-optima
// - Si se envía nodoDestino: ruta de costo mínimo (Dijkstra) entre origen y destino.
// - Si NO se envía nodoDestino y hay más de 2 nodos: ruta aproximada tipo TSP
//   (heurística vecino más cercano + 2-opt) que pasa por todos los reportes seleccionados.
async function ejecutarRutaOptima(req, res) {
  const { reporteIds, nodoOrigen, nodoDestino } = req.validated;
  try {
    const { adyacencia, coordenadas } = await obtenerGrafoDeReportes(reporteIds);
    let resultado;
    let algoritmo;

    if (nodoDestino) {
      const { dist, previo } = dijkstra(adyacencia, nodoOrigen);
      resultado = reconstruirRuta(previo, nodoOrigen, nodoDestino, dist);
      algoritmo = "DIJKSTRA";
    } else {
      resultado = rutaAproximada(reporteIds, coordenadas, nodoOrigen);
      algoritmo = "TSP_HEURISTICO";
    }

    await registrarEjecucion({ adminId: req.user.id, tipo: algoritmo, nodosEntrada: reporteIds, resultado });
    res.json({ algoritmo, ...resultado });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { ejecutarBFS, ejecutarDFS, ejecutarRutaOptima };
