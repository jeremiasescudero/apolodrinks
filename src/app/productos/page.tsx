"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { CATEGORIAS, REDONDEOS } from "@/lib/constants";
import { formatPrecio, formatPrecioConSigno, ganancia, stockStatus } from "@/lib/utils";

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  costo: number;
  stock: number;
  stockMinimo: number;
  esPromo: boolean;
}

interface Componente {
  productoId: number;
  cantidad: number;
  producto: { id: number; nombre: string; categoria: string; stock: number };
}

const EMPTY_FORM = { nombre: "", categoria: "Cervezas", precio: 0, costo: 0, stock: 0, stockMinimo: 0, esPromo: false };

export default function ProductosPage() {
  const toast = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [compSearch, setCompSearch] = useState("");
  const [compResults, setCompResults] = useState<Producto[]>([]);

  const [showPrecios, setShowPrecios] = useState(false);
  const [precioCat, setPrecioCat] = useState("Cervezas");
  const [porcentaje, setPorcentaje] = useState(10);
  const [redondeo, setRedondeo] = useState(0);
  const [precioProducts, setPrecioProducts] = useState<Producto[]>([]);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (catFilter !== "Todos") params.set("categoria", catFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/productos?${params}`);
    const data = await res.json();
    setProductos(data);
    setLoading(false);
  }, [catFilter, search]);

  useEffect(() => { fetchProductos() }, [fetchProductos]);

  useEffect(() => {
    if (!compSearch || compSearch.length < 2) { setCompResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/productos?search=${encodeURIComponent(compSearch)}`);
      const data: Producto[] = await res.json();
      const usedIds = new Set(componentes.map((c) => c.productoId));
      setCompResults(data.filter((p) => !p.esPromo && !usedIds.has(p.id) && p.id !== editingId));
    }, 250);
    return () => clearTimeout(t);
  }, [compSearch, componentes, editingId]);

  const handleSave = async () => {
    const url = editingId ? `/api/productos/${editingId}` : "/api/productos";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const saved = await res.json();
    const prodId = editingId || saved.id;

    if (form.esPromo) {
      await fetch(`/api/productos/${prodId}/componentes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(componentes.map((c) => ({ productoId: c.productoId, cantidad: c.cantidad }))),
      });
    }

    toast(editingId ? "Producto actualizado" : "Producto creado");
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setComponentes([]);
    fetchProductos();
  };

  const handleEdit = async (p: Producto) => {
    setForm({ nombre: p.nombre, categoria: p.categoria, precio: p.precio, costo: p.costo, stock: p.stock, stockMinimo: p.stockMinimo, esPromo: p.esPromo });
    setEditingId(p.id);
    setComponentes([]);
    setCompSearch("");
    setCompResults([]);

    if (p.esPromo) {
      const res = await fetch(`/api/productos/${p.id}/componentes`);
      const data = await res.json();
      setComponentes(data);
    }

    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/productos/${deleteId}`, { method: "DELETE" });
    toast("Producto eliminado");
    setDeleteId(null);
    fetchProductos();
  };

  const handlePreciosUpdate = async () => {
    await fetch("/api/precios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoria: precioCat, porcentaje, redondeo }) });
    toast(`Precios de ${precioCat} actualizados`);
    setShowPrecios(false);
    fetchProductos();
  };

  useEffect(() => {
    if (!showPrecios) return;
    fetch(`/api/productos?categoria=${precioCat}`).then((r) => r.json()).then(setPrecioProducts);
  }, [showPrecios, precioCat]);

  const previewPrecios = precioProducts.map((p) => {
    let np = Math.round(p.precio * (1 + porcentaje / 100));
    if (redondeo > 0) np = Math.round(np / redondeo) * redondeo;
    return { ...p, nuevoPrecio: np, diff: np - p.precio };
  });

  const addComponente = (p: Producto) => {
    setComponentes([...componentes, { productoId: p.id, cantidad: 1, producto: { id: p.id, nombre: p.nombre, categoria: p.categoria, stock: p.stock } }]);
    setCompSearch("");
    setCompResults([]);
  };

  const updateCompCantidad = (productoId: number, cantidad: number) => {
    setComponentes(componentes.map((c) => c.productoId === productoId ? { ...c, cantidad: Math.max(1, cantidad) } : c));
  };

  const removeComponente = (productoId: number) => {
    setComponentes(componentes.filter((c) => c.productoId !== productoId));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setComponentes([]);
    setCompSearch("");
    setCompResults([]);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="sec-bar">
        <div className="srch" style={{ minWidth: 240 }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="14" y2="14" />
          </svg>
          <input type="text" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-accent" onClick={() => { setPrecioCat(catFilter !== "Todos" ? catFilter : "Cervezas"); setShowPrecios(true) }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 2v12M5 5l3-3 3 3M5 11l3 3 3-3" /></svg>
            Actualizar precios
          </button>
          <button className="btn btn-p" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setComponentes([]); setShowForm(true) }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" /></svg>
            Agregar
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="filter-bar" style={{ overflowX: "auto", flexWrap: "nowrap", paddingBottom: 4 }}>
        {["Todos", ...CATEGORIAS].map((cat) => (
          <button key={cat} onClick={() => setCatFilter(cat)} className={`fchip ${catFilter === cat ? "active" : ""}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl-cards">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Mín</th>
                <th>Precio unit.</th>
                <th>Ganancia</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="empty-msg">Cargando...</td></tr>
              ) : productos.length === 0 ? (
                <tr><td colSpan={8} className="empty-msg">No se encontraron productos</td></tr>
              ) : (
                productos.map((p) => {
                  const status = stockStatus(p.stock, p.stockMinimo);
                  return (
                    <tr key={p.id}>
                      <td className="celda-titulo td-b">
                        {p.nombre}
                        {p.esPromo && <Badge variant="info" style={{ marginLeft: 8, fontSize: 10 }}>Promo</Badge>}
                      </td>
                      <td className="td-m" data-label="Categoría">{p.categoria}</td>
                      <td data-label="Stock">{p.esPromo ? "—" : (p.stockMinimo === 0 ? "—" : p.stock)}</td>
                      <td className="td-m" data-label="Mínimo">{p.esPromo ? "—" : (p.stockMinimo === 0 ? "—" : p.stockMinimo)}</td>
                      <td className="td-n" data-label="Precio">{formatPrecio(p.precio)}</td>
                      <td data-label="Ganancia">{(() => {
                        const g = ganancia(p.precio, p.costo);
                        if (!g) return <span className="td-m">—</span>;
                        return (
                          <span className={g.pesos < 0 ? "gan-neg" : "gan-pos"}>
                            {formatPrecioConSigno(g.pesos)}
                            <small>{g.margen.toFixed(0)}%</small>
                          </span>
                        );
                      })()}</td>
                      <td data-label="Estado">
                        {p.esPromo
                          ? <Badge variant="info">Promo</Badge>
                          : <Badge variant={status.variant}>{status.label}</Badge>
                        }
                      </td>
                      <td className="td-act">
                        <button className="act-btn" onClick={() => handleEdit(p)} title="Editar">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" /></svg>
                        </button>
                        <button className="act-btn del" onClick={() => setDeleteId(p.id)} title="Eliminar">
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

      {/* Modal Nuevo/Editar */}
      <Modal open={showForm} onClose={closeForm} title={editingId ? "Editar producto" : "Nuevo producto"} wide={form.esPromo}
        footer={<>
          <button className="btn btn-o" onClick={closeForm}>Cancelar</button>
          <button className="btn btn-p" onClick={handleSave}>{editingId ? "Guardar cambios" : "Crear producto"}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Heineken 1L" />
          </div>
          <div className="form-group" style={{ maxWidth: 180 }}>
            <label>Categoría</label>
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Precio de venta ($)</label>
            <input type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Precio de costo ($)</label>
            <input type="number" value={form.costo} onChange={(e) => setForm({ ...form, costo: Number(e.target.value) })} />
          </div>
          {!form.esPromo && (
            <>
              <div className="form-group">
                <label>Stock</label>
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Stock mínimo</label>
                <input type="number" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })} />
              </div>
            </>
          )}
        </div>

        {/* La cuenta a la vista mientras tipea: es el dato que pidió el cliente. */}
        {(() => {
          const g = ganancia(form.precio, form.costo);
          if (!g) {
            return <p className="gan-hint td-m">Cargá el precio de costo para ver cuánto te deja este producto.</p>;
          }
          return (
            <p className="gan-hint">
              Ganancia por unidad:{" "}
              <strong className={g.pesos < 0 ? "gan-neg" : "gan-pos"}>{formatPrecioConSigno(g.pesos)}</strong>
              {" · "}margen{" "}
              <strong className={g.pesos < 0 ? "gan-neg" : "gan-pos"}>{g.margen.toFixed(1)}%</strong>
              {g.pesos < 0 && <span className="gan-neg"> — lo estás vendiendo por debajo del costo</span>}
            </p>
          );
        })()}

        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 4px" }}>
          <input
            type="checkbox"
            id="esPromo"
            checked={form.esPromo}
            onChange={(e) => {
              const checked = e.target.checked;
              setForm({ ...form, esPromo: checked, stock: checked ? 0 : form.stock, stockMinimo: checked ? 0 : form.stockMinimo });
              if (!checked) setComponentes([]);
            }}
            style={{ width: 16, height: 16, accentColor: "var(--color-primary)" }}
          />
          <label htmlFor="esPromo" style={{ fontSize: 13, cursor: "pointer", color: "var(--color-text-1)" }}>
            Es una promo (descuenta stock de productos individuales)
          </label>
        </div>

        {form.esPromo && (
          <div style={{ marginTop: 12, borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-1)", marginBottom: 8 }}>
              Productos que componen esta promo
            </div>

            {componentes.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {componentes.map((c) => (
                  <div key={c.productoId} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 10px", borderRadius: 8,
                    background: "var(--color-surface-2)", fontSize: 13,
                  }}>
                    <span style={{ flex: 1, color: "var(--color-text-1)" }}>
                      {c.producto.nombre}
                      <span style={{ color: "var(--color-text-3)", marginLeft: 6, fontSize: 11 }}>
                        {c.producto.categoria}
                      </span>
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => updateCompCantidad(c.productoId, c.cantidad - 1)}
                        style={{
                          width: 24, height: 24, borderRadius: 6, border: "1px solid var(--color-border)",
                          background: "var(--color-surface-1)", cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--color-text-2)",
                        }}
                      >-</button>
                      <input
                        type="number"
                        value={c.cantidad}
                        onChange={(e) => updateCompCantidad(c.productoId, Number(e.target.value))}
                        style={{
                          width: 44, textAlign: "center", padding: "2px 4px", borderRadius: 6,
                          border: "1px solid var(--color-border)", background: "var(--color-surface-1)",
                          fontSize: 13, color: "var(--color-text-1)",
                        }}
                        min={1}
                      />
                      <button
                        type="button"
                        onClick={() => updateCompCantidad(c.productoId, c.cantidad + 1)}
                        style={{
                          width: 24, height: 24, borderRadius: 6, border: "1px solid var(--color-border)",
                          background: "var(--color-surface-1)", cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--color-text-2)",
                        }}
                      >+</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeComponente(c.productoId)}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: "none",
                        background: "transparent", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", color: "var(--color-danger)",
                      }}
                      title="Quitar"
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ position: "relative" }}>
              <div className="srch" style={{ width: "100%" }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="14" y2="14" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar producto para agregar..."
                  value={compSearch}
                  onChange={(e) => setCompSearch(e.target.value)}
                />
              </div>
              {compResults.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "var(--color-surface-1)", border: "1px solid var(--color-border)",
                  borderRadius: 8, maxHeight: 200, overflowY: "auto", marginTop: 4,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}>
                  {compResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addComponente(p)}
                      style={{
                        display: "flex", width: "100%", padding: "8px 12px",
                        border: "none", background: "transparent", cursor: "pointer",
                        alignItems: "center", gap: 8, fontSize: 13,
                        color: "var(--color-text-1)", textAlign: "left",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-surface-2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ flex: 1 }}>{p.nombre}</span>
                      <span style={{ color: "var(--color-text-3)", fontSize: 11 }}>{p.categoria}</span>
                      <span style={{ color: "var(--color-text-3)", fontSize: 11 }}>Stock: {p.stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {componentes.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 8 }}>
                Agregá los productos que componen esta promo. Al vender la promo, se descontará el stock de cada componente.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Eliminar producto"
        footer={<>
          <button className="btn btn-o" onClick={() => setDeleteId(null)}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
        </>}
      >
        <p style={{ fontSize: 13, color: "var(--color-text-2)" }}>
          ¿Estás seguro de que querés eliminar este producto? Esta acción se puede revertir.
        </p>
      </Modal>

      {/* Modal Actualizar Precios */}
      <Modal open={showPrecios} onClose={() => setShowPrecios(false)} title="Actualizar precios por categoría" wide
        footer={<>
          <button className="btn btn-o" onClick={() => setShowPrecios(false)}>Cancelar</button>
          <button className="btn btn-accent" onClick={handlePreciosUpdate}>Aplicar cambios</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Categoría</label>
            <select value={precioCat} onChange={(e) => setPrecioCat(e.target.value)}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ maxWidth: 120 }}>
            <label>Porcentaje</label>
            <input type="number" value={porcentaje} onChange={(e) => setPorcentaje(Number(e.target.value))} />
          </div>
          <div className="form-group" style={{ maxWidth: 140 }}>
            <label>Redondear a</label>
            <select value={redondeo} onChange={(e) => setRedondeo(Number(e.target.value))}>
              {REDONDEOS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {previewPrecios.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: "var(--color-text-2)", marginBottom: 8 }}>
              {previewPrecios.length} productos afectados
            </div>
            <div className="preview-tbl">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio actual</th>
                    <th>Precio nuevo</th>
                    <th>Dif.</th>
                  </tr>
                </thead>
                <tbody>
                  {previewPrecios.map((p) => (
                    <tr key={p.id}>
                      <td className="td-b">{p.nombre}</td>
                      <td className="price-old">{formatPrecio(p.precio)}</td>
                      <td className="price-new">{formatPrecio(p.nuevoPrecio)}</td>
                      <td className="td-m">{p.diff >= 0 ? "+" : ""}{formatPrecio(p.diff)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
