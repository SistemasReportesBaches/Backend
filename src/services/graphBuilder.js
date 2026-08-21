const { haversineMetros } = require("../utils/haversine");

/**
 * Construye un grafo NO dirigido y completo (todos los nodos conectados
 * entre sí) a partir de una lista de reportes de baches.
 *
 * Nodo   -> un reporte (id, lat, lng)
 * Arista -> distancia Haversine entre dos reportes (peso en metros)
 *
 * El grafo se representa como lista de adyacencia:
 *   { [id]: [{ nodo: idVecino, peso: distanciaMetros }, ...] }
 *
 * NOTA: para zonas grandes (> ~150 nodos) conviene limitar las aristas
 * a los k-vecinos más cercanos en lugar de un grafo completo, para
 * mantener el costo de construcción en O(N log N) en vez de O(N²).
 * Aquí se implementa la versión completa (O(N²)), adecuada para el
 * tamaño típico de una zona seleccionada en el mapa.
 */
function construirGrafo(reportes) {
  const nodos = reportes.map((r) => ({ id: r.id, lat: r.latitud, lng: r.longitud }));
  const adyacencia = {};

  nodos.forEach((n) => (adyacencia[n.id] = []));

  for (let i = 0; i < nodos.length; i++) {
    for (let j = i + 1; j < nodos.length; j++) {
      const peso = haversineMetros(nodos[i].lat, nodos[i].lng, nodos[j].lat, nodos[j].lng);
      adyacencia[nodos[i].id].push({ nodo: nodos[j].id, peso });
      adyacencia[nodos[j].id].push({ nodo: nodos[i].id, peso });
    }
  }

  return { nodos, adyacencia };
}

module.exports = { construirGrafo };
