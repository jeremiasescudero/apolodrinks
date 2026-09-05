export function formatPrecio(n: number): string {
  return "$" + Math.abs(n).toLocaleString("es-AR");
}

export function stockStatus(stock: number, min: number) {
  if (min === 0) return { label: "Combo", variant: "muted" as const };
  if (stock <= min * 0.2) return { label: "Crítico", variant: "danger" as const };
  if (stock <= min) return { label: "Bajo", variant: "warning" as const };
  return { label: "OK", variant: "success" as const };
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Arma el link de WhatsApp para un teléfono argentino.
 * Acepta los formatos que se escriben a mano: "351-1234567", "0351 15 1234567",
 * "+54 9 351 1234567". Devuelve null si no hay dígitos suficientes.
 */
export function waLink(telefono: string, mensaje?: string): string | null {
  let d = telefono.replace(/\D/g, "").replace(/^00/, "");

  if (d.startsWith("54")) {
    d = d.slice(2).replace(/^9/, "");
  }
  d = d.replace(/^0/, "");

  // 351 15 1234567 -> 351 1234567 (el 15 sobra con el prefijo 9)
  const con15 = d.match(/^(\d{2,4})15(\d{6,8})$/);
  if (con15) d = con15[1] + con15[2];

  if (d.length < 8) return null;

  const url = `https://wa.me/549${d}`;
  return mensaje ? `${url}?text=${encodeURIComponent(mensaje)}` : url;
}

export function mapsLink(direccion: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion + ", Córdoba, Argentina")}`;
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatFechaLarga(fechaStr: string): string {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Ganancia de un producto. Devuelve null si no hay costo cargado: un costo en 0
 * significa "todavía no lo sé", no "me sale gratis", y mostrar 100% de margen
 * en 150 productos sin cargar sería mentira.
 */
export function ganancia(precio: number, costo: number): { pesos: number; margen: number } | null {
  if (costo <= 0) return null;
  const pesos = precio - costo;
  return { pesos, margen: precio > 0 ? (pesos / precio) * 100 : 0 };
}

/** formatPrecio usa Math.abs, así que para valores que pueden ser negativos hay que reponer el signo. */
export function formatPrecioConSigno(n: number): string {
  return (n < 0 ? "-" : "") + formatPrecio(n);
}
