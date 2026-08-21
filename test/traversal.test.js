const test = require("node:test");
const assert = require("node:assert/strict");
const { construirGrafo } = require("../src/services/graphBuilder");
const { bfs, dfs } = require("../src/services/traversal");

const reportesPrueba = [
  { id: 1, latitud: -17.7739, longitud: -63.1822 },
  { id: 2, latitud: -17.7802, longitud: -63.1943 },
  { id: 3, latitud: -17.7625, longitud: -63.1751 },
  { id: 4, latitud: -17.7900, longitud: -63.1700 },
  { id: 5, latitud: -17.7550, longitud: -63.1900 },
];
const { adyacencia } = construirGrafo(reportesPrueba);

test("bfs: visita todos los nodos alcanzables desde el nodo inicial", () => {
  const { orden } = bfs(adyacencia, 1);
  assert.equal(orden.length, 5);
  assert.ok(orden.includes(1) && orden.includes(5));
});

test("bfs: el nodo inicial es siempre el primero en el orden de visita", () => {
  const { orden } = bfs(adyacencia, 3);
  assert.equal(orden[0], 3);
});

test("bfs: en un grafo completo, todos los vecinos quedan en el nivel 1", () => {
  const { niveles } = bfs(adyacencia, 1);
  assert.equal(niveles[1], 0);
  [2, 3, 4, 5].forEach((n) => assert.equal(niveles[n], 1));
});

test("dfs: visita todos los nodos alcanzables desde el nodo inicial", () => {
  const { orden } = dfs(adyacencia, 1);
  assert.equal(orden.length, 5);
  assert.equal(new Set(orden).size, 5); // sin nodos repetidos
});

test("dfs: el nodo inicial es siempre el primero en el orden de visita", () => {
  const { orden } = dfs(adyacencia, 4);
  assert.equal(orden[0], 4);
});

test("bfs y dfs: en un grafo NO conexo, no visitan los nodos del otro componente", () => {
  // Se arma un grafo con dos componentes separados: {1,2} y {3,4}
  const adyacenciaDisconexa = {
    1: [{ nodo: 2, peso: 100 }],
    2: [{ nodo: 1, peso: 100 }],
    3: [{ nodo: 4, peso: 50 }],
    4: [{ nodo: 3, peso: 50 }],
  };
  const resultadoBFS = bfs(adyacenciaDisconexa, 1);
  const resultadoDFS = dfs(adyacenciaDisconexa, 1);
  assert.deepEqual(resultadoBFS.orden.sort(), [1, 2]);
  assert.deepEqual(resultadoDFS.orden.sort(), [1, 2]);
});
