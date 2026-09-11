"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import InputNumero, { aNumero } from "@/components/ui/InputNumero";
import { Skeleton, SkeletonFilas, SkeletonKpis } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatPrecio, formatPrecioConSigno } from "@/lib/utils";

interface VentaItem {
  producto: { nombre: string };
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
}

interface Venta {
  id: number;
  numero: string;
  cliente: { nombre: string } | null;
  metodoPago: string;
  montoPago1: number;
  metodoPago2: string | null;
  montoPago2: number;
  total: number;
  createdAt: string;
  items: VentaItem[];
}

interface Caja {
  id: number;
  fecha: string;
  montoInicial: number;
  estado: string;
  openedAt: string;
  closedAt: string | null;
}

// Tope de cordura para la apertura: nadie arranca el día con más que esto.
const MONTO_MAXIMO = 100_000_000;

export default function CajaPage() {
  const toast = useToast();
  const [caja, setCaja] = useState<Caja | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAbrir, setShowAbrir] = useState(false);
  // Texto, no número: un 0 numérico se pinta solo y no se puede borrar.
  const [montoInicial, setMontoInicial] = useState("");
  const [showCerrar, setShowCerrar] = useState(false);
  const [historial, setHistorial] = useState<Caja[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [detailCaja, setDetailCaja] = useState<Caja | null>(null);
  const [detailVentas, setDetailVentas] = useState<Venta[]>([]);

  const fetchCaja = useCallback(async () => {
    setLoading(true);
    // El turno en curso se pide por estado, no por fecha: a las 00:00 la caja
    // abierta anoche sigue siendo la misma y no tiene que desaparecer.
    const res = await fetch("/api/caja?abierta=1");
    const data = await res.json();
    setCaja(data);
    if (data) {
      // Sus ventas salen del rango del turno, no del día del calendario.
      const vRes = await fetch(`/api/ventas?cajaId=${data.id}`);
      setVentas(await vRes.json());
    } else {
      setVentas([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCaja() }, [fetchCaja]);

  const handleAbrir = async () => {
    const monto = aNumero(montoInicial);
    if (Number.isNaN(monto) || monto < 0) {
      toast("El monto inicial no es válido", "error");
      return;
    }
    if (monto > MONTO_MAXIMO) {
      toast("Revisá el monto: parece demasiado alto", "error");
      return;
    }

    const res = await fetch("/api/caja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montoInicial: monto }),
    });
    // Antes se avisaba "Caja abierta" aunque el servidor hubiera rechazado.
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error ?? "No se pudo abrir la caja", "error");
      return;
    }

    toast("Caja abierta");
    setShowAbrir(false);
    setMontoInicial("");
    fetchCaja();
  };

  const handleCerrar = async () => {
    if (!caja) return;
    await fetch(`/api/caja/${caja.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cerrar" }),
    });
    toast("Caja cerrada");
    setShowCerrar(false);
    fetchCaja();
  };

  const openHistorial = async () => {
    const res = await fetch("/api/caja");
    setHistorial(await res.json());
    setShowHistorial(true);
  };

  const openDetail = async (c: Caja) => {
    const vRes = await fetch(`/api/ventas?cajaId=${c.id}`);
    setDetailVentas(await vRes.json());
    setDetailCaja(c);
    setShowHistorial(false);
  };

  const calcTotales = (vs: Venta[]) => {
    const porMetodo: Record<string, number> = {};
    let totalVentas = 0;
    let ganancia = 0;
    let unidadesSinCosto = 0;
    let unidadesConCosto = 0;

    for (const v of vs) {
      if (v.metodoPago2 && v.montoPago2 > 0) {
        porMetodo[v.metodoPago] = (porMetodo[v.metodoPago] || 0) + v.montoPago1;
        porMetodo[v.metodoPago2] = (porMetodo[v.metodoPago2] || 0) + v.montoPago2;
      } else {
        porMetodo[v.metodoPago] = (porMetodo[v.metodoPago] || 0) + v.total;
      }
      totalVentas += v.total;
      for (const it of v.items) {
        // costoUnitario en 0 significa que no se sabía el costo al vender.
        // Esas unidades quedan afuera: inventar la ganancia sería peor que no darla.
        if (it.costoUnitario > 0) {
          ganancia += (it.precioUnitario - it.costoUnitario) * it.cantidad;
          unidadesConCosto += it.cantidad;
        } else {
          unidadesSinCosto += it.cantidad;
        }
      }
    }

    return { porMetodo, totalVentas, cantVentas: vs.length, ganancia, unidadesConCosto, unidadesSinCosto };
  };

  const formatFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatHora = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  const METODO_VARIANT: Record<string, "success" | "info" | "warning" | "muted"> = {
    Efectivo: "success",
    Transferencia: "info",
    "Débito": "warning",
    "Crédito": "muted",
  };

  if (loading) {
    // Misma silueta que la pantalla real: encabezado, cinco indicadores y el
    // listado de ventas. Así no salta todo de lugar cuando llegan los datos.
    return (
      <>
        <div className="sec-bar">
          <Skeleton ancho={220} alto={14} />
          <Skeleton ancho={280} alto={36} radio={8} />
        </div>
        <div className="kpi-grid"><SkeletonKpis cantidad={5} /></div>
        <div className="card">
          <div className="card-header"><Skeleton ancho={150} alto={13} /></div>
          <div className="tbl-wrap">
            <table className="tbl-cards"><tbody><SkeletonFilas filas={4} columnas={6} /></tbody></table>
          </div>
        </div>
      </>
    );
  }

  if (!caja) {
    return (
      <>
        <div className="sec-bar">
          <div />
          <button className="btn btn-accent" onClick={openHistorial}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 4v4h3" /></svg>
            Historial
          </button>
        </div>
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <svg viewBox="0 0 48 48" fill="none" stroke="var(--color-text-3)" strokeWidth="2" width="48" height="48" style={{ margin: "0 auto 16px" }}>
            <rect x="6" y="10" width="36" height="28" rx="3" />
            <path d="M6 18h36" />
            <path d="M16 10V6M32 10V6" />
          </svg>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-1)", marginBottom: 4 }}>
            No hay caja abierta hoy
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 20 }}>
            Abrí la caja para comenzar a registrar el día.
          </p>
          <button className="btn btn-p" onClick={() => { setMontoInicial(""); setShowAbrir(true) }}>Abrir caja</button>
        </div>

        <Modal open={showAbrir} onClose={() => setShowAbrir(false)} title="Abrir caja"
          footer={<>
            <button className="btn btn-o" onClick={() => setShowAbrir(false)}>Cancelar</button>
            <button className="btn btn-p" onClick={handleAbrir}>Abrir caja</button>
          </>}
        >
          <div className="form-group">
            <label htmlFor="monto-inicial">Monto inicial en caja ($)</label>
            <InputNumero id="monto-inicial" value={montoInicial} onChange={setMontoInicial} placeholder="0" maxDigitos={9} />
            <span style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 4 }}>
              Efectivo con el que se inicia el día.
            </span>
          </div>
        </Modal>

        {renderHistorialModal()}
        {renderDetailModal()}
      </>
    );
  }

  const { porMetodo, totalVentas, cantVentas, ganancia, unidadesConCosto, unidadesSinCosto } = calcTotales(ventas);
  const apertura = caja.montoInicial;
  const efectivoFinal = apertura + (porMetodo["Efectivo"] || 0);
  const isClosed = caja.estado === "CERRADA";

  return (
    <>
      {/* Toolbar */}
      <div className="sec-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge variant={isClosed ? "muted" : "success"}>{isClosed ? "Cerrada" : "Abierta"}</Badge>
          <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>
            Abierta el {formatFecha(caja.openedAt)} a las {formatHora(caja.openedAt)}
            {caja.closedAt && ` — Cerrada el ${formatFecha(caja.closedAt)} a las ${formatHora(caja.closedAt)}`}
            {!caja.closedAt && formatFecha(caja.openedAt) !== formatFecha(new Date().toISOString()) && (
              <strong style={{ color: "var(--color-warning)" }}> · sigue abierta desde ayer</strong>
            )}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-accent" onClick={openHistorial}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 4v4h3" /></svg>
            Historial
          </button>
          {!isClosed && (
            <>
              <button className="btn btn-o" onClick={fetchCaja}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 8A6 6 0 1 1 8 2" /><path d="M14 2v4h-4" /></svg>
                Actualizar
              </button>
              <button className="btn btn-danger" onClick={() => setShowCerrar(true)}>Cerrar caja</button>
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-mobile-2" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
        <div className="kpi-card">
          <span className="kpi-label">Apertura (efectivo)</span>
          <span className="kpi-value">{formatPrecio(apertura)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Ventas de la caja</span>
          <span className="kpi-value" style={{ color: "var(--color-success)" }}>{cantVentas}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Total vendido</span>
          <span className="kpi-value" style={{ color: "var(--color-success)" }}>{formatPrecio(totalVentas)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Ganancia de la caja</span>
          <span className="kpi-value" style={{ color: unidadesConCosto === 0 ? "var(--color-text-3)" : ganancia < 0 ? "var(--color-danger)" : "var(--color-success)" }}>
            {unidadesConCosto === 0 ? "—" : formatPrecioConSigno(ganancia)}
          </span>
          <span className="kpi-sub">
            {unidadesConCosto === 0
              ? "sin costos cargados"
              : unidadesSinCosto > 0
                ? `${unidadesSinCosto} u. sin costo quedan afuera`
                : "sobre todo lo vendido"}
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Efectivo en caja</span>
          <span className="kpi-value">{formatPrecio(efectivoFinal)}</span>
        </div>
      </div>

      {/* Desglose por método */}
      {Object.keys(porMetodo).length > 0 && (
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-1)", marginBottom: 10 }}>
            Recaudación por método de pago
          </div>
          <div className="grid-mobile-2" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(Object.keys(porMetodo).length, 4)}, 1fr)`, gap: 16 }}>
            {Object.entries(porMetodo).map(([metodo, total]) => (
              <div key={metodo} style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ marginBottom: 4 }}>
                  <Badge variant={METODO_VARIANT[metodo] ?? "muted"}>{metodo}</Badge>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-1)" }}>{formatPrecio(total)}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-3)" }}>
                  {ventas.filter((v) => v.metodoPago === metodo).length} venta{ventas.filter((v) => v.metodoPago === metodo).length !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ventas de la caja */}
      <div className="card">
        <div style={{ padding: "12px 16px 0", fontSize: 13, fontWeight: 600, color: "var(--color-text-1)" }}>
          Ventas de esta caja
        </div>
        <div className="tbl-wrap">
          <table className="tbl-cards">
            <thead>
              <tr>
                <th>N°</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Método</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr><td colSpan={6} className="empty-msg">No hay ventas registradas hoy</td></tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id}>
                    <td className="celda-titulo td-b">{v.numero}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cerrar Caja */}
      <Modal open={showCerrar} onClose={() => setShowCerrar(false)} title="Cerrar caja"
        footer={<>
          <button className="btn btn-o" onClick={() => setShowCerrar(false)}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleCerrar}>Cerrar caja</button>
        </>}
      >
        <div style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 16 }}>
          Resumen de la caja antes de cerrar:
        </div>
        <div className="grid-mobile-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 12, background: "var(--color-surface-2)", borderRadius: 8, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase" }}>Apertura</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{formatPrecio(apertura)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase" }}>Ventas</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-success)" }}>{cantVentas} ({formatPrecio(totalVentas)})</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase" }}>Efectivo en caja</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{formatPrecio(efectivoFinal)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase" }}>Total digital</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{formatPrecio(totalVentas - (porMetodo["Efectivo"] || 0))}</div>
          </div>
        </div>
        <div style={{ padding: "12px 14px", background: "var(--color-surface-2)", borderRadius: 8, marginBottom: 16, borderLeft: `3px solid ${unidadesConCosto === 0 ? "var(--color-border-2)" : ganancia < 0 ? "var(--color-danger)" : "var(--color-success)"}` }}>
          <div style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: ".4px" }}>Ganancia de la caja</div>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, marginTop: 2, color: unidadesConCosto === 0 ? "var(--color-text-3)" : ganancia < 0 ? "var(--color-danger)" : "var(--color-success)" }}>
            {unidadesConCosto === 0 ? "—" : formatPrecioConSigno(ganancia)}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-2)", marginTop: 4 }}>
            {unidadesConCosto === 0
              ? "Ningún producto vendido tiene el precio de costo cargado, así que no se puede calcular."
              : unidadesSinCosto > 0
                ? `Calculado sobre ${unidadesConCosto} unidades. Otras ${unidadesSinCosto} no tienen costo cargado y quedan afuera.`
                : `Sobre las ${unidadesConCosto} unidades vendidas hoy.`}
          </div>
        </div>
        {Object.keys(porMetodo).length > 0 && (
          <div style={{ padding: 12, background: "var(--color-surface-2)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase", marginBottom: 8 }}>Desglose</div>
            {Object.entries(porMetodo).map(([metodo, total]) => (
              <div key={metodo} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                <span style={{ color: "var(--color-text-2)" }}>{metodo}</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-1)" }}>{formatPrecio(total)}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {renderHistorialModal()}
      {renderDetailModal()}
    </>
  );

  function renderHistorialModal() {
    return (
      <Modal open={showHistorial} onClose={() => setShowHistorial(false)} title="Historial de cajas" wide
        footer={<button className="btn btn-o" onClick={() => setShowHistorial(false)}>Cerrar</button>}
      >
        <div className="tbl-wrap">
          <table className="tbl-cards">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Apertura</th>
                <th>Ventas</th>
                <th>Total vendido</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr><td colSpan={6} className="empty-msg">No hay registros</td></tr>
              ) : (
                historial.map((c) => (
                  <tr key={c.id}>
                    <td className="celda-titulo td-b">{formatFecha(c.fecha)}</td>
                    <td data-label="Estado"><Badge variant={c.estado === "ABIERTA" ? "success" : "muted"}>{c.estado === "ABIERTA" ? "Abierta" : "Cerrada"}</Badge></td>
                    <td className="td-n" data-label="Apertura">{formatPrecio(c.montoInicial)}</td>
                    <td className="td-m" data-label="Ventas">—</td>
                    <td className="td-n" data-label="Total vendido">—</td>
                    <td className="td-act">
                      <button className="act-btn" onClick={() => openDetail(c)} title="Ver detalle">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 5v3h3" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    );
  }

  function renderDetailModal() {
    if (!detailCaja) return null;
    const t = calcTotales(detailVentas);

    return (
      <Modal open={detailCaja !== null} onClose={() => setDetailCaja(null)} title={`Caja ${formatFecha(detailCaja.fecha)}`} wide
        footer={<button className="btn btn-o" onClick={() => setDetailCaja(null)}>Cerrar</button>}
      >
        <div className="grid-mobile-2" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase" }}>Apertura</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{formatPrecio(detailCaja.montoInicial)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase" }}>Ventas</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{t.cantVentas}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase" }}>Total vendido</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-success)" }}>{formatPrecio(t.totalVentas)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase" }}>Ganancia</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.unidadesConCosto === 0 ? "var(--color-text-3)" : t.ganancia < 0 ? "var(--color-danger)" : "var(--color-success)" }}>
              {t.unidadesConCosto === 0 ? "—" : formatPrecioConSigno(t.ganancia)}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase" }}>Efectivo en caja</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{formatPrecio(detailCaja.montoInicial + (t.porMetodo["Efectivo"] || 0))}</div>
          </div>
        </div>

        {Object.keys(t.porMetodo).length > 0 && (
          <div className="grid-mobile-2" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(Object.keys(t.porMetodo).length, 4)}, 1fr)`, gap: 16, padding: 12, background: "var(--color-surface-2)", borderRadius: 8, marginBottom: 16 }}>
            {Object.entries(t.porMetodo).map(([metodo, total]) => (
              <div key={metodo} style={{ textAlign: "center" }}>
                <Badge variant={METODO_VARIANT[metodo] ?? "muted"}>{metodo}</Badge>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{formatPrecio(total)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Método</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {detailVentas.length === 0 ? (
                <tr><td colSpan={5} className="empty-msg">Sin ventas</td></tr>
              ) : (
                detailVentas.map((v) => (
                  <tr key={v.id}>
                    <td className="td-b">{v.numero}</td>
                    <td className="td-m">{formatHora(v.createdAt)}</td>
                    <td className="td-m">{v.cliente?.nombre || "—"}</td>
                    <td>
                      <Badge variant={METODO_VARIANT[v.metodoPago] ?? "muted"}>{v.metodoPago}</Badge>
                      {v.metodoPago2 && (
                        <>
                          <span style={{ margin: "0 4px", fontSize: 10, color: "var(--color-text-3)" }}>+</span>
                          <Badge variant={METODO_VARIANT[v.metodoPago2] ?? "muted"}>{v.metodoPago2}</Badge>
                        </>
                      )}
                    </td>
                    <td className="td-n">{formatPrecio(v.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    );
  }
}
