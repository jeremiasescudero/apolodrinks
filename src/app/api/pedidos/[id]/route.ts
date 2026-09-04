import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pedido = await prisma.pedido.findUnique({
    where: { id: Number(id) },
    include: {
      proveedor: { select: { nombre: true, telefono: true } },
      items: { include: { producto: { select: { nombre: true } } } },
    },
  });
  if (!pedido) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(pedido);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.estado !== undefined) data.estado = body.estado;
  if (body.notas !== undefined) data.notas = body.notas;

  const pedido = await prisma.pedido.update({
    where: { id: Number(id) },
    data,
    include: {
      proveedor: { select: { nombre: true } },
      items: { include: { producto: { select: { nombre: true } } } },
    },
  });

  return NextResponse.json(pedido);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.pedido.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
