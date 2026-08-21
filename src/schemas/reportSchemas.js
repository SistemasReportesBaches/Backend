const { z } = require("zod");

// Bounding box aproximado del departamento de Santa Cruz, Bolivia,
// usado como cota adicional de sanidad para las coordenadas recibidas.
const SANTA_CRUZ_BOUNDS = { latMin: -19.7, latMax: -13.6, lngMin: -65.6, lngMax: -57.5 };

const crearReporteSchema = z.object({
  descripcion: z.string().min(5, "La descripción debe tener al menos 5 caracteres.").max(500),
  // z.coerce.number() porque multipart/form-data (subida de foto) envía TODOS los
  // campos como string; sin esto, Zod rechaza "-17.7739" por no ser un number.
  latitud: z.coerce.number().min(-90).max(90)
    .refine((v) => v >= SANTA_CRUZ_BOUNDS.latMin && v <= SANTA_CRUZ_BOUNDS.latMax, {
      message: "La latitud está fuera del rango esperado para Santa Cruz, Bolivia.",
    }),
  longitud: z.coerce.number().min(-180).max(180)
    .refine((v) => v >= SANTA_CRUZ_BOUNDS.lngMin && v <= SANTA_CRUZ_BOUNDS.lngMax, {
      message: "La longitud está fuera del rango esperado para Santa Cruz, Bolivia.",
    }),
  precision_gps: z.coerce.number().nonnegative().optional(),
  gravedad: z.enum(["leve", "moderado", "grave", "critico"]),
});

const actualizarReporteSchema = z.object({
  descripcion: z.string().min(5).max(500).optional(),
  gravedad: z.enum(["leve", "moderado", "grave", "critico"]).optional(),
  estado: z.enum(["pendiente", "en_proceso", "atendido", "rechazado"]).optional(),
});

const grafoSchema = z.object({
  reporteIds: z.array(z.number().int().positive()).min(2, "Se necesitan al menos 2 reportes."),
  nodoInicial: z.number().int().positive(),
});

const rutaOptimaSchema = z.object({
  reporteIds: z.array(z.number().int().positive()).min(2),
  nodoOrigen: z.number().int().positive(),
  nodoDestino: z.number().int().positive().optional(), // si se omite -> heurística multi-nodo (TSP)
});

const actualizarUsuarioSchema = z.object({
  rol: z.enum(["ciudadano", "administrador"]).optional(),
  estado: z.enum(["activo", "suspendido"]).optional(),
});

module.exports = { crearReporteSchema, actualizarReporteSchema, grafoSchema, rutaOptimaSchema, actualizarUsuarioSchema };
