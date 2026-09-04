import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const COOKIE_SESION = "apolo_sesion";
export const DURACION_SESION_SEG = 60 * 60 * 24 * 7; // una semana

// scrypt es lento y usa memoria a propósito: encarece muchísimo probar contraseñas a lo bruto.
// maxmem explícito porque 128 * N * r supera el tope que Node trae por defecto.
const SCRYPT = { N: 32768, r: 8, p: 1, keylen: 64, maxmem: 96 * 1024 * 1024 };

export interface ConfigAuth {
  secreto: string;
  usuario: string;
  hash: string;
}

/**
 * Lee las credenciales del entorno. Si falta algo devuelve null y el login
 * rechaza todo: ante una configuración incompleta se cierra, nunca se abre.
 */
export function configAuth(): ConfigAuth | null {
  const secreto = process.env.AUTH_SECRET;
  const usuario = process.env.AUTH_USUARIO;
  const hash = process.env.AUTH_PASSWORD_HASH;
  if (!secreto || secreto.length < 32) return null;
  if (!usuario || !hash) return null;
  return { secreto, usuario, hash };
}

/**
 * Formato: scrypt:N:r:p:salt:hash, con separador ":" y base64url.
 * Nada de "$" ni de "+/=": el cargador de entorno de Next expande $variable y
 * destruiría el hash en silencio al leerlo desde .env.
 */
export function hashearPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, SCRYPT.keylen, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64url"), hash.toString("base64url")].join(":");
}

export function verificarPassword(password: string, guardado: string): boolean {
  const partes = guardado.split(":");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;

  const [, n, r, p, saltB64, hashB64] = partes;
  let esperado: Buffer, salt: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64url");
    esperado = Buffer.from(hashB64, "base64url");
  } catch {
    return false;
  }
  if (salt.length === 0 || esperado.length === 0) return false;

  const calculado = scryptSync(password.normalize("NFKC"), salt, esperado.length, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem,
  });
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

/**
 * Compara dos textos sin filtrar por tiempo cuánto coinciden. Se hashean antes
 * porque timingSafeEqual exige longitudes iguales, y la longitud del usuario
 * tipeado no debe delatar la del real.
 */
export function compararConstante(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a.normalize("NFKC")).digest();
  const hb = createHash("sha256").update(b.normalize("NFKC")).digest();
  return timingSafeEqual(ha, hb);
}

function firmar(cuerpo: string, secreto: string): string {
  return createHmac("sha256", secreto).update(cuerpo).digest("base64url");
}

export function firmarSesion(secreto: string, ahoraMs: number = Date.now()): string {
  const ahora = Math.floor(ahoraMs / 1000);
  const cuerpo = Buffer.from(JSON.stringify({ iat: ahora, exp: ahora + DURACION_SESION_SEG })).toString("base64url");
  return `v1.${cuerpo}.${firmar(cuerpo, secreto)}`;
}

/**
 * Valida firma y vencimiento. La cookie no guarda ningún dato sensible: solo
 * dice "esta sesión la emitió este servidor y todavía no venció".
 */
export function verificarSesion(token: string | undefined, secreto: string | undefined): boolean {
  if (!token || !secreto) return false;

  const partes = token.split(".");
  if (partes.length !== 3 || partes[0] !== "v1") return false;

  const [, cuerpo, firma] = partes;
  const esperada = Buffer.from(firmar(cuerpo, secreto));
  const recibida = Buffer.from(firma);
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return false;

  try {
    const payload = JSON.parse(Buffer.from(cuerpo, "base64url").toString());
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
