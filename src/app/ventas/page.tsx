"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import InputNumero, { aNumero } from "@/components/ui/InputNumero";
import { SkeletonFilas } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { METODOS_PAGO } from "@/lib/constants";
import { formatPrecio, formatPrecioConSigno } from "@/lib/utils";
import { resumenVenta } from "@/lib/venta";

interface VentaItem {
  id: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  producto: { nombre: string };
}

interface Venta {
  id: number;
  numero: string;
  clienteId: number | null;
  cliente: { id: number; nombre: string } | null;
  metodoPago: string;
  esMayorista?: boolean;
  pagos?: { metodoPago: string; monto: number }[];
  total: number;
  createdAt: string;
  items: VentaItem[];
}

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  costo: number;
  stock: number;
  esPromo: boolean;
}

interface Cliente {
  id: number;
  nombre: string;
}

interface CartItem {
  productoId: number;
  nombre: string;
  precio: number;
  costo: number;
  cantidad: number;
  stock: number;
  esPromo: boolean;
}

const METODO_VARIANT: Record<string, "success" | "info" | "warning" | "muted"> = {
  Efectivo: "success",
  Transferencia: "info",
  "Débito": "warning",
  "Crédito": "muted",
};

export default function VentasPage() {
  const toast = useToast();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [metodoFilter, setMetodoFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  // El camino rápido sigue siendo un solo método: la lista aparece recién al dividir.
  const [dividido, setDividido] = useState(false);
  // Venta mayorista: al activarla, el precio de cada ítem se carga a mano.
  const [esMayorista, setEsMayorista] = useState(false);
  const [pagos, setPagos] = useState<{ metodoPago: string; monto: string }[]>([]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [prodSearch, setProdSearch] = useState("");

  const [detailVenta, setDetailVenta] = useState<Venta | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNum, setDeleteNum] = useState("");

  const fetchVentas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (metodoFilter !== "Todos") params.set("metodo", metodoFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/ventas?${params}`);
    const data = await res.json();
    setVentas(data);
    setLoading(false);
  }, [metodoFilter, search]);

  useEffect(() => { fetchVentas() }, [fetchVentas]);

  const openNewSale = async () => {
    setCart([]);
    setDividido(false);
    setPagos([]);
    setEsMayorista(false);
    setMetodoPago("Efectivo");
    setClienteId(null);
    setProdSearch("");
    const [prodRes, cliRes] = await Promise.all([
      fetch("/api/productos"),
      fetch("/api/clientes"),
    ]);
    setProductos(await prodRes.json());
    setClientes(await cliRes.json());
    setShowNew(true);
  };

  const addToCart = (p: Producto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productoId === p.id);
      if (existing) {
        return prev.map((i) => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: p.precio, costo: p.costo, cantidad: 1, stock: p.stock, esPromo: p.esPromo }];
    });
  };

  const updateQty = (productoId: number, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productoId !== productoId));
    } else {
      setCart((prev) => prev.map((i) => i.productoId === productoId ? { ...i, cantidad: qty } : i));
    }
  };

  const removeFromCart = (productoId: number) => {
    setCart((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const updatePrecio = (productoId: number, precio: number) => {
    setCart((prev) => prev.map((i) => i.productoId === productoId ? { ...i, precio } : i));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  // Costo, venta y ganancia recalculados desde el precio actual del carrito.
  const resumen = resumenVenta(cart.map((i) => ({ precioUnitario: i.precio, costoUnitario: i.costo, cantidad: i.cantidad })));

  // Lo cobrado hasta ahora y lo que falta, para avisar antes de confirmar.
  const pagosNumericos = pagos.map((p) => ({ metodoPago: p.metodoPago, monto: aNumero(p.monto) }));
  const cobrado = pagosNumericos.reduce((s, p) => s + (Number.isNaN(p.monto) ? 0 : p.monto), 0);
  const falta = cartTotal - cobrado;

  const agregarPago = () => {
    const usados = new Set(pagos.map((p) => p.metodoPago));
    const libre = METODOS_PAGO.find((m) => !usados.has(m)) ?? METODOS_PAGO[0];
    // Se precarga con lo que falta: casi siempre es el monto que va.
    setPagos([...pagos, { metodoPago: libre, monto: falta > 0 ? String(falta) : "" }]);
  };

  const activarDividido = (activar: boolean) => {
    setDividido(activar);
    // Al dividir se arranca con el método ya elegido cubriendo todo; después se
    // baja ese monto y el resto queda a mano para el segundo pago.
    // Si todavía no hay productos, el monto arranca vacío en vez de "0", que
    // sería inválido y obligaría a borrarlo a mano.
    setPagos(activar ? [{ metodoPago, monto: cartTotal > 0 ? String(cartTotal) : "" }] : []);
  };

  const handleCreateVenta = async () => {
    if (cart.length === 0) return;

    if (dividido) {
      if (pagosNumericos.some((p) => Number.isNaN(p.monto) || p.monto <= 0)) {
        toast("Todos los pagos tienen que tener un monto mayor a cero", "error");
        return;
      }
      if (new Set(pagos.map((p) => p.metodoPago)).size !== pagos.length) {
        toast("Hay un método de pago repetido", "error");
        return;
      }
      if (falta !== 0) {
        toast(falta > 0 ? `Faltan ${formatPrecio(falta)} por cobrar` : `Los pagos superan el total en ${formatPrecio(-falta)}`, "error");
        return;
      }
    }

    const res = await fetch("/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        metodoPago,
        pagos: dividido ? pagosNumericos : [{ metodoPago, monto: cartTotal }],
        esMayorista,
        items: cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitario: i.precio })),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error ?? "No se pudo registrar la venta", "error");
      return;
    }
    toast("Venta registrada");
    setShowNew(false);
    setDividido(false);
    setPagos([]);
    fetchVentas();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/ventas/${deleteId}`, { method: "DELETE" });
    toast("Venta anulada (stock restaurado)");
    setDeleteId(null);
    setDeleteNum("");
    fetchVentas();
  };

  const filteredProds = productos.filter((p) => {
    const q = prodSearch.toLowerCase();
    return (p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)) && (p.esPromo || p.stock > 0);
  });

  const formatFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatHora = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Toolbar */}
      <div className="sec-bar">
        <div className="srch" style={{ minWidth: 240 }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="14" y2="14" />
          </svg>
          <input type="text" placeholder="Buscar por N° venta..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-p" onClick={openNewSale}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" /></svg>
          Nueva venta
        </button>
      </div>

      {/* Payment method filters */}
      <div className="filter-bar">
        {["Todos", ...METODOS_PAGO].map((m) => (
          <button key={m} onClick={() => setMetodoFilter(m)} className={`fchip ${metodoFilter === m ? "active" : ""}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl-cards">
            <thead>
              <tr>
                <th>N°</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Método</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonFilas filas={6} columnas={8} />
              ) : ventas.length === 0 ? (
                <tr><td colSpan={8} className="empty-msg">No hay ventas registradas</td></tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id}>
                    <td className="celda-titulo td-b">
                      {v.numero}
                      {v.esMayorista && <Badge variant="info" style={{ marginLeft: 8, fontSize: 10 }}>Mayorista</Badge>}
                    </td>
                    <td className="td-m" data-label="Fecha">{formatFecha(v.createdAt)}</td>
                    <td className="td-m" data-label="Hora">{formatHora(v.createdAt)}</td>
                    <td className="td-m" data-label="Cliente">{v.cliente?.nombre || "—"}</td>
                    <td className="td-m" data-label="Items">{v.items.length} prod.</td>
                    <td data-label="Método">
                      {/* Un badge por cada medio de pago: una venta mixta muestra los dos. */}
                      {(v.pagos?.length ? v.pagos : [{ metodoPago: v.metodoPago, monto: v.total }]).map((pago, i) => (
                        <span key={i}>
                          {i > 0 && <span style={{ margin: "0 4px", fontSize: 10, color: "var(--color-text-3)" }}>+</span>}
                          <Badge variant={METODO_VARIANT[pago.metodoPago] ?? "muted"}>{pago.metodoPago}</Badge>
                        </span>
                      ))}
                    </td>
                    <td className="td-n" data-label="Total">{formatPrecio(v.total)}</td>
                    <td className="td-act">
                      <button className="act-btn" onClick={() => setDetailVenta(v)} title="Ver detalle">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 5v3h3" /></svg>
                      </button>
                      <button className="act-btn del" onClick={() => { setDeleteId(v.id); setDeleteNum(v.numero) }} title="Anular">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Venta */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nueva venta" wide
        footer={<>
          <span style={{ marginRight: "auto", fontWeight: 700, fontSize: 15 }}>Total: {formatPrecio(cartTotal)}</span>
          <button className="btn btn-o" onClick={() => setShowNew(false)}>Cancelar</button>
          <button className="btn btn-p" onClick={handleCreateVenta} disabled={cart.length === 0}>Confirmar venta</button>
        </>}
      >
        {/* Client + Payment */}
        <div className="form-row">
          <div className="form-group">
            <label>Cliente (opcional)</label>
            <select value={clienteId ?? ""} onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Sin cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ maxWidth: 180 }}>
            <label>Método de pago</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} disabled={dividido}>
              {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <label className="check-inline" style={{ marginBottom: dividido ? 12 : 0 }}>
          <input type="checkbox" checked={dividido} onChange={(e) => activarDividido(e.target.checked)} />
          Dividir en varios pagos
        </label>

        {dividido && (
          <div className="pagos-lista">
            {pagos.map((p, i) => (
              <div key={i} className="pago-fila">
                <select
                  value={p.metodoPago}
                  onChange={(e) => setPagos(pagos.map((x, j) => (j === i ? { ...x, metodoPago: e.target.value } : x)))}
                >
                  {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <InputNumero
                  value={p.monto}
                  onChange={(v) => setPagos(pagos.map((x, j) => (j === i ? { ...x, monto: v } : x)))}
                  maxDigitos={9}
                  placeholder="Monto"
                  aria-label={`Monto en ${p.metodoPago}`}
                />
                <button
                  className="act-btn del"
                  onClick={() => setPagos(pagos.filter((_, j) => j !== i))}
                  disabled={pagos.length === 1}
                  title={pagos.length === 1 ? "Tiene que quedar al menos un pago" : "Quitar"}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" /></svg>
                </button>
              </div>
            ))}

            <div className="pagos-pie">
              <button
                className="btn btn-o"
                onClick={agregarPago}
                disabled={pagos.length >= METODOS_PAGO.length}
                title={pagos.length >= METODOS_PAGO.length ? "Ya están todos los métodos" : ""}
              >
                + Agregar pago
              </button>
              <span className={falta === 0 ? "pagos-ok" : "pagos-falta"}>
                {falta === 0
                  ? "Cubre el total"
                  : falta > 0
                    ? `Falta ${formatPrecio(falta)}`
                    : `Sobra ${formatPrecio(-falta)}`}
              </span>
            </div>
          </div>
        )}

        <label className="check-inline" style={{ marginBottom: 12 }}>
          <input type="checkbox" checked={esMayorista} onChange={(e) => setEsMayorista(e.target.checked)} />
          Es venta mayorista (cargar el precio a mano)
        </label>

        {/* Product Search */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-2)", display: "block", marginBottom: 4 }}>Agregar productos</label>
          <div className="srch" style={{ width: "100%" }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="14" y2="14" />
            </svg>
            <input type="text" placeholder="Buscar producto..." value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} />
          </div>
        </div>

        {/* Product Results */}
        {prodSearch && (
          <div style={{ maxHeight: 160, overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", marginBottom: 16 }}>
            <table>
              <tbody>
                {filteredProds.length === 0 ? (
                  <tr><td colSpan={4} className="empty-msg">Sin resultados</td></tr>
                ) : (
                  filteredProds.map((p) => (
                    <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => { addToCart(p); setProdSearch("") }}>
                      <td className="td-b">
                        {p.nombre}
                        {p.esPromo && <Badge variant="info" style={{ marginLeft: 6, fontSize: 10 }}>Promo</Badge>}
                      </td>
                      <td className="td-m">{p.categoria}</td>
                      <td className="td-m">{p.esPromo ? "—" : `Stock: ${p.stock}`}</td>
                      <td className="td-n">{formatPrecio(p.precio)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Cart */}
        {cart.length > 0 && (
          <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ width: 80 }}>Cant.</th>
                  <th>P. unit.</th>
                  <th>Subtotal</th>
                  <th style={{ width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.productoId}>
                    <td className="td-b">{item.nombre}</td>
                    <td>
                      <InputNumero
                        value={String(item.cantidad)}
                        onChange={(v) => updateQty(item.productoId, Math.max(1, Number(v || 1)))}
                        maxDigitos={4}
                        aria-label={`Cantidad de ${item.nombre}`}
                        style={{ width: 60, padding: "4px 6px", fontSize: 13, border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontFamily: "inherit", textAlign: "center" }}
                      />
                    </td>
                    <td className="td-m">
                      {esMayorista ? (
                        <InputNumero
                          value={String(item.precio)}
                          onChange={(v) => updatePrecio(item.productoId, Number(v || 0))}
                          maxDigitos={9}
                          aria-label={`Precio de ${item.nombre}`}
                          style={{ width: 90, padding: "4px 6px", fontSize: 13, border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontFamily: "inherit", textAlign: "right" }}
                        />
                      ) : (
                        formatPrecio(item.precio)
                      )}
                    </td>
                    <td className="td-n">{formatPrecio(item.precio * item.cantidad)}</td>
                    <td>
                      <button className="act-btn del" onClick={() => removeFromCart(item.productoId)} title="Quitar">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* En una venta mayorista se ve la cuenta: costo, venta y ganancia con
            el precio cargado a mano. El costo es el real de cada producto. */}
        {esMayorista && cart.length > 0 && (
          <div className="resumen-mayorista">
            <div>
              <span className="rm-label">Costo</span>
              <span className="rm-valor">{formatPrecio(resumen.totalCosto)}</span>
            </div>
            <div>
              <span className="rm-label">Venta</span>
              <span className="rm-valor">{formatPrecio(resumen.totalVenta)}</span>
            </div>
            <div>
              <span className="rm-label">Ganancia</span>
              <span className={`rm-valor ${resumen.ganancia < 0 ? "gan-neg" : "gan-pos"}`}>
                {formatPrecioConSigno(resumen.ganancia)}
                {resumen.margen !== null && <small> · {resumen.margen.toFixed(0)}%</small>}
              </span>
            </div>
            {resumen.unidadesSinCosto > 0 && (
              <p className="rm-nota">{resumen.unidadesSinCosto} u. sin costo cargado quedan fuera de la ganancia.</p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Detalle Venta */}
      <Modal open={detailVenta !== null} onClose={() => setDetailVenta(null)} title={detailVenta ? `Detalle ${detailVenta.numero}` : ""}
        footer={<button className="btn btn-o" onClick={() => setDetailVenta(null)}>Cerrar</button>}
      >
        {detailVenta && (
          <>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Cliente</label>
                <p style={{ fontSize: 13 }}>
                  {detailVenta.cliente?.nombre || "Sin cliente"}
                  {detailVenta.esMayorista && <Badge variant="info" style={{ marginLeft: 8, fontSize: 10 }}>Mayorista</Badge>}
                </p>
              </div>
              <div className="form-group">
                <label>Método</label>
                {detailVenta.pagos && detailVenta.pagos.length > 1 ? (
                  <div style={{ fontSize: 13 }}>
                    {detailVenta.pagos.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span>{p.metodoPago}</span>
                        <strong>{formatPrecio(p.monto)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13 }}>{detailVenta.metodoPago}</p>
                )}
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <p style={{ fontSize: 13 }}>{formatFecha(detailVenta.createdAt)} {formatHora(detailVenta.createdAt)}</p>
              </div>
            </div>
            <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>P. unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detailVenta.items.map((item) => (
                    <tr key={item.id}>
                      <td className="td-b">{item.producto.nombre}</td>
                      <td>{item.cantidad}</td>
                      <td className="td-m">{formatPrecio(item.precioUnitario)}</td>
                      <td className="td-n">{formatPrecio(item.precioUnitario * item.cantidad)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: "right", marginTop: 12, fontSize: 16, fontWeight: 700 }}>
              Total: {formatPrecio(detailVenta.total)}
            </div>
          </>
        )}
      </Modal>

      {/* Modal Confirmar Anulación */}
      <Modal open={deleteId !== null} onClose={() => { setDeleteId(null); setDeleteNum("") }} title="Anular venta"
        footer={<>
          <button className="btn btn-o" onClick={() => { setDeleteId(null); setDeleteNum("") }}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleDelete}>Anular venta</button>
        </>}
      >
        <p style={{ fontSize: 13, color: "var(--color-text-2)" }}>
          ¿Estás seguro de que querés anular la venta <strong>{deleteNum}</strong>? Se restaurará el stock de los productos.
        </p>
      </Modal>
    </>
  );
}
