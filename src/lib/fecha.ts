/**
 * Fechas del negocio, independientes de dónde corra el servidor.
 *
 * El problema que resuelve: en Vercel el servidor corre en UTC. Después de las
 * 21:00 de Argentina, para el servidor ya es el día siguiente. Una caja abierta
 * a las 21:30 se guardaba con la fecha de mañana, y la pantalla —que pregunta
 * por el hoy del navegador— no la encontraba nunca.
 *
 * La regla: el día lo define el negocio en Córdoba, no el reloj del servidor.
 */

export const ZONA_NEGOCIO = "America/Argentina/Cordoba";

/** Hoy en el negocio, como "YYYY-MM-DD". "en-CA" formatea justo así. */
export function hoyEnNegocio(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_NEGOCIO }).format(new Date());
}

/**
 * Convierte "YYYY-MM-DD" en el instante que representa ese día.
 *
 * Usa el mediodía UTC a propósito: guardar la medianoche haría que el mismo
 * registro se lea como el día anterior en cualquier zona al oeste de Greenwich
 * —que es justo lo que pasaba—. Al mediodía, la fecha del calendario es la
 * misma en todo el mundo habitado.
 */
export function aDiaUTC(fecha: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** Cuánto se corre la zona respecto de UTC, en minutos, para ese instante. */
function desfasajeMinutos(instante: Date, zona: string): number {
  const enZona = new Date(instante.toLocaleString("en-US", { timeZone: zona }));
  const enUTC = new Date(instante.toLocaleString("en-US", { timeZone: "UTC" }));
  return (enZona.getTime() - enUTC.getTime()) / 60000;
}

/**
 * Principio y fin de un día del negocio como instantes reales, para filtrar
 * campos de tipo momento (por ejemplo `createdAt` de las ventas).
 *
 * Sin esto, una venta hecha a las 22:00 en Córdoba caía en el día siguiente y
 * quedaba fuera del cierre de caja.
 */
export function rangoDelDia(fecha: string): { desde: Date; hasta: Date } {
  const [y, m, d] = fecha.split("-").map(Number);
  const tentativo = Date.UTC(y, m - 1, d, 0, 0, 0);
  // El desfasaje se calcula sobre ese mismo día por si alguna vez vuelve el horario de verano.
  const off = desfasajeMinutos(new Date(tentativo), ZONA_NEGOCIO);
  const desde = new Date(tentativo - off * 60000);
  return { desde, hasta: new Date(desde.getTime() + 24 * 60 * 60 * 1000) };
}

/** Valida el formato "YYYY-MM-DD" y que sea una fecha real. */
export function esFechaValida(fecha: unknown): fecha is string {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [y, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
