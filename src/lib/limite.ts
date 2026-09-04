/**
 * Freno de intentos de login.
 *
 * En Vercel cada pedido puede caer en una instancia distinta y efímera, así que
 * un contador en memoria no sirve: no se comparte ni sobrevive. Si hay Upstash
 * configurado el conteo va a Redis; si no, se usa el contador local, que alcanza
 * en desarrollo y en un servidor único.
 *
 * Se habla con Upstash por su API REST para no sumar dependencias.
 */

const URL_REDIS = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_REDIS = process.env.UPSTASH_REDIS_REST_TOKEN;

export const MAX_INTENTOS = 8;
export const VENTANA_SEG = 15 * 60;

export function conRedis(): boolean {
  return Boolean(URL_REDIS && TOKEN_REDIS);
}

async function comando(...partes: (string | number)[]): Promise<unknown> {
  const res = await fetch(URL_REDIS as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN_REDIS}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(partes),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash respondió ${res.status}`);
  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

// Reserva para desarrollo y para un servidor único.
const memoria = new Map<string, { fallos: number; hasta: number }>();

function clave(ip: string) {
  return `login:fallos:${ip}`;
}

export async function estaBloqueado(ip: string): Promise<boolean> {
  if (conRedis()) {
    try {
      const valor = await comando("GET", clave(ip));
      return Number(valor ?? 0) >= MAX_INTENTOS;
    } catch (e) {
      // Si Redis no responde no dejamos a nadie afuera: el costo de scrypt
      // sigue siendo el freno de fondo. Queda registrado para poder verlo.
      console.error("[login] no se pudo consultar el límite:", e);
      return false;
    }
  }

  const reg = memoria.get(ip);
  if (!reg) return false;
  if (Date.now() > reg.hasta) {
    memoria.delete(ip);
    return false;
  }
  return reg.fallos >= MAX_INTENTOS;
}

export async function anotarFallo(ip: string): Promise<void> {
  if (conRedis()) {
    try {
      const total = Number(await comando("INCR", clave(ip)));
      // La ventana arranca con el primer fallo y no se renueva con los siguientes.
      if (total === 1) await comando("EXPIRE", clave(ip), VENTANA_SEG);
    } catch (e) {
      console.error("[login] no se pudo registrar el intento:", e);
    }
    return;
  }

  const reg = memoria.get(ip);
  if (!reg || Date.now() > reg.hasta) {
    memoria.set(ip, { fallos: 1, hasta: Date.now() + VENTANA_SEG * 1000 });
    return;
  }
  reg.fallos += 1;
}

export async function limpiarIntentos(ip: string): Promise<void> {
  if (conRedis()) {
    try {
      await comando("DEL", clave(ip));
    } catch (e) {
      console.error("[login] no se pudo limpiar el contador:", e);
    }
    return;
  }
  memoria.delete(ip);
}
