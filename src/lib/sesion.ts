/**
 * Firma y verificación de la sesión, sólo con Web Crypto.
 *
 * Este módulo lo carga el proxy, que según la plataforma puede correr en el
 * runtime Edge. Ahí no existen `node:crypto` ni `Buffer`, y un import de esos
 * revienta al cargar el módulo — antes de ejecutar una sola línea, con lo que
 * TODAS las rutas devuelven 500. Por eso acá no se importa nada de Node.
 *
 * El hasheo de contraseñas (scrypt) vive aparte, en auth.ts, porque sólo lo usa
 * la ruta de login, que siempre corre en Node.
 */

export const COOKIE_SESION = "apolo_sesion";
export const DURACION_SESION_SEG = 60 * 60 * 24 * 7; // una semana

function aBase64Url(bytes: Uint8Array): string {
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(texto: string): Uint8Array<ArrayBuffer> {
  const b64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = new Uint8Array(new ArrayBuffer(binario.length));
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

async function clave(secreto: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function firmarSesion(secreto: string, ahoraMs: number = Date.now()): Promise<string> {
  const ahora = Math.floor(ahoraMs / 1000);
  const cuerpo = aBase64Url(
    new TextEncoder().encode(JSON.stringify({ iat: ahora, exp: ahora + DURACION_SESION_SEG })),
  );
  const firma = await crypto.subtle.sign("HMAC", await clave(secreto), new TextEncoder().encode(cuerpo));
  return `v1.${cuerpo}.${aBase64Url(new Uint8Array(firma))}`;
}

/**
 * Valida firma y vencimiento. La cookie no guarda ningún dato sensible: sólo
 * dice "esta sesión la emitió este servidor y todavía no venció".
 */
export async function verificarSesion(
  token: string | undefined,
  secreto: string | undefined,
): Promise<boolean> {
  if (!token || !secreto) return false;

  const partes = token.split(".");
  if (partes.length !== 3 || partes[0] !== "v1") return false;

  const [, cuerpo, firma] = partes;
  try {
    // subtle.verify compara en tiempo constante por su cuenta.
    const valida = await crypto.subtle.verify(
      "HMAC",
      await clave(secreto),
      deBase64Url(firma),
      new TextEncoder().encode(cuerpo),
    );
    if (!valida) return false;

    const payload = JSON.parse(new TextDecoder().decode(deBase64Url(cuerpo)));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
