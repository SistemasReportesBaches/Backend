const test = require("node:test");
const assert = require("node:assert/strict");
const { haversineMetros } = require("../src/utils/haversine");

test("haversine: distancia de un punto a sí mismo es 0", () => {
  const d = haversineMetros(-17.7833, -63.1821, -17.7833, -63.1821);
  assert.equal(d, 0);
});

test("haversine: distancia entre dos puntos conocidos de Santa Cruz (~1.46 km)", () => {
  // Coordenadas de dos reportes de ejemplo usados en el resto del proyecto (nodo 1 y nodo 2)
  const d = haversineMetros(-17.7739, -63.1822, -17.7802, -63.1943);
  // Se espera un valor cercano a 1460 m (± 5 m de tolerancia por redondeo de la fórmula)
  assert.ok(Math.abs(d - 1460.22) < 5, `distancia obtenida: ${d}`);
});

test("haversine: es simétrica (d(A,B) === d(B,A))", () => {
  const d1 = haversineMetros(-17.77, -63.18, -17.79, -63.17);
  const d2 = haversineMetros(-17.79, -63.17, -17.77, -63.18);
  assert.equal(d1, d2);
});

test("haversine: la distancia nunca es negativa", () => {
  const d = haversineMetros(-17.7, -63.1, -17.9, -63.3);
  assert.ok(d >= 0);
});
