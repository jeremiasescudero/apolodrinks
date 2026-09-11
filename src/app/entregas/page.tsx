"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import InputNumero, { aNumero, aTexto } from "@/components/ui/InputNumero";
import { SkeletonFilas } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ESTADOS_ENCARGO, METODOS_PAGO } from "@/lib/constants";
import { formatFechaLarga, formatPrecio, mapsLink, todayStr, waLink } from "@/lib/utils";

interface Encargo {
  id: number;
  fecha: string;
  orden: number;
  nombre: string;
  telefono: string;
  direccion: string;
  detalle: string;
  monto: number;
  metodoPago: string;
  notas: string;
  estado: string;
  entregadoAt: string | null;
}

interface ClienteMatch {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
}

const ESTADOS = Object.keys(ESTADOS_ENCARGO) as (keyof typeof ESTADOS_ENCARGO)[];

const emptyForm = (fecha: string) => ({
  fecha,
  nombre: "",
  telefono: "",
  direccion: "",
  detalle: "",
  monto: "",
  metodoPago: "Efectivo" as string,
  notas: "",
  guardarCliente: false,
  clienteId: null as number | null,
});

export default function EntregasPage() {
  const toast = useToast();
  const [fecha, setFecha] = useState(todayStr());
  const [encargos, setEncargos] = useState<Encargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm(todayStr()));
  const [sugerencias, setSugerencias] = useState<ClienteMatch[]>([]);

  const [deleteEncargo, setDeleteEncargo] = useState<Encargo | null>(null);

  const fetchEncargos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ fecha });
    if (estadoFilter !== "Todos") params.set("estado", estadoFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/encargos?${params}`);
    setEncargos(await res.json());
    setLoading(false);
  }, [fecha, estadoFilter, search]);

  useEffect(() => { fetchEncargos() }, [fetchEncargos]);

  // Reordenar sólo tiene sentido viendo la lista completa del día.
  const puedeReordenar = estadoFilter === "Todos" && !search;

  const totales = useMemo(() => {
    const pendientes = encargos.filter((e) => e.estado === "PENDIENTE");
    const entregados = encargos.filter((e) => e.estado === "ENTREGADO");
    return {
      pendientes: pendientes.length,
      porCobrar: pendientes.reduce((s, e) => s + e.monto, 0),
      entregados: entregados.length,
      cobrado: entregados.reduce((s, e) => s + e.monto, 0),
    };
  }, [encargos]);

  // Al tipear el teléfono buscamos si ya es cliente, para no recargar la dirección a mano.
  const buscarCliente = async (telefono: string) => {
    if (telefono.replace(/\D/g, "").length < 6) {
      setSugerencias([]);
      return;
    }
    const res = await fetch(`/api/clientes?search=${encodeURIComponent(telefono)}`);
    const data: ClienteMatch[] = await res.json();
    setSugerencias(data.slice(0, 3));
  };

  const usarCliente = (c: ClienteMatch) => {
    setForm((f) => ({ ...f, nombre: c.nombre, telefono: c.telefono, direccion: c.direccion, clienteId: c.id, guardarCliente: false }));
    setSugerencias([]);
  };

  const openNuevo = () => {
    setForm(emptyForm(fecha));
    setSugerencias([]);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditar = (e: Encargo) => {
    setForm({
      fecha: e.fecha.split("T")[0],
      nombre: e.nombre,
      telefono: e.telefono,
      direccion: e.direccion,
      detalle: e.detalle,
      monto: aTexto(e.monto),
      metodoPago: e.metodoPago,
      notas: e.notas,
      guardarCliente: false,
      clienteId: null,
    });
    setSugerencias([]);
    setEditingId(e.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.direccion.trim()) {
      toast("Falta el nombre o la dirección", "error");
      return;
    }
    const monto = aNumero(form.monto);
    if (Number.isNaN(monto) || monto < 0) {
      toast("El monto no es válido", "error");
      return;
    }

    const url = editingId ? `/api/encargos/${editingId}` : "/api/encargos";
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      // El formulario guarda texto; a la API va el número.
      body: JSON.stringify({ ...form, monto }),
    });
    if (!res.ok) {
      toast("No se pudo guardar el encargo", "error");
      return;
    }
    toast(editingId ? "Encargo actualizado" : "Encargo agregado a la hoja de ruta");
    setShowForm(false);
    setEditingId(null);
    fetchEncargos();
  };

  const cambiarEstado = async (e: Encargo, estado: string) => {
    await fetch(`/api/encargos/${e.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    const mensajes: Record<string, string> = {
      ENTREGADO: `Entregado a ${e.nombre}`,
      CANCELADO: `Encargo de ${e.nombre} cancelado`,
      PENDIENTE: `${e.nombre} vuelve a pendientes`,
    };
    toast(mensajes[estado] ?? "Encargo actualizado");
    fetchEncargos();
  };

  const mover = async (e: Encargo, direccion: "subir" | "bajar") => {
    await fetch(`/api/encargos/${e.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mover", direccion }),
    });
    fetchEncargos();
  };

  const handleDelete = async () => {
    if (!deleteEncargo) return;
    await fetch(`/api/encargos/${deleteEncargo.id}`, { method: "DELETE" });
    toast("Encargo eliminado");
    setDeleteEncargo(null);
    fetchEncargos();
  };

  const mensajeConfirmacion = (e: Encargo) =>
    [
      `Hola ${e.nombre}! Te confirmamos tu pedido de Apolo's Drinks:`,
      e.detalle,
      `Total: ${formatPrecio(e.monto)} (${e.metodoPago})`,
      `Enviamos a: ${e.direccion}`,
      "¡Gracias!",
    ].join("\n");

  return (
    <>
      {/* Toolbar */}
      <div className="sec-bar no-print">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="date" className="inp-date" value={fecha} onChange={(ev) => setFecha(ev.target.value)} />
          <div className="srch" style={{ minWidth: 220 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="14" y2="14" />
            </svg>
            <input type="text" placeholder="Buscar por nombre, dirección..." value={search} onChange={(ev) => setSearch(ev.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-o" onClick={() => window.print()}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6V2h8v4" /><rect x="2" y="6" width="12" height="5" rx="1" /><path d="M4 11h8v3H4z" />
            </svg>
            Imprimir hoja
          </button>
          <button className="btn btn-p" onClick={openNuevo}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" /></svg>
            Nuevo encargo
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid no-print">
        <div className="kpi-card warning">
          <span className="kpi-label">Pendientes</span>
          <span className="kpi-value">{totales.pendientes}</span>
          <span className="kpi-sub">envíos sin salir</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">A cobrar</span>
          <span className="kpi-value">{formatPrecio(totales.porCobrar)}</span>
          <span className="kpi-sub">en los pendientes</span>
        </div>
        <div className="kpi-card success">
          <span className="kpi-label">Entregados</span>
          <span className="kpi-value">{totales.entregados}</span>
          <span className="kpi-sub">del día</span>
        </div>
        <div className="kpi-card accent">
          <span className="kpi-label">Cobrado</span>
          <span className="kpi-value">{formatPrecio(totales.cobrado)}</span>
          <span className="kpi-sub">entregas cerradas</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="filter-bar no-print">
        {["Todos", ...ESTADOS].map((e) => (
          <button key={e} onClick={() => setEstadoFilter(e)} className={`fchip ${estadoFilter === e ? "active" : ""}`}>
            {e === "Todos" ? "Todos" : ESTADOS_ENCARGO[e as keyof typeof ESTADOS_ENCARGO].label}
          </button>
        ))}
      </div>

      {/* Hoja de ruta */}
      <div className="card">
        <div className="card-header">
          <h3>Hoja de ruta</h3>
          <span className="td-m" style={{ fontSize: 12, textTransform: "capitalize" }}>{formatFechaLarga(fecha)}</span>
        </div>
        <div className="tbl-wrap">
          <table className="tbl-cards">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Cliente</th>
                <th>Dirección</th>
                <th>Pedido</th>
                <th>Monto</th>
                <th>Pago</th>
                <th>Estado</th>
                <th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonFilas filas={5} columnas={8} />
              ) : encargos.length === 0 ? (
                <tr><td colSpan={8} className="empty-msg">No hay encargos cargados para este día</td></tr>
              ) : (
                encargos.map((e, i) => {
                  const wa = waLink(e.telefono, mensajeConfirmacion(e));
                  const estado = ESTADOS_ENCARGO[e.estado as keyof typeof ESTADOS_ENCARGO];
                  return (
                    <tr key={e.id} className={e.estado === "CANCELADO" ? "row-anulada" : ""}>
                      <td className="td-m" data-label="Parada">{i + 1}</td>
                      <td className="celda-titulo">
                        <div className="td-b">{e.nombre}</div>
                        {e.telefono && (
                          wa ? (
                            <a href={wa} target="_blank" rel="noopener noreferrer" className="link-sutil">{e.telefono}</a>
                          ) : (
                            <span className="td-m" style={{ fontSize: 12 }}>{e.telefono}</span>
                          )
                        )}
                      </td>
                      <td className="td-m" data-label="Dirección" style={{ maxWidth: 200 }}>
                        <a href={mapsLink(e.direccion)} target="_blank" rel="noopener noreferrer" className="link-sutil">{e.direccion}</a>
                      </td>
                      <td className="td-m celda-pedido" data-label="Pedido">
                        {e.detalle || "—"}
                        {e.notas && <div className="celda-nota">Nota: {e.notas}</div>}
                      </td>
                      <td className="td-n" data-label="Monto">{formatPrecio(e.monto)}</td>
                      <td className="td-m" data-label="Pago">{e.metodoPago}</td>
                      <td data-label="Estado"><Badge variant={estado.color}>{estado.label}</Badge></td>
                      <td className="td-act no-print" style={{ width: 180 }}>
                        {e.estado === "PENDIENTE" ? (
                          <button className="act-btn" onClick={() => cambiarEstado(e, "ENTREGADO")} title="Marcar entregado">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 8 6.5 11.5 13 4.5" /></svg>
                          </button>
                        ) : (
                          <button className="act-btn" onClick={() => cambiarEstado(e, "PENDIENTE")} title="Volver a pendiente">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8a5 5 0 105-5" /><polyline points="3 3 3 8 8 8" /></svg>
                          </button>
                        )}
                        {e.estado !== "CANCELADO" && (
                          <button className="act-btn del" onClick={() => cambiarEstado(e, "CANCELADO")} title="Cancelar encargo">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" /></svg>
                          </button>
                        )}
                        <button className="act-btn" onClick={() => mover(e, "subir")} disabled={!puedeReordenar || i === 0} title="Subir en la ruta">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="4 10 8 6 12 10" /></svg>
                        </button>
                        <button className="act-btn" onClick={() => mover(e, "bajar")} disabled={!puedeReordenar || i === encargos.length - 1} title="Bajar en la ruta">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="4 6 8 10 12 6" /></svg>
                        </button>
                        <button className="act-btn" onClick={() => openEditar(e)} title="Editar">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" /></svg>
                        </button>
                        <button className="act-btn del" onClick={() => setDeleteEncargo(e)} title="Eliminar">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {encargos.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4} className="td-b" style={{ textAlign: "right" }}>Total de la hoja</td>
                  <td className="td-b" data-label="Total">{formatPrecio(totales.porCobrar + totales.cobrado)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Nuevo/Editar */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null) }}
        title={editingId ? "Editar encargo" : "Nuevo encargo"}
        footer={<>
          <button className="btn btn-o" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancelar</button>
          <button className="btn btn-p" onClick={handleSave}>{editingId ? "Guardar cambios" : "Agregar a la hoja"}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => { setForm({ ...form, telefono: e.target.value, clienteId: null }); buscarCliente(e.target.value) }}
              placeholder="Ej: 351 1234567"
            />
          </div>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Pérez" />
          </div>
          <div className="form-group" style={{ maxWidth: 150 }}>
            <label>Fecha de entrega</label>
            <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} disabled={!!editingId} />
          </div>
        </div>

        {sugerencias.length > 0 && (
          <div className="sugerencias">
            <span className="sug-label">Ya es cliente:</span>
            {sugerencias.map((c) => (
              <button key={c.id} className="fchip" onClick={() => usarCliente(c)}>
                {c.nombre}{c.direccion ? ` · ${c.direccion}` : ""}
              </button>
            ))}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Dirección de envío</label>
          <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Ej: Av. Colón 1234, Alberdi" />
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Pedido</label>
          <textarea
            className="inp-area"
            value={form.detalle}
            onChange={(e) => setForm({ ...form, detalle: e.target.value })}
            rows={3}
            placeholder={"Ej: 2 Fernet 750\n6 Coca 2.25L\n1 hielo"}
          />
        </div>

        <div className="form-row">
          <div className="form-group" style={{ maxWidth: 160 }}>
            <label>Monto a cobrar ($)</label>
            <InputNumero value={form.monto} onChange={(v) => setForm({ ...form, monto: v })} placeholder="0" maxDigitos={9} />
          </div>
          <div className="form-group" style={{ maxWidth: 160 }}>
            <label>Método de pago</label>
            <select value={form.metodoPago} onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}>
              {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Nota para el repartidor</label>
            <input type="text" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Ej: timbre roto, llamar al llegar" />
          </div>
        </div>

        {!editingId && !form.clienteId && (
          <label className="check-inline">
            <input type="checkbox" checked={form.guardarCliente} onChange={(e) => setForm({ ...form, guardarCliente: e.target.checked })} />
            Guardar también en Clientes
          </label>
        )}
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        open={deleteEncargo !== null}
        onClose={() => setDeleteEncargo(null)}
        title="Eliminar encargo"
        footer={<>
          <button className="btn btn-o" onClick={() => setDeleteEncargo(null)}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
        </>}
      >
        <p style={{ fontSize: 13, color: "var(--color-text-2)" }}>
          ¿Eliminar el encargo de <strong>{deleteEncargo?.nombre}</strong> ({deleteEncargo?.direccion})? No se puede deshacer.
        </p>
      </Modal>
    </>
  );
}
