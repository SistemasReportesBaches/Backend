const { haversineMetros } = require("../utils/haversine");

/**
 * Cola de prioridad mínima muy simple basada en array.
 * Suficiente para el tamaño de grafo esperado (zonas de decenas/pocos
 * cientos de reportes); para grafos mucho más grandes se recomendaría
 * un heap binario para bajar de O(V) a O(log V) por extracción.
 */
class ColaPrioridad {
  constructor() { this.items = []; }
  agregar(nodo, prioridad) { this.items.push({ nodo, prioridad }); }
  extraerMinimo() {
    let idxMin = 0;
    for (let i = 1; i < this.items.length; i++) {
      if (this.items[i].prioridad < this.items[idxMin].prioridad) idxMin = i;
    }
    return this.items.splice(idxMin, 1)[0];
  }
  actualizar(nodo, nuevaPrioridad) {
    const item = this.items.find((i) => i.nodo === nodo);
    if (item) item.prioridad = nuevaPrioridad;
  }
  get estaVacia() { return this.items.length === 0; }
}

/**
 * Dijkstra — camino de costo (distancia) MÍNIMO entre un nodo inicial
 * y todos los demás, válido porque los pesos (distancias Haversine)
 * son siempre no negativos.
 *
 * Complejidad: O((V + E) log V) con heap; O(V²) con la cola simple de arriba.
 */
function dijkstra(adyacencia, nodoInicial) {
  const dist = {};
  const previo = {};
  const cola = new ColaPrioridad();

  Object.keys(adyacencia).forEach((n) => {
    dist[n] = n == nodoInicial ? 0 : Infinity;
    cola.agregar(n, dist[n]);
  });

  while (!cola.estaVacia) {
    const { nodo: u } = cola.extraerMinimo();
    for (const { nodo: v, peso } of adyacencia[u] || []) {
      const alt = dist[u] + peso;
      if (alt < dist[v]) {
        dist[v] = alt;
        previo[v] = u;
        cola.actualizar(v, alt);
      }
    }
  }
  return { dist, previo };
}

/**
 * A* — igual que Dijkstra pero guiado por una heurística admisible:
 * la distancia Haversine en línea recta desde el nodo actual hasta el
 * destino. Al orientar la búsqueda hacia el destino, generalmente
 * expande menos nodos que Dijkstra en grafos grandes.
 *
 * coordenadas: { [id]: {lat, lng} } — necesario para calcular la heurística.
 */
function aEstrella(adyacencia, coordenadas, nodoInicial, nodoDestino) {
  const heuristica = (n) =>
    haversineMetros(coordenadas[n].lat, coordenadas[n].lng, coordenadas[nodoDestino].lat, coordenadas[nodoDestino].lng);

  const g = { [nodoInicial]: 0 };            // costo real acumulado
  const f = { [nodoInicial]: heuristica(nodoInicial) }; // costo estimado total
  const previo = {};
  const abiertos = new ColaPrioridad();
  abiertos.agregar(nodoInicial, f[nodoInicial]);
  const visitados = new Set();

  while (!abiertos.estaVacia) {
    const { nodo: actual } = abiertos.extraerMinimo();
    if (actual == nodoDestino) break;
    if (visitados.has(actual)) continue;
    visitados.add(actual);

    for (const { nodo: vecino, peso } of adyacencia[actual] || []) {
      const gTentativo = g[actual] + peso;
      if (g[vecino] === undefined || gTentativo < g[vecino]) {
        previo[vecino] = actual;
        g[vecino] = gTentativo;
        f[vecino] = gTentativo + heuristica(vecino);
        abiertos.agregar(vecino, f[vecino]);
      }
    }
  }

  return reconstruirRuta(previo, nodoInicial, nodoDestino, g);
}

function reconstruirRuta(previo, inicio, destino, dist) {
  if (dist[destino] === undefined) return { ruta: [], distanciaTotal: Infinity };

  // Los objetos JS convierten sus claves a string (previo[actual] puede devolver
  // "1" aunque los ids originales sean numéricos). Se normaliza a Number para que
  // el array de salida tenga un tipo consistente con el resto de la API.
  const normalizar = (n) => (Number.isNaN(Number(n)) ? n : Number(n));

  const ruta = [normalizar(destino)];
  let actual = destino;
  while (actual != inicio) {
    actual = previo[actual];
    ruta.unshift(normalizar(actual));
  }
  return { ruta, distanciaTotal: dist[destino] };
}

module.exports = { dijkstra, aEstrella, reconstruirRuta };
