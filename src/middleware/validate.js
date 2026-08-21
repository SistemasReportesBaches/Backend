/**
 * validate(schema): valida req.body contra un esquema de Zod.
 * Si falla, responde 400 con el detalle de los campos inválidos
 * ANTES de que la petición llegue al controlador o a la base de datos
 * (defensa en profundidad, junto con las validaciones del cliente).
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Datos de entrada inválidos.",
        detalles: result.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })),
      });
    }
    req.validated = result.data;
    return next();
  };
}

module.exports = { validate };
