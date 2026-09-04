import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encargo = await prisma.encargo.findUnique({ where: { id: Number(id) } });
  if (!encargo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(encargo);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const encargoId = Number(id);

  // Reordenar la hoja de ruta: intercambia el orden con el vecino.
  if (body.action === "mover") {
    const actual = await prisma.encargo.findUnique({ where: { id: encargoId } });
    if (!actual) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const vecino = await prisma.encargo.findFirst({
      where: {
        fecha: actual.fecha,
        orden: body.direccion === "subir" ? { lt: actual.orden } : { gt: actual.orden },
      },
      orderBy: { orden: body.direccion === "subir" ? "desc" : "asc" },
    });
    if (!vecino) return NextResponse.json(actual);

    await prisma.$transaction([
      prisma.encargo.update({ where: { id: actual.id }, data: { orden: vecino.orden } }),
      prisma.encargo.update({ where: { id: vecino.id }, data: { orden: actual.orden } }),
    ]);

    return NextResponse.json({ ok: true });
  }

  const data: Record<string, unknown> = {};
  if (body.nombre !== undefined) data.nombre = body.nombre.trim();
  if (body.telefono !== undefined) data.telefono = body.telefono.trim();
  if (body.direccion !== undefined) data.direccion = body.direccion.trim();
  if (body.detalle !== undefined) data.detalle = body.detalle.trim();
  if (body.monto !== undefined) data.monto = body.monto;
  if (body.metodoPago !== undefined) data.metodoPago = body.metodoPago;
  if (body.notas !== undefined) data.notas = body.notas.trim();
  if (body.estado !== undefined) {
    data.estado = body.estado;
    data.entregadoAt = body.estado === "ENTREGADO" ? new Date() : null;
  }

  const encargo = await prisma.encargo.update({ where: { id: encargoId }, data });
  return NextResponse.json(encargo);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.encargo.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
