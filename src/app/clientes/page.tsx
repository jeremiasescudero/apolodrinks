"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatPrecio } from "@/lib/utils";

interface Cliente {
  id: number;
  nombre: string;
  tipo: string;
  telefono: string;
  direccion: string;
  email: string;
  saldo: number;
}

const TIPOS = ["Particular", "Comercio"];
const EMPTY_FORM = { nombre: "", tipo: "Particular", telefono: "", direccion: "", email: "", saldo: 0 };

export default function ClientesPage() {
  const toast = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tipoFilter !== "Todos") params.set("tipo", tipoFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/clientes?${params}`);
    const data = await res.json();
    setClientes(data);
    setLoading(false);
  }, [tipoFilter, search]);

  useEffect(() => { fetchClientes() }, [fetchClientes]);

  const handleSave = async () => {
    const url = editingId ? `/api/clientes/${editingId}` : "/api/clientes";
    const method = editingId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    toast(editingId ? "Cliente actualizado" : "Cliente creado");
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    fetchClientes();
  };

  const handleEdit = (c: Cliente) => {
    setForm({ nombre: c.nombre, tipo: c.tipo, telefono: c.telefono, direccion: c.direccion, email: c.email, saldo: c.saldo });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/clientes/${deleteId}`, { method: "DELETE" });
    toast("Cliente eliminado");
    setDeleteId(null);
    setDeleteName("");
    fetchClientes();
  };

  const saldoVariant = (saldo: number) => {
    if (saldo > 0) return "danger" as const;
    if (saldo < 0) return "success" as const;
    return "muted" as const;
  };

  const saldoLabel = (saldo: number) => {
    if (saldo > 0) return `Debe ${formatPrecio(saldo)}`;
    if (saldo < 0) return `A favor ${formatPrecio(Math.abs(saldo))}`;
    return "Sin saldo";
  };

  return (
    <>
      {/* Toolbar */}
      <div className="sec-bar">
        <div className="srch" style={{ minWidth: 240 }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="14" y2="14" />
          </svg>
          <input type="text" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-p" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" /></svg>
          Nuevo cliente
        </button>
      </div>

      {/* Type Filters */}
      <div className="filter-bar">
        {["Todos", ...TIPOS].map((t) => (
          <button key={t} onClick={() => setTipoFilter(t)} className={`fchip ${tipoFilter === t ? "active" : ""}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl-cards">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Saldo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="empty-msg">Cargando...</td></tr>
              ) : clientes.length === 0 ? (
                <tr><td colSpan={7} className="empty-msg">No se encontraron clientes</td></tr>
              ) : (
                clientes.map((c) => (
                  <tr key={c.id}>
                    <td className="celda-titulo td-b">{c.nombre}</td>
                    <td data-label="Tipo"><Badge variant={c.tipo === "Comercio" ? "info" : "muted"}>{c.tipo}</Badge></td>
                    <td className="td-m" data-label="Teléfono">{c.telefono || "—"}</td>
                    <td className="td-m" data-label="Email">{c.email || "—"}</td>
                    <td className="td-m" data-label="Dirección">{c.direccion || "—"}</td>
                    <td data-label="Saldo"><Badge variant={saldoVariant(c.saldo)}>{saldoLabel(c.saldo)}</Badge></td>
                    <td className="td-act">
                      <button className="act-btn" onClick={() => handleEdit(c)} title="Editar">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" /></svg>
                      </button>
                      <button className="act-btn del" onClick={() => { setDeleteId(c.id); setDeleteName(c.nombre) }} title="Eliminar">
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

      {/* Modal Nuevo/Editar */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingId(null) }} title={editingId ? "Editar cliente" : "Nuevo cliente"}
        footer={<>
          <button className="btn btn-o" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancelar</button>
          <button className="btn btn-p" onClick={handleSave}>{editingId ? "Guardar cambios" : "Crear cliente"}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Pérez" />
          </div>
          <div className="form-group" style={{ maxWidth: 160 }}>
            <label>Tipo</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Teléfono</label>
            <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Ej: 351-1234567" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Ej: juan@email.com" />
          </div>
        </div>
        <div className="form-group">
          <label>Dirección</label>
          <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Ej: Av. Colón 1234, Córdoba" />
        </div>
        <div className="form-row">
          <div className="form-group" style={{ maxWidth: 180 }}>
            <label>Saldo ($)</label>
            <input type="number" value={form.saldo} onChange={(e) => setForm({ ...form, saldo: Number(e.target.value) })} />
          </div>
        </div>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal open={deleteId !== null} onClose={() => { setDeleteId(null); setDeleteName("") }} title="Eliminar cliente"
        footer={<>
          <button className="btn btn-o" onClick={() => { setDeleteId(null); setDeleteName("") }}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
        </>}
      >
        <p style={{ fontSize: 13, color: "var(--color-text-2)" }}>
          ¿Estás seguro de que querés eliminar a <strong>{deleteName}</strong>? Esta acción se puede revertir.
        </p>
      </Modal>
    </>
  );
}
