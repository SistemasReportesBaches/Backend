const jwt = require("jsonwebtoken");

/**
 * requireAuth: valida el token JWT enviado en el header Authorization.
 * Formato esperado: "Authorization: Bearer <token>"
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token de autenticación no proporcionado." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, rol }
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
}

/**
 * requireRole: control de acceso basado en roles (RBAC).
 * Uso: requireRole("administrador")
 * Debe usarse siempre DESPUÉS de requireAuth.
 */
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado." });
    }
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(" o ")}.`,
      });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
