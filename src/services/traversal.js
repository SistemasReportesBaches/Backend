/**
 * BFS — Breadth First Search (recorrido por niveles).
 *
 * Qué hace: visita el grafo nivel por nivel a partir de un nodo inicial.
 * Qué NO hace: no garantiza la ruta de menor distancia real, solo la de
 * menor número de "saltos" (aristas), porque no considera el peso.
 * Uso en el sistema: analizar cómo se expande la cobertura de baches
 * desde un punto de partida (conectividad topológica), no para rutas óptimas.
 *
 * Complejidad: O(V + E)
 */
function bfs(adyacencia, nodoInicial) {
  const visitados = new Set([nodoInicial]);
  const cola = [nodoInicial];
  const orden = [];
  const niveles = { [nodoInicial]: 0 };

  while (cola.length > 0) {
    const actual = cola.shift();
    orden.push(actual);

    for (const { nodo: vecino } of adyacencia[actual] || []) {
      if (!visitados.has(vecino)) {
        visitados.add(vecino);
        niveles[vecino] = niveles[actual] + 1;
        cola.push(vecino);
      }
    }
  }
  return { orden, niveles };
}

/**
 * DFS — Depth First Search (recorrido en profundidad).
 *
 * Qué hace: explora una rama completa antes de retroceder (backtrack).
 * Uso en el sistema: verificar conectividad del grafo (¿todos los baches
 * de la zona están alcanzables entre sí?) y detectar sub-grupos aislados.
 * No se usa para calcular rutas de costo mínimo.
 *
 * Complejidad: O(V + E)
 */
function dfs(adyacencia, nodoInicial) {
  const visitados = new Set();
  const orden = [];

  function explorar(nodo) {
    visitados.add(nodo);
    orden.push(nodo);
    for (const { nodo: vecino } of adyacencia[nodo] || []) {
      if (!visitados.has(vecino)) explorar(vecino);
    }
  }

  explorar(nodoInicial);
  return { orden };
}

module.exports = { bfs, dfs };
