import { Skeleton, SkeletonFilas, SkeletonKpis } from "@/components/ui/Skeleton";

/**
 * Pantalla de carga del inicio.
 *
 * El inicio es el único componente de servidor que consulta la base, así que es
 * el único que se queda en blanco mientras espera. El resto de las secciones se
 * compilan estáticas y traen sus datos del lado del cliente, con su propio
 * skeleton adentro.
 */
export default function Loading() {
  return (
    <>
      <div className="kpi-grid">
        <SkeletonKpis cantidad={4} />
      </div>

      <div className="card">
        <div className="card-header">
          <Skeleton ancho={130} alto={13} />
          <Skeleton ancho={110} alto={11} />
        </div>
        <div className="tbl-wrap">
          <table className="tbl-cards">
            <tbody>
              <SkeletonFilas filas={6} columnas={6} />
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
