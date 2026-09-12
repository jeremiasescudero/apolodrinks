/**
 * Cálculos de una venta, aislados de la UI y de la base para poder testearlos.
 *
 * El precio de venta es siempre por producto (`precioUnitario`). En una venta
 * minorista ese precio viene del producto; en una mayorista lo carga el usuario
 * a mano. En ambos casos el costo es el costo real del producto, congelado al
 * momento de vender: así la ganancia es la verdadera y no cambia si después se
 * actualiza el costo del producto.
 */

export interface LineaVenta {
  precioUnitario: number;
  costoUnitario: number;
  cantidad: number;
}

export interface ResumenLinea {
  venta: number;
  costo: number;
  ganancia: number;
  /** Ganancia sobre el precio de venta, en %. null si no se sabe el costo. */
  margen: number | null;
}

/** Totales de una línea del carrito a partir de su precio, costo y cantidad. */
export function calcularLinea(linea: LineaVenta): ResumenLinea {
  const venta = linea.precioUnitario * linea.cantidad;
  const costo = linea.costoUnitario * linea.cantidad;
  const ganancia = venta - costo;
  // costo 0 significa "no se sabe el costo", no "gratis": ahí el margen no se informa.
  const margen = linea.costoUnitario > 0 && venta > 0 ? (ganancia / venta) * 100 : null;
  return { venta, costo, ganancia, margen };
}

export interface ResumenVenta {
  totalVenta: number;
  totalCosto: number;
  ganancia: number;
  margen: number | null;
  /** Unidades cuyo costo no se conoce: su ganancia queda fuera del cálculo. */
  unidadesSinCosto: number;
}

/**
 * Totales de una venta entera. La ganancia sólo cuenta las unidades con costo
 * conocido; inventar la ganancia de las demás sería peor que no darla.
 */
export function resumenVenta(lineas: LineaVenta[]): ResumenVenta {
  let totalVenta = 0;
  let totalCosto = 0;
  let ganancia = 0;
  let ventaConCosto = 0;
  let unidadesSinCosto = 0;

  for (const linea of lineas) {
    totalVenta += linea.precioUnitario * linea.cantidad;
    if (linea.costoUnitario > 0) {
      totalCosto += linea.costoUnitario * linea.cantidad;
      ganancia += (linea.precioUnitario - linea.costoUnitario) * linea.cantidad;
      ventaConCosto += linea.precioUnitario * linea.cantidad;
    } else {
      unidadesSinCosto += linea.cantidad;
    }
  }

  const margen = ventaConCosto > 0 ? (ganancia / ventaConCosto) * 100 : null;
  return { totalVenta, totalCosto, ganancia, margen, unidadesSinCosto };
}
