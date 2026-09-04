"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ESTADOS_PEDIDO } from "@/lib/constants";
import { formatPrecio } from "@/lib/utils";

interface PedidoItem {
  id: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  producto: { nombre: string };
}

interface Pedido {
  id: number;
  numero: string;
  proveedorId: number;
  proveedor: { id: number; nombre: string };
  estado: string;
  total: number;
  notas: string;
  createdAt: string;
  items: PedidoItem[];
}

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
}

interface Proveedor {
  id: number;
  nombre: string;
}

interface CartItem {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

const ESTADO_KEYS = Object.keys(ESTADOS_PEDIDO) as (keyof typeof ESTADOS_PEDIDO)[];
const ESTADO_FLOW: Record<string, string[]> = {
  PENDIENTE: ["EN_PREPARACION"],
  EN_PREPARACION: ["LISTO"],
  LISTO: ["ENTREGADO"],
  ENTREGADO: [],
};

export default function PedidosPage() {
  const toast = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [notas, setNotas] = useState("");
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [prodSearch, setProdSearch] = useState("");

  const [detailPedido, setDetailPedido] = useState<Pedido | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNum, setDeleteNum] = useState("");

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (estadoFilter !== "Todos") params.set("estado", estadoFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/pedidos?${params}`);
    const data = await res.json();
    setPedidos(data);
    setLoading(false);
  }, [estadoFilter, search]);

  useEffect(() => { fetchPedidos() }, [fetchPedidos]);

  const openNewPedido = async () => {
    setCart([]);
    setProveedorId(null);
    setNotas("");
    setProdSearch("");
    const [prodRes, provRes] = await Promise.all([
      fetch("/api/productos"),
      fetch("/api/proveedores"),
    ]);
    setProductos(await prodRes.json());
    setProveedores(await provRes.json());
    setShowNew(true);
  };

  const addToCart = (p: Producto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productoId === p.id);
      if (existing) {
        return prev.map((i) => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 }];
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

  const handleCreatePedido = async () => {
    if (cart.length === 0 || !proveedorId) return;
    await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proveedorId,
        notas,
        items: cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitario: i.precio })),
      }),
    });
    toast("Pedido creado");
    setShowNew(false);
    fetchPedidos();
  };

  const handleChangeEstado = async (pedido: Pedido, nuevoEstado: string) => {
    await fetch(`/api/pedidos/${pedido.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    const estadoInfo = ESTADOS_PEDIDO[nuevoEstado as keyof typeof ESTADOS_PEDIDO];
    toast(`${pedido.numero} → ${estadoInfo.label}`);
    fetchPedidos();
    if (detailPedido?.id === pedido.id) {
      setDetailPedido({ ...pedido, estado: nuevoEstado });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/pedidos/${deleteId}`, { method: "DELETE" });
    toast("Pedido eliminado");
    setDeleteId(null);
    setDeleteNum("");
    fetchPedidos();
  };

  const filteredProds = productos.filter((p) =>
    p.nombre.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const formatFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getEstadoInfo = (estado: string) => {
    return ESTADOS_PEDIDO[estado as keyof typeof ESTADOS_PEDIDO] ?? { label: estado, color: "muted" };
  };

  return (
    <>
      {/* Toolbar */}
      <div className="sec-bar">
        <div className="srch" style={{ minWidth: 240 }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="14" y2="14" />
          </svg>
          <input type="text" placeholder="Buscar por N° o proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-p" onClick={openNewPedido}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" /></svg>
          Nuevo pedido
        </button>
      </div>

      {/* Status filters */}
      <div className="filter-bar">
        <button onClick={() => setEstadoFilter("Todos")} className={`fchip ${estadoFilter === "Todos" ? "active" : ""}`}>Todos</button>
        {ESTADO_KEYS.map((key) => (
          <button key={key} onClick={() => setEstadoFilter(key)} className={`fchip ${estadoFilter === key ? "active" : ""}`}>
            {ESTADOS_PEDIDO[key].label}
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
                <th>Proveedor</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="empty-msg">Cargando...</td></tr>
              ) : pedidos.length === 0 ? (
                <tr><td colSpan={7} className="empty-msg">No hay pedidos</td></tr>
              ) : (
                pedidos.map((p) => {
                  const ei = getEstadoInfo(p.estado);
                  const nextEstados = ESTADO_FLOW[p.estado] ?? [];
                  return (
                    <tr key={p.id}>
                      <td className="celda-titulo td-b">{p.numero}</td>
                      <td className="td-m" data-label="Fecha">{formatFecha(p.createdAt)}</td>
                      <td className="td-m" data-label="Proveedor">{p.proveedor.nombre}</td>
                      <td className="td-m" data-label="Items">{p.items.length} prod.</td>
                      <td className="td-n" data-label="Total">{formatPrecio(p.total)}</td>
                      <td data-label="Estado"><Badge variant={ei.color as "success" | "warning" | "info" | "muted"}>{ei.label}</Badge></td>
                      <td className="td-act" style={{ width: 100 }}>
                        {nextEstados.length > 0 && (
                          <button
                            className="act-btn"
                            onClick={() => handleChangeEstado(p, nextEstados[0])}
                            title={`Pasar a ${getEstadoInfo(nextEstados[0]).label}`}
                          >
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                          </button>
                        )}
                        <button className="act-btn" onClick={() => setDetailPedido(p)} title="Ver detalle">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 5v3h3" /></svg>
                        </button>
                        <button className="act-btn del" onClick={() => { setDeleteId(p.id); setDeleteNum(p.numero) }} title="Eliminar">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Pedido */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nuevo pedido a proveedor" wide
        footer={<>
          <span style={{ marginRight: "auto", fontWeight: 700, fontSize: 15 }}>Total: {formatPrecio(cartTotal)}</span>
          <button className="btn btn-o" onClick={() => setShowNew(false)}>Cancelar</button>
          <button className="btn btn-p" onClick={handleCreatePedido} disabled={cart.length === 0 || !proveedorId}>Crear pedido</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Proveedor</label>
            <select value={proveedorId ?? ""} onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Seleccionar proveedor...</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Notas</label>
          <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones del pedido (opcional)" />
        </div>

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

        {prodSearch && (
          <div style={{ maxHeight: 160, overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", marginBottom: 16 }}>
            <table>
              <tbody>
                {filteredProds.length === 0 ? (
                  <tr><td colSpan={4} className="empty-msg">Sin resultados</td></tr>
                ) : (
                  filteredProds.slice(0, 8).map((p) => (
                    <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => { addToCart(p); setProdSearch("") }}>
                      <td className="td-b">{p.nombre}</td>
                      <td className="td-m">{p.categoria}</td>
                      <td className="td-m">Stock: {p.stock}</td>
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
                      <input
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={(e) => updateQty(item.productoId, Number(e.target.value))}
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

      {/* Modal Detalle Pedido */}
      <Modal open={detailPedido !== null} onClose={() => setDetailPedido(null)} title={detailPedido ? `Pedido ${detailPedido.numero}` : ""}
        footer={<>
          {detailPedido && (ESTADO_FLOW[detailPedido.estado] ?? []).map((next) => (
            <button key={next} className="btn btn-accent" onClick={() => handleChangeEstado(detailPedido, next)}>
              Pasar a {getEstadoInfo(next).label}
            </button>
          ))}
          <button className="btn btn-o" onClick={() => setDetailPedido(null)}>Cerrar</button>
        </>}
      >
        {detailPedido && (
          <>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Proveedor</label>
                <p style={{ fontSize: 13 }}>{detailPedido.proveedor.nombre}</p>
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <p style={{ fontSize: 13 }}>{formatFecha(detailPedido.createdAt)}</p>
              </div>
              <div className="form-group">
                <label>Estado</label>
                <p><Badge variant={getEstadoInfo(detailPedido.estado).color as "success" | "warning" | "info" | "muted"}>{getEstadoInfo(detailPedido.estado).label}</Badge></p>
              </div>
            </div>
            {detailPedido.notas && (
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Notas</label>
                <p style={{ fontSize: 13, color: "var(--color-text-2)" }}>{detailPedido.notas}</p>
              </div>
            )}
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
                  {detailPedido.items.map((item) => (
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
              Total: {formatPrecio(detailPedido.total)}
            </div>
          </>
        )}
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal open={deleteId !== null} onClose={() => { setDeleteId(null); setDeleteNum("") }} title="Eliminar pedido"
        footer={<>
          <button className="btn btn-o" onClick={() => { setDeleteId(null); setDeleteNum("") }}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
        </>}
      >
        <p style={{ fontSize: 13, color: "var(--color-text-2)" }}>
          ¿Estás seguro de que querés eliminar el pedido <strong>{deleteNum}</strong>?
        </p>
      </Modal>
    </>
  );
}
