const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Prompt diseñado para minimizar falsos negativos (RNF-10):
 * ante cualquier duda razonable, el modelo debe aprobar.
 * Solo rechaza cuando la imagen claramente NO contiene ninguna
 * irregularidad vial.
 */
const PROMPT_VALIDACION = `Eres un sistema experto en detección de baches y daños en pavimento urbano.
Analiza la imagen adjunta y determina si contiene un bache, hoyo, grieta profunda, hundimiento
o cualquier tipo de daño significativo en la calzada o vía pública.

CRITERIOS DE APROBACIÓN (responde esBache: true si se cumple alguno):
- Bache o hoyo visible en asfalto, concreto, tierra o adoquín
- Grietas profundas o hundimientos en la superficie vial
- Desprendimiento de pavimento o daño estructural en la calzada
- Acumulación de agua que evidencie un hundimiento
- Daño vial fotografiado desde un vehículo o a pie, aunque la foto sea parcial o de baja calidad

CRITERIOS DE RECHAZO (responde esBache: false SOLO si estás muy seguro):
- La imagen NO muestra ninguna vía, calzada, calle o camino
- La imagen es completamente irrelevante (selfie, paisaje natural, interior de edificio, etc.)
- La imagen es completamente ilegible o es una pantalla en blanco

IMPORTANTE: En caso de duda, aprueba la imagen. Es preferible un falso positivo
que perder un reporte legítimo de un ciudadano.

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "esBache": true,
  "confianza": "alta",
  "mensaje": "Se detectó un bache..."
}

Valores posibles para "confianza": "alta", "media", "baja"
- "alta": muy claro que es (o no es) un bache
- "media": parece un bache pero la imagen no es perfecta
- "baja": difícil de determinar, se aprueba por precaución

Para "mensaje": sé breve (máx 100 caracteres), descriptivo y en español.
Si apruebas: describe brevemente lo que ves. Si rechazas: explica por qué.`;

/**
 * Valida si una imagen contiene un bache usando Gemini Vision.
 *
 * @param {Buffer} buffer - Buffer de la imagen
 * @param {string} mimetype - MIME type (image/jpeg, image/png, image/webp)
 * @returns {Promise<{ esBache: boolean, confianza: string, mensaje: string }>}
 */
async function validarBache(buffer, mimetype) {
  // Sin timeout: el análisis tarda lo que necesite para ser preciso
  return _llamarGemini(buffer, mimetype);
}

async function _llamarGemini(buffer, mimetype) {
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const imagePart = {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: mimetype,
    },
  };

  const result = await model.generateContent([PROMPT_VALIDACION, imagePart]);
  const text = result.response.text().trim();

  // Extraer JSON de la respuesta (puede venir con markdown ```json ... ```)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[iaService] Respuesta inesperada de Gemini:", text);
    // Ante respuesta inválida: aprobamos (RNF-10)
    return { esBache: true, confianza: "baja", mensaje: "No se pudo analizar la respuesta de IA. Imagen aceptada." };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    esBache: Boolean(parsed.esBache),
    confianza: ["alta", "media", "baja"].includes(parsed.confianza) ? parsed.confianza : "media",
    mensaje: String(parsed.mensaje || "Análisis completado.").slice(0, 150),
  };
}

module.exports = { validarBache };
