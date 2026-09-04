import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;
  const producto = await prisma.producto.findUnique({ where: { id: Number(id) } });
  if (!producto) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(producto);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;
  const body = await req.json();

  const producto = await prisma.producto.update({
    where: { id: Number(id) },
    data: {
      nombre: body.nombre,
      categoria: body.categoria,
      precio: body.precio,
      stock: body.stock,
      stockMinimo: body.stockMinimo,
      esPromo: body.esPromo,
    },
  });

  return NextResponse.json(producto);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;

  await prisma.producto.update({
    where: { id: Number(id) },
    data: { activo: false },
  });

  return NextResponse.json({ ok: true });
}
