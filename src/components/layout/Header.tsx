"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/": "Inicio",
  "/pedidos": "Pedidos",
  "/productos": "Productos y Precios",
  "/ventas": "Ventas",
  "/clientes": "Clientes",
  "/caja": "Caja Diaria",
  "/entregas": "Entregas",
  "/proveedores": "Proveedores",
};

export default function Header() {
  const pathname = usePathname();
  const title = TITLES[pathname] || "Apolo's Drinks";

  return (
    <header className="main-header">
      <h2>{title}</h2>
      <div className="hdr-search">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="5" />
          <line x1="11" y1="11" x2="14" y2="14" />
        </svg>
        <input type="text" placeholder="Buscar productos, pedidos..." />
      </div>
    </header>
  );
}
