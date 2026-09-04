import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { activo: true };
  if (categoria && categoria !== "Todos") {
    where.categoria = categoria;
  }
  if (search) {
    where.nombre = { contains: search };
  }

  const productos = await prisma.producto.findMany({
    where,
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
  });

  return NextResponse.json(productos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const producto = await prisma.producto.create({
    data: {
      nombre: body.nombre,
      categoria: body.categoria,
      precio: body.precio,
      stock: body.stock ?? 0,
      stockMinimo: body.stockMinimo ?? 0,
      esPromo: body.esPromo ?? false,
    },
  });

  return NextResponse.json(producto, { status: 201 });
}
