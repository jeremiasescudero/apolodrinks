/**
 * Placeholders de carga.
 *
 * La idea es que la pantalla ya tenga la forma de lo que va a llegar, en vez de
 * un "Cargando..." que después empuja todo al aparecer el contenido. No llevan
 * "use client": son marcado puro y sirven igual en componentes de servidor.
 */

interface SkeletonProps {
  ancho?: string | number;
  alto?: number;
  radio?: number;
}

export function Skeleton({ ancho = "100%", alto = 12, radio = 6 }: SkeletonProps) {
  return <span className="sk" style={{ width: ancho, height: alto, borderRadius: radio }} aria-hidden="true" />;
}

/**
 * Filas de tabla. En escritorio se ven como filas; en celular las tablas del
 * listado ya se convierten en tarjetas, así que estas acompañan esa forma.
 */
export function SkeletonFilas({ filas = 6, columnas = 5 }: { filas?: number; columnas?: number }) {
  return (
    <>
      {Array.from({ length: filas }).map((_, f) => (
        <tr key={f} className="sk-fila">
          {Array.from({ length: columnas }).map((_, c) => (
            <td key={c}>
              {/* La primera columna es el nombre: se muestra más larga para que
                  el bloque no quede como una grilla perfecta y artificial. */}
              <Skeleton ancho={c === 0 ? "70%" : c === columnas - 1 ? 40 : "45%"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonKpis({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <>
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="kpi-card">
          <Skeleton ancho={70} alto={9} />
          <div style={{ margin: "8px 0 6px" }}><Skeleton ancho={110} alto={22} /></div>
          <Skeleton ancho={90} alto={9} />
        </div>
      ))}
    </>
  );
}

/** Bloque genérico, para tarjetas sueltas y modales. */
export function SkeletonBloque({ lineas = 3 }: { lineas?: number }) {
  return (
    <div className="sk-bloque">
      {Array.from({ length: lineas }).map((_, i) => (
        <Skeleton key={i} ancho={i === lineas - 1 ? "55%" : "100%"} />
      ))}
    </div>
  );
}

export default Skeleton;
