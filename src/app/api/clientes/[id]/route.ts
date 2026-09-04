import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id: Number(id) } });
  if (!cliente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;
  const body = await req.json();

  const cliente = await prisma.cliente.update({
    where: { id: Number(id) },
    data: {
      nombre: body.nombre,
      tipo: body.tipo,
      telefono: body.telefono,
      direccion: body.direccion,
      email: body.email,
      saldo: body.saldo,
    },
  });

  return NextResponse.json(cliente);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;

  await prisma.cliente.update({
    where: { id: Number(id) },
    data: { activo: false },
  });

  return NextResponse.json({ ok: true });
}
