const test = require("node:test");
const assert = require("node:assert/strict");
const { construirGrafo } = require("../src/services/graphBuilder");
const { dijkstra, aEstrella, reconstruirRuta } = require("../src/services/shortestPath");

const reportesPrueba = [
  { id: 1, latitud: -17.7739, longitud: -63.1822 },
  { id: 2, latitud: -17.7802, longitud: -63.1943 },
  { id: 3, latitud: -17.7625, longitud: -63.1751 },
  { id: 4, latitud: -17.7900, longitud: -63.1700 },
];
const { adyacencia } = construirGrafo(reportesPrueba);
const coordenadas = {};
reportesPrueba.forEach((r) => (coordenadas[r.id] = { lat: r.latitud, lng: r.longitud }));

test("dijkstra: la distancia del nodo inicial a sí mismo es 0", () => {
  const { dist } = dijkstra(adyacencia, 1);
  assert.equal(dist[1], 0);
});

test("dijkstra: todas las distancias calculadas son mayores o iguales a 0", () => {
  const { dist } = dijkstra(adyacencia, 1);
  Object.values(dist).forEach((d) => assert.ok(d >= 0));
});

test("dijkstra: en un grafo completo, la ruta directa nunca es más cara que pasar por un intermedio", () => {
  const { dist } = dijkstra(adyacencia, 1);
  const directa = adyacencia[1].find((a) => a.nodo === 4).peso;
  assert.ok(dist[4] <= directa + 1e-6); // Dijkstra debe encontrar al menos la ruta directa
  assert.equal(Math.round(dist[4]), Math.round(directa)); // en grafo completo, la directa ES la óptima
});

test("dijkstra + reconstruirRuta: la ruta reconstruida empieza en el origen y termina en el destino", () => {
  const { dist, previo } = dijkstra(adyacencia, 1);
  const { ruta } = reconstruirRuta(previo, 1, 3, dist);
  assert.equal(ruta[0], 1);
  assert.equal(ruta[ruta.length - 1], 3);
});

test("aEstrella: obtiene la misma distancia óptima que Dijkstra en un grafo completo pequeño", () => {
  const { dist } = dijkstra(adyacencia, 1);
  const resultadoAEstrella = aEstrella(adyacencia, coordenadas, 1, 4);
  assert.ok(Math.abs(resultadoAEstrella.distanciaTotal - dist[4]) < 1e-6);
});

test("aEstrella: la ruta resultante conecta origen y destino", () => {
  const { ruta } = aEstrella(adyacencia, coordenadas, 1, 3);
  assert.equal(ruta[0], 1);
  assert.equal(ruta[ruta.length - 1], 3);
});
