import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { haySesion } from "@/lib/guard";
import { formatPrecio } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats() {
  const totalProductos = await prisma.producto.count({ where: { activo: true } });
  const totalClientes = await prisma.cliente.count({ where: { activo: true } });
  const totalProveedores = await prisma.proveedor.count({ where: { activo: true } });

  const todosProductos = await prisma.producto.findMany({
    where: { activo: true, stockMinimo: { gt: 0 } },
    orderBy: { stock: "asc" },
  });

  const stockBajoAlerts = todosProductos.filter((p) => p.stock <= p.stockMinimo);

  return { totalProductos, bajosStock: stockBajoAlerts.length, totalClientes, totalProveedores, stockBajoAlerts: stockBajoAlerts.slice(0, 8) };
}

export default async function DashboardPage() {
  // Esta página consulta la base directamente, así que verifica por su cuenta.
  if (!(await haySesion())) redirect("/login");

  const stats = await getStats();

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Productos</span>
          <span className="kpi-value">{stats.totalProductos}</span>
          <span className="kpi-sub">activos en catálogo</span>
        </div>
        <div className="kpi-card warning">
          <span className="kpi-label">Stock bajo</span>
          <span className="kpi-value">{stats.bajosStock}</span>
          <span className="kpi-sub">productos por reponer</span>
        </div>
        <div className="kpi-card success">
          <span className="kpi-label">Clientes</span>
          <span className="kpi-value">{stats.totalClientes}</span>
          <span className="kpi-sub">registrados</span>
        </div>
        <div className="kpi-card accent">
          <span className="kpi-label">Proveedores</span>
          <span className="kpi-value">{stats.totalProveedores}</span>
          <span className="kpi-sub">activos</span>
        </div>
      </div>

      {stats.stockBajoAlerts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Alertas de stock</h3>
            <span className="td-m" style={{ fontSize: 12 }}>{stats.bajosStock} productos por reponer</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl-cards">
              <thead>
                <tr>
                  <th></th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock actual</th>
                  <th>Mínimo</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {stats.stockBajoAlerts.map((p) => (
                  <tr key={p.id}>
                    <td className="celda-oculta" style={{ width: 30 }}>
                      <span className={`alert-dot ${p.stock <= p.stockMinimo * 0.3 ? "red" : "yellow"}`} />
                    </td>
                    <td className="celda-titulo td-b">{p.nombre}</td>
                    <td className="td-m" data-label="Categoría">{p.categoria}</td>
                    <td data-label="Stock actual">{p.stock}</td>
                    <td className="td-m" data-label="Mínimo">{p.stockMinimo}</td>
                    <td className="td-n" data-label="Precio">{formatPrecio(p.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
