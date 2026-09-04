import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { validar, sanitizar } from "@/lib/validar";
import { CATEGORIAS } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { activo: true };
  if (categoria && categoria !== "Todos") {
    where.categoria = categoria;
  }
  if (search) {
    where.nombre = { contains: search, mode: "insensitive" };
  }

  const productos = await prisma.producto.findMany({
    where,
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
  });

  return NextResponse.json(productos);
}

export async function POST(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const body = await req.json();

  const error = validar(body, {
    nombre: { tipo: "string", min: 1, max: 200, obligatorio: true },
    categoria: { tipo: "enum", valores: CATEGORIAS, obligatorio: true },
    precio: { tipo: "number", min: 0, obligatorio: true },
    stock: { tipo: "number", min: 0 },
    stockMinimo: { tipo: "number", min: 0 },
    esPromo: { tipo: "boolean" },
  });
  if (error) return error;

  const producto = await prisma.producto.create({
    data: {
      nombre: sanitizar(body.nombre),
      categoria: body.categoria,
      precio: body.precio,
      stock: body.stock ?? 0,
      stockMinimo: body.stockMinimo ?? 0,
      esPromo: body.esPromo ?? false,
    },
  });

  return NextResponse.json(producto, { status: 201 });
}
