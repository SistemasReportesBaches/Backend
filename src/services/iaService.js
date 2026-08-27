require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Prompt ultra optimizado para mínima latencia:
 * Solo devuelve "BACHE" o "NO_BACHE" sin descripciones, JSON ni razonamiento.
 */
const PROMPT_VALIDACION = `Determina si la imagen adjunta contiene un bache visible en una calle o pavimento.

Reglas estrictas:
- Si claramente hay un bache visible en una calle o pavimento -> responde exactamente: BACHE
- Si claramente NO hay un bache -> responde exactamente: NO_BACHE
- Si la imagen está borrosa, no muestra la calle, está vacía o no permite determinarlo -> responde exactamente: NO_BACHE

No describas la imagen. No des explicaciones. No uses JSON.
Responde únicamente con una sola palabra: BACHE o NO_BACHE.`;

/**
 * Valida si una imagen contiene un bache usando Gemini Vision con respuesta ultrarrápida.
 *
 * @param {Buffer} buffer - Buffer de la imagen
 * @param {string} mimetype - MIME type (image/jpeg, image/png, image/webp)
 * @returns {Promise<{ esBache: boolean, decision: 'BACHE' | 'NO_BACHE', confianza: string, mensaje: string }>}
 */
async function validarBache(buffer, mimetype) {
  return _llamarGemini(buffer, mimetype);
}

async function _llamarGemini(buffer, mimetype) {
  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  // Prioridad: Gemini 3.5 Flash -> Gemini 3.6 Flash -> Gemini 3.7 Flash
  const candidateModels = Array.from(
    new Set([
      primaryModel,
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-flash-lite-latest",
    ])
  );

  const imagePart = {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: mimetype,
    },
  };

  const generationConfig = {
    maxOutputTokens: 10,
    temperature: 0,
  };

  let text = "";
  let lastError = null;

  const genAI = getGenAI();
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
      const result = await model.generateContent([PROMPT_VALIDACION, imagePart]);
      text = result.response.text().trim().toUpperCase();
      if (text) break;
    } catch (err) {
      lastError = err;
      console.warn(`[iaService] Modelo ${modelName} no disponible (${err.message.slice(0, 80)}). Probando siguiente modelo...`);
    }
  }

  if (!text) {
    throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de Gemini disponible.");
  }

  // Validación estricta: Únicamente BACHE si la respuesta lo confirma sin negaciones
  const esBache = text === "BACHE" || (/^BACHE\b/.test(text) && !text.includes("NO"));
  const decision = esBache ? "BACHE" : "NO_BACHE";

  return {
    esBache,
    decision,
    confianza: "alta",
    mensaje: esBache ? "Bache detectado." : "No se detectó un bache en la imagen.",
  };
}

module.exports = { validarBache };
