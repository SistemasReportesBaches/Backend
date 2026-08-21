const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = (Number(process.env.MAX_PHOTO_SIZE_MB) || 5) * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const nombreUnico = crypto.randomUUID() + path.extname(file.originalname).toLowerCase();
    cb(null, nombreUnico);
  },
});

function filtroArchivo(req, file, cb) {
  if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
    return cb(new Error("Formato de imagen no permitido. Solo se aceptan JPG, PNG o WEBP."));
  }
  cb(null, true);
}

const uploadFoto = multer({
  storage,
  fileFilter: filtroArchivo,
  limits: { fileSize: MAX_SIZE_BYTES },
});

module.exports = { uploadFoto };
