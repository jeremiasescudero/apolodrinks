export const CATEGORIAS = [
  "Cervezas",
  "Gaseosas",
  "Aguas",
  "Energizantes",
  "Fernet",
  "Vodka",
  "Gin",
  "Aperitivos",
  "Vinos",
  "Espumantes",
  "Promos",
] as const;

export const ESTADOS_PEDIDO = {
  PENDIENTE: { label: "Pendiente", color: "warning" },
  EN_PREPARACION: { label: "En preparación", color: "info" },
  LISTO: { label: "Listo", color: "success" },
  ENTREGADO: { label: "Entregado", color: "muted" },
} as const;

export const ESTADOS_ENCARGO = {
  PENDIENTE: { label: "Pendiente", color: "warning" },
  ENTREGADO: { label: "Entregado", color: "success" },
  CANCELADO: { label: "Cancelado", color: "muted" },
} as const;

export const METODOS_PAGO = [
  "Efectivo",
  "Transferencia",
  "Débito",
  "Crédito",
] as const;

export const TIPOS_CLIENTE = ["Particular", "Comercio"] as const;

export const REDONDEOS = [
  { label: "Sin redondeo", value: 0 },
  { label: "Redondear a $50", value: 50 },
  { label: "Redondear a $100", value: 100 },
  { label: "Redondear a $500", value: 500 },
] as const;
