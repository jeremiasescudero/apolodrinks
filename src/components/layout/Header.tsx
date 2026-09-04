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

  if (pathname === "/login") return null;

  return (
    <header className="main-header">
      <h2>{title}</h2>
    </header>
  );
}
