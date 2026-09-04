import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (estado && estado !== "Todos") {
    where.estado = estado;
  }
  if (search) {
    where.OR = [
      { numero: { contains: search } },
      { proveedor: { nombre: { contains: search } } },
    ];
  }

  const pedidos = await prisma.pedido.findMany({
    where,
    include: {
      proveedor: { select: { id: true, nombre: true } },
      items: { include: { producto: { select: { nombre: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pedidos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const lastPedido = await prisma.pedido.findFirst({ orderBy: { id: "desc" } });
  const nextNum = (lastPedido?.id ?? 0) + 1;
  const numero = `P-${String(nextNum).padStart(3, "0")}`;

  const items: { productoId: number; cantidad: number; precioUnitario: number }[] = body.items;
  const total = items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);

  const pedido = await prisma.pedido.create({
    data: {
      numero,
      proveedorId: body.proveedorId,
      notas: body.notas ?? "",
      total,
      items: {
        create: items.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
        })),
      },
    },
    include: {
      proveedor: { select: { nombre: true } },
      items: { include: { producto: { select: { nombre: true } } } },
    },
  });

  return NextResponse.json(pedido, { status: 201 });
}
