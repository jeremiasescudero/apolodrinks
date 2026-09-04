"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Inicio",
    primary: true,
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1.5" />
        <rect x="11" y="1" width="6" height="6" rx="1.5" />
        <rect x="1" y="11" width="6" height="6" rx="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    primary: false,
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="1" width="14" height="16" rx="2" />
        <line x1="6" y1="5" x2="12" y2="5" />
        <line x1="6" y1="8.5" x2="12" y2="8.5" />
        <line x1="6" y1="12" x2="10" y2="12" />
      </svg>
    ),
  },
  {
    href: "/productos",
    label: "Productos",
    primary: false,
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6 1L1 4v10l5 3 6-3 5 3V7l-5-3L6 1z" />
        <path d="M1 4l5 3" />
        <path d="M6 7v10" />
        <path d="M12 4l5 3" />
      </svg>
    ),
  },
  {
    href: "/ventas",
    label: "Ventas",
    primary: true,
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2 14 6 8 10 11 16 3" />
        <polyline points="12 3 16 3 16 7" />
      </svg>
    ),
  },
  {
    href: "/clientes",
    label: "Clientes",
    primary: false,
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="6.5" cy="5.5" r="2.5" />
        <path d="M1.5 15c0-3 2-5 5-5s5 2 5 5" />
        <circle cx="13" cy="6.5" r="2" />
        <path d="M13 10.5c2 0 3.5 1.5 3.5 3" />
      </svg>
    ),
  },
  {
    href: "/caja",
    label: "Caja",
    primary: true,
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="5" width="16" height="11" rx="2" />
        <path d="M5 5V3a4 4 0 018 0v2" />
        <circle cx="9" cy="11" r="2" />
      </svg>
    ),
  },
  {
    href: "/entregas",
    label: "Entregas",
    primary: true,
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M9 1C6 1 3.5 3.5 3.5 6.5c0 4 5.5 10 5.5 10s5.5-6 5.5-10C14.5 3.5 12 1 9 1z" />
        <circle cx="9" cy="6.5" r="2" />
      </svg>
    ),
  },
  {
    href: "/proveedores",
    label: "Proveedores",
    primary: false,
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="5" width="11" height="9" rx="1.5" />
        <path d="M12 8h3.5a1.5 1.5 0 011.5 1.5V14h-5" />
        <circle cx="5" cy="14" r="2" />
        <circle cx="14" cy="14" r="2" />
      </svg>
    ),
  },
];

const PRIMARY_ITEMS = NAV_ITEMS.filter((i) => i.primary);

const IconoSalir = (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16H3.5A1.5 1.5 0 012 14.5v-11A1.5 1.5 0 013.5 2H7" />
    <polyline points="12 12.5 15.5 9 12 5.5" />
    <line x1="15.5" y1="9" x2="7" y2="9" />
  </svg>
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const salir = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    router.replace("/login");
    router.refresh();
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false) };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (pathname === "/login") return null;

  return (
    <>
      {/* Escritorio: barra lateral fija */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <h1>Apolo&apos;s Drinks</h1>
          <p>Casa de Bebidas</p>
        </div>

        <div className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive(item.href) ? "active" : ""}`}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="btn-salir" onClick={salir}>
            {IconoSalir}
            Cerrar sesión
          </button>
          <strong>Apolo&apos;s Drinks</strong>
          <br />
          Córdoba, Argentina
        </div>
      </nav>

      {/* Celular: barra inferior con los accesos de todos los días */}
      <nav className="tabbar">
        {PRIMARY_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={`tab-item ${isActive(item.href) ? "active" : ""}`}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
        <button className={`tab-item ${menuOpen ? "active" : ""}`} onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="4.5" x2="16" y2="4.5" />
            <line x1="2" y1="9" x2="16" y2="9" />
            <line x1="2" y1="13.5" x2="16" y2="13.5" />
          </svg>
          <span>Menú</span>
        </button>
      </nav>

      {/* Celular: cajón con las ocho secciones */}
      {menuOpen && (
        <div className="drawer-overlay" onClick={(e) => e.target === e.currentTarget && setMenuOpen(false)}>
          <div className="drawer">
            <div className="drawer-head">
              <div>
                <strong>Apolo&apos;s Drinks</strong>
                <span>Casa de Bebidas</span>
              </div>
              <button className="modal-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">&times;</button>
            </div>
            <div className="drawer-nav">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`drawer-item ${isActive(item.href) ? "active" : ""}`}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              <button className="btn-salir" onClick={salir}>
                {IconoSalir}
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
