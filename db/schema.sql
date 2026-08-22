-- ============================================================
-- Sistema Web de Reporte, Geolocalización y Gestión de Baches
-- Santa Cruz, Bolivia — Esquema de Base de Datos
-- PostgreSQL + PostGIS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- Catálogos ----------
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(30) UNIQUE NOT NULL   -- 'ciudadano' | 'administrador'
);

CREATE TABLE gravedades (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(20) UNIQUE NOT NULL,  -- leve | moderado | grave | critico
    color_hex   VARCHAR(7)  NOT NULL,
    nivel       SMALLINT UNIQUE NOT NULL CHECK (nivel BETWEEN 1 AND 4)
);

CREATE TABLE estados (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(20) UNIQUE NOT NULL   -- pendiente | en_proceso | atendido | rechazado
);

-- ---------- Usuarios ----------
CREATE TABLE usuarios (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(80)  NOT NULL,
    apellido        VARCHAR(80)  NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    rol_id          INTEGER NOT NULL REFERENCES roles(id),
    fecha_registro  TIMESTAMP NOT NULL DEFAULT now(),
    estado          VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','suspendido'))
);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- ---------- Zonas administrativas (opcional, para selección por zona) ----------
CREATE TABLE zonas (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL,
    tipo    VARCHAR(30) DEFAULT 'poligono',      -- poligono | radio | distrito
    geom    GEOMETRY(POLYGON, 4326) NOT NULL
);
CREATE INDEX idx_zonas_geom ON zonas USING GIST(geom);

-- ---------- Reportes de baches ----------
CREATE TABLE reportes (
    id                  SERIAL PRIMARY KEY,
    usuario_id          INTEGER NOT NULL REFERENCES usuarios(id),
    descripcion         TEXT NOT NULL,
    fotografia_url      VARCHAR(255) NOT NULL,
    latitud             DOUBLE PRECISION NOT NULL CHECK (latitud BETWEEN -90 AND 90),
    longitud            DOUBLE PRECISION NOT NULL CHECK (longitud BETWEEN -180 AND 180),
    precision_gps       DOUBLE PRECISION,               -- metros
    gravedad_id         INTEGER NOT NULL REFERENCES gravedades(id),
    estado_id           INTEGER NOT NULL REFERENCES estados(id) DEFAULT 1,
    fecha_reporte       TIMESTAMP NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT now(),
    geom                GEOMETRY(POINT, 4326) NOT NULL
);
CREATE INDEX idx_reportes_geom  ON reportes USING GIST(geom);
CREATE INDEX idx_reportes_fecha ON reportes(fecha_reporte);
CREATE INDEX idx_reportes_grav  ON reportes(gravedad_id);
CREATE INDEX idx_reportes_est   ON reportes(estado_id);

-- Mantiene "geom" sincronizado con latitud/longitud automáticamente
CREATE OR REPLACE FUNCTION set_reporte_geom() RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitud, NEW.latitud), 4326);
    NEW.fecha_actualizacion := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reporte_geom
BEFORE INSERT OR UPDATE ON reportes
FOR EACH ROW EXECUTE FUNCTION set_reporte_geom();

-- ---------- Trazabilidad de ejecuciones de algoritmos (BFS/DFS/Dijkstra/A*/TSP) ----------
CREATE TABLE ejecuciones_algoritmo (
    id              SERIAL PRIMARY KEY,
    admin_id        INTEGER NOT NULL REFERENCES usuarios(id),
    zona_id         INTEGER REFERENCES zonas(id),
    tipo_algoritmo  VARCHAR(20) NOT NULL CHECK (tipo_algoritmo IN ('BFS','DFS','DIJKSTRA','ASTAR','TSP_HEURISTICO')),
    nodos_entrada   JSONB NOT NULL,
    resultado       JSONB NOT NULL,
    fecha_ejecucion TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- Datos semilla ----------
INSERT INTO roles (nombre) VALUES ('ciudadano'), ('administrador');

INSERT INTO gravedades (nombre, color_hex, nivel) VALUES
    ('leve',     '#4CAF6D', 1),
    ('moderado', '#F2A93B', 2),
    ('grave',    '#E0483E', 3),
    ('critico',  '#1B1B1B', 4);

INSERT INTO estados (nombre) VALUES
    ('pendiente'), ('en_proceso'), ('atendido'), ('rechazado');
