const { haversineMetros } = require("../utils/haversine");

/**
 * Ruta que pase por MÚLTIPLES baches seleccionados.
 *
 * Esto es una variante del Problema del Vendedor Viajero (TSP): hallar
 * el orden de visita de N nodos que minimice la distancia total.
 *
 * El TSP exacto es NP-duro (O(N!) por fuerza bruta, O(N² · 2^N) con
 * Held-Karp), inviable para uso interactivo en web más allá de ~15-20
 * nodos. Se implementa entonces una heurística en dos fases:
 *
 *   1) Vecino más cercano (Nearest Neighbor): construye una ruta inicial
 *      razonable en O(N²).
 *   2) Refinamiento 2-opt: elimina cruces de la ruta intercambiando
 *      pares de segmentos, mejorando el resultado sin costo exponencial.
 *
 * Resultado típico: entre 5% y 15% por encima del óptimo real, en tiempo
 * polinomial — la opción apropiada para un proyecto con restricciones
 * de tiempo de respuesta interactivo.
 */
function rutaAproximada(nodos, coordenadas, idInicio) {
  if (nodos.length <= 1) return { ruta: nodos, distanciaTotal: 0 };

  // ---- Fase 1: Vecino más cercano ----
  const pendientes = new Set(nodos.filter((n) => n !== idInicio));
  const ruta = [idInicio];
  let actual = idInicio;

  while (pendientes.size > 0) {
    let siguiente = null;
    let mejorDist = Infinity;
    for (const candidato of pendientes) {
      const d = distancia(coordenadas, actual, candidato);
      if (d < mejorDist) { mejorDist = d; siguiente = candidato; }
    }
    ruta.push(siguiente);
    pendientes.delete(siguiente);
    actual = siguiente;
  }

  // ---- Fase 2: refinamiento 2-opt ----
  const rutaOptimizada = dosOpt(ruta, coordenadas);

  return {
    ruta: rutaOptimizada,
    distanciaTotal: distanciaTotalRuta(rutaOptimizada, coordenadas),
  };
}

function distancia(coordenadas, a, b) {
  return haversineMetros(coordenadas[a].lat, coordenadas[a].lng, coordenadas[b].lat, coordenadas[b].lng);
}

function distanciaTotalRuta(ruta, coordenadas) {
  let total = 0;
  for (let i = 0; i < ruta.length - 1; i++) total += distancia(coordenadas, ruta[i], ruta[i + 1]);
  return total;
}

/**
 * 2-opt: mientras exista una mejora, invierte el segmento [i, k] de la
 * ruta si eso reduce la distancia total. Se detiene cuando ninguna
 * inversión mejora el resultado (óptimo local).
 */
function dosOpt(rutaInicial, coordenadas) {
  let mejorRuta = rutaInicial;
  let mejorado = true;

  while (mejorado) {
    mejorado = false;
    for (let i = 1; i < mejorRuta.length - 2; i++) {
      for (let k = i + 1; k < mejorRuta.length - 1; k++) {
        const nuevaRuta = invertirSegmento(mejorRuta, i, k);
        if (distanciaTotalRuta(nuevaRuta, coordenadas) < distanciaTotalRuta(mejorRuta, coordenadas)) {
          mejorRuta = nuevaRuta;
          mejorado = true;
        }
      }
    }
  }
  return mejorRuta;
}

function invertirSegmento(ruta, i, k) {
  return [...ruta.slice(0, i), ...ruta.slice(i, k + 1).reverse(), ...ruta.slice(k + 1)];
}

module.exports = { rutaAproximada };
