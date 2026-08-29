-- Migración: Añadir notify_usuario y crear tablas notificaciones y quejas
-- Archivo idempotente: puede ejecutarse varias veces sin causar errores.

BEGIN;

-- 1) Añadir columna notify_usuario a reportes (si no existe)
ALTER TABLE reportes
  ADD COLUMN IF NOT EXISTS notify_usuario BOOLEAN NOT NULL DEFAULT false;

-- 2) Crear tabla notificaciones si no existe
CREATE TABLE IF NOT EXISTS notificaciones (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id),
  reporte_id   INTEGER REFERENCES reportes(id),
  tipo         VARCHAR(60) NOT NULL,
  mensaje      TEXT NOT NULL,
  leido        BOOLEAN NOT NULL DEFAULT false,
  fecha_creada TIMESTAMP NOT NULL DEFAULT now()
);

-- Índice para consultas por usuario
CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificaciones(usuario_id);

-- 3) Crear tabla quejas si no existe
CREATE TABLE IF NOT EXISTS quejas (
  id                   SERIAL PRIMARY KEY,
  usuario_id           INTEGER NOT NULL REFERENCES usuarios(id),
  reporte_id           INTEGER REFERENCES reportes(id),
  descripcion          TEXT NOT NULL,
  estado               VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','revisado','resuelto')),
  respuesta_admin      TEXT,
  fecha_creada         TIMESTAMP NOT NULL DEFAULT now(),
  fecha_actualizacion  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quejas_usuario ON quejas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_quejas_reporte ON quejas(reporte_id);

-- 4) Función para mantener fecha_actualizacion en quejas
CREATE OR REPLACE FUNCTION set_queja_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5) Trigger: eliminar si existe y crear (DROP TRIGGER IF EXISTS funciona, así evitamos errores)
DROP TRIGGER IF EXISTS trg_queja_timestamp ON quejas;
CREATE TRIGGER trg_queja_timestamp
BEFORE INSERT OR UPDATE ON quejas
FOR EACH ROW EXECUTE FUNCTION set_queja_timestamp();

COMMIT;

-- Nota:
-- - Ejecuta este script con psql: psql -h <host> -U <user> -d <db> -f "path\\to\\add_notify_notif_quejas.sql"
-- - El script intentará no duplicar objetos ya existentes. Si tu versión de Postgres no soporta alguna sentencia (p.ej. ALTER ... IF NOT EXISTS), ajusta manualmente.
