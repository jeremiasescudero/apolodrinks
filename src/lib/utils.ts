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
