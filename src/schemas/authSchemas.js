const { z } = require("zod");

const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(80),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres.").max(80),
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

module.exports = { registerSchema, loginSchema };
