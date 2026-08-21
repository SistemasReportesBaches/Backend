const test = require("node:test");
const assert = require("node:assert/strict");
const { rutaAproximada } = require("../src/services/routeHeuristic");

const coordenadas = {
  1: { lat: -17.7739, lng: -63.1822 },
  2: { lat: -17.7802, lng: -63.1943 },
  3: { lat: -17.7625, lng: -63.1751 },
  4: { lat: -17.7900, lng: -63.1700 },
  5: { lat: -17.7550, lng: -63.1900 },
};
const nodos = Object.keys(coordenadas).map(Number);

test("rutaAproximada: la ruta resultante visita todos los nodos exactamente una vez", () => {
  const { ruta } = rutaAproximada(nodos, coordenadas, 1);
  assert.equal(ruta.length, nodos.length);
  assert.equal(new Set(ruta).size, nodos.length);
});

test("rutaAproximada: la ruta siempre comienza en el nodo indicado como inicio", () => {
  const { ruta } = rutaAproximada(nodos, coordenadas, 3);
  assert.equal(ruta[0], 3);
});

test("rutaAproximada: la distancia total reportada es positiva", () => {
  const { distanciaTotal } = rutaAproximada(nodos, coordenadas, 1);
  assert.ok(distanciaTotal > 0);
});

test("rutaAproximada: con un solo nodo, la distancia total es 0", () => {
  const { ruta, distanciaTotal } = rutaAproximada([1], coordenadas, 1);
  assert.deepEqual(ruta, [1]);
  assert.equal(distanciaTotal, 0);
});

test("rutaAproximada: el refinamiento 2-opt nunca produce una ruta peor que la de Vecino más Cercano", () => {
  // Se compara contra una implementación de referencia de solo "vecino más cercano" (sin 2-opt)
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function distanciaTotalRuta(ruta) {
    let total = 0;
    for (let i = 0; i < ruta.length - 1; i++) {
      const a = coordenadas[ruta[i]], b = coordenadas[ruta[i + 1]];
      total += haversine(a.lat, a.lng, b.lat, b.lng);
    }
    return total;
  }
  function soloVecinoMasCercano(nodos, inicio) {
    const pendientes = new Set(nodos.filter((n) => n !== inicio));
    const ruta = [inicio];
    let actual = inicio;
    while (pendientes.size) {
      let mejor = null, mejorD = Infinity;
      pendientes.forEach((c) => {
        const a = coordenadas[actual], b = coordenadas[c];
        const d = haversine(a.lat, a.lng, b.lat, b.lng);
        if (d < mejorD) { mejorD = d; mejor = c; }
      });
      ruta.push(mejor); pendientes.delete(mejor); actual = mejor;
    }
    return ruta;
  }

  const rutaSoloNN = soloVecinoMasCercano(nodos, 1);
  const { ruta: rutaConDosOpt } = rutaAproximada(nodos, coordenadas, 1);

  const distNN = distanciaTotalRuta(rutaSoloNN);
  const distDosOpt = distanciaTotalRuta(rutaConDosOpt);

  assert.ok(distDosOpt <= distNN + 1e-6, `2-opt (${distDosOpt}) no debería ser peor que NN puro (${distNN})`);
});
