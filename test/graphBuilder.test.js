const test = require("node:test");
const assert = require("node:assert/strict");
const { construirGrafo } = require("../src/services/graphBuilder");

const reportesPrueba = [
  { id: 1, latitud: -17.7739, longitud: -63.1822 },
  { id: 2, latitud: -17.7802, longitud: -63.1943 },
  { id: 3, latitud: -17.7625, longitud: -63.1751 },
];

test("construirGrafo: crea un nodo por cada reporte", () => {
  const { nodos } = construirGrafo(reportesPrueba);
  assert.equal(nodos.length, 3);
});

test("construirGrafo: genera un grafo completo (N*(N-1)/2 aristas únicas)", () => {
  const { adyacencia } = construirGrafo(reportesPrueba);
  const totalAristasDirigidas = Object.values(adyacencia).reduce((acc, lista) => acc + lista.length, 0);
  // Cada arista no dirigida se cuenta dos veces (una por cada extremo)
  const aristasUnicasEsperadas = (reportesPrueba.length * (reportesPrueba.length - 1)) / 2;
  assert.equal(totalAristasDirigidas / 2, aristasUnicasEsperadas);
});

test("construirGrafo: el grafo es no dirigido (peso A->B === peso B->A)", () => {
  const { adyacencia } = construirGrafo(reportesPrueba);
  const pesoAB = adyacencia[1].find((a) => a.nodo === 2).peso;
  const pesoBA = adyacencia[2].find((a) => a.nodo === 1).peso;
  assert.equal(pesoAB, pesoBA);
});

test("construirGrafo: todos los pesos son mayores a 0 para nodos distintos", () => {
  const { adyacencia } = construirGrafo(reportesPrueba);
  Object.values(adyacencia).forEach((lista) => {
    lista.forEach((arista) => assert.ok(arista.peso > 0));
  });
});
