"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Inicio",
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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>Apolo&apos;s Drinks</h1>
        <p>Casa de Bebidas</p>
      </div>

      <div className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <strong>Apolo&apos;s Drinks</strong>
        <br />
        Córdoba, Argentina
      </div>
    </nav>
  );
}
