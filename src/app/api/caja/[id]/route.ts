import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;
  const caja = await prisma.caja.findUnique({ where: { id: Number(id) } });
  if (!caja) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(caja);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;
  const body = await req.json();

  if (body.action === "cerrar") {
    const caja = await prisma.caja.findUnique({ where: { id: Number(id) } });
    if (!caja) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (caja.estado === "CERRADA") return NextResponse.json({ error: "La caja ya está cerrada" }, { status: 400 });

    const updated = await prisma.caja.update({
      where: { id: Number(id) },
      data: { estado: "CERRADA", closedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
