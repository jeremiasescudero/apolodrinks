"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import InputNumero from "@/components/ui/InputNumero";
import { SkeletonFilas } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { METODOS_PAGO } from "@/lib/constants";
import { formatPrecio } from "@/lib/utils";

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
  montoPago1: number;
  metodoPago2: string | null;
  montoPago2: number;
  total: number;
  createdAt: string;
  items: VentaItem[];
}

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
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
  const [dividir, setDividir] = useState(false);
  const [metodoPago2, setMetodoPago2] = useState("Transferencia");
  const [montoPago2, setMontoPago2] = useState(0);
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
    setMetodoPago("Efectivo");
    setDividir(false);
    setMetodoPago2("Transferencia");
    setMontoPago2(0);
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
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1, stock: p.stock, esPromo: p.esPromo }];
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

  const cartTotal = cart.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  const handleCreateVenta = async () => {
    if (cart.length === 0) return;
    if (dividir && montoPago2 <= 0) { toast("Ingresá el monto del segundo pago"); return; }
    if (dividir && montoPago2 >= cartTotal) { toast("El segundo pago no puede ser igual o mayor al total"); return; }

    const payload: Record<string, unknown> = {
      clienteId,
      metodoPago,
      items: cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitario: i.precio })),
    };
    if (dividir) {
      payload.metodoPago2 = metodoPago2;
      payload.montoPago1 = cartTotal - montoPago2;
      payload.montoPago2 = montoPago2;
    }

    await fetch("/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    toast("Venta registrada");
    setShowNew(false);
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
                    <td className="celda-titulo td-b">{v.numero}</td>
                    <td className="td-m" data-label="Fecha">{formatFecha(v.createdAt)}</td>
                    <td className="td-m" data-label="Hora">{formatHora(v.createdAt)}</td>
                    <td className="td-m" data-label="Cliente">{v.cliente?.nombre || "—"}</td>
                    <td className="td-m" data-label="Items">{v.items.length} prod.</td>
                    <td data-label="Método">
                      <Badge variant={METODO_VARIANT[v.metodoPago] ?? "muted"}>{v.metodoPago}</Badge>
                      {v.metodoPago2 && (
                        <>
                          <span style={{ margin: "0 4px", fontSize: 10, color: "var(--color-text-3)" }}>+</span>
                          <Badge variant={METODO_VARIANT[v.metodoPago2] ?? "muted"}>{v.metodoPago2}</Badge>
                        </>
                      )}
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
            <label>{dividir ? "Método 1" : "Método de pago"}</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 8px" }}>
          <input
            type="checkbox"
            id="dividirPago"
            checked={dividir}
            onChange={(e) => { setDividir(e.target.checked); if (!e.target.checked) setMontoPago2(0); }}
            style={{ width: 16, height: 16, accentColor: "var(--color-primary)" }}
          />
          <label htmlFor="dividirPago" style={{ fontSize: 13, cursor: "pointer", color: "var(--color-text-1)" }}>
            Dividir en 2 métodos de pago
          </label>
        </div>

        {dividir && (
          <div className="form-row" style={{ padding: 12, background: "var(--color-surface-2)", borderRadius: 8, marginBottom: 8 }}>
            <div className="form-group" style={{ maxWidth: 180 }}>
              <label>Método 2</label>
              <select value={metodoPago2} onChange={(e) => setMetodoPago2(e.target.value)}>
                {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ maxWidth: 140 }}>
              <label>Monto método 2 ($)</label>
              <input type="number" value={montoPago2} onChange={(e) => setMontoPago2(Number(e.target.value))} min={0} max={cartTotal} />
            </div>
            {cartTotal > 0 && montoPago2 > 0 && montoPago2 < cartTotal && (
              <div className="form-group" style={{ maxWidth: 200 }}>
                <label>Resumen</label>
                <div style={{ fontSize: 12, color: "var(--color-text-2)", lineHeight: 1.6 }}>
                  {metodoPago}: {formatPrecio(cartTotal - montoPago2)}<br />
                  {metodoPago2}: {formatPrecio(montoPago2)}
                </div>
              </div>
            )}
          </div>
        )}

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
                    <td className="td-m">{formatPrecio(item.precio)}</td>
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
                <p style={{ fontSize: 13 }}>{detailVenta.cliente?.nombre || "Sin cliente"}</p>
              </div>
              <div className="form-group">
                <label>Método</label>
                {detailVenta.metodoPago2 ? (
                  <div style={{ fontSize: 13 }}>
                    {detailVenta.metodoPago}: {formatPrecio(detailVenta.montoPago1)}<br />
                    {detailVenta.metodoPago2}: {formatPrecio(detailVenta.montoPago2)}
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
