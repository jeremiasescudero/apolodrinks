"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { SkeletonFilas } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface Proveedor {
  id: number;
  nombre: string;
  categoria: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
}

const EMPTY_FORM = { nombre: "", categoria: "", contacto: "", telefono: "", email: "", direccion: "" };

export default function ProveedoresPage() {
  const toast = useToast();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/proveedores?${params}`);
    const data = await res.json();
    setProveedores(data);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchProveedores() }, [fetchProveedores]);

  const handleSave = async () => {
    const url = editingId ? `/api/proveedores/${editingId}` : "/api/proveedores";
    const method = editingId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    toast(editingId ? "Proveedor actualizado" : "Proveedor creado");
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    fetchProveedores();
  };

  const handleEdit = (p: Proveedor) => {
    setForm({ nombre: p.nombre, categoria: p.categoria, contacto: p.contacto, telefono: p.telefono, email: p.email, direccion: p.direccion });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/proveedores/${deleteId}`, { method: "DELETE" });
    toast("Proveedor eliminado");
    setDeleteId(null);
    setDeleteName("");
    fetchProveedores();
  };

  return (
    <>
      {/* Toolbar */}
      <div className="sec-bar">
        <div className="srch" style={{ minWidth: 240 }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="14" y2="14" />
          </svg>
          <input type="text" placeholder="Buscar proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-p" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" /></svg>
          Nuevo proveedor
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl-cards">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Categoría</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonFilas filas={5} columnas={6} />
              ) : proveedores.length === 0 ? (
                <tr><td colSpan={6} className="empty-msg">No se encontraron proveedores</td></tr>
              ) : (
                proveedores.map((p) => (
                  <tr key={p.id}>
                    <td className="celda-titulo td-b">{p.nombre}</td>
                    <td className="td-m" data-label="Categoría">{p.categoria || "—"}</td>
                    <td className="td-m" data-label="Contacto">{p.contacto || "—"}</td>
                    <td className="td-m" data-label="Teléfono">{p.telefono || "—"}</td>
                    <td className="td-m" data-label="Email">{p.email || "—"}</td>
                    <td className="td-act">
                      <button className="act-btn" onClick={() => handleEdit(p)} title="Editar">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" /></svg>
                      </button>
                      <button className="act-btn del" onClick={() => { setDeleteId(p.id); setDeleteName(p.nombre) }} title="Eliminar">
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
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingId(null) }} title={editingId ? "Editar proveedor" : "Nuevo proveedor"}
        footer={<>
          <button className="btn btn-o" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancelar</button>
          <button className="btn btn-p" onClick={handleSave}>{editingId ? "Guardar cambios" : "Crear proveedor"}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Distribuidora Norte" />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <input type="text" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ej: Cervezas, Gaseosas" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Contacto</label>
            <input type="text" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} placeholder="Nombre del contacto" />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Ej: 351-1234567" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Ej: ventas@proveedor.com" />
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Ej: Ruta 9 Km 5, Córdoba" />
          </div>
        </div>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal open={deleteId !== null} onClose={() => { setDeleteId(null); setDeleteName("") }} title="Eliminar proveedor"
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
