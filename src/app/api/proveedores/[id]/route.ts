import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proveedor = await prisma.proveedor.findUnique({ where: { id: Number(id) } });
  if (!proveedor) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(proveedor);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const proveedor = await prisma.proveedor.update({
    where: { id: Number(id) },
    data: {
      nombre: body.nombre,
      categoria: body.categoria,
      contacto: body.contacto,
      telefono: body.telefono,
      email: body.email,
      direccion: body.direccion,
    },
  });

  return NextResponse.json(proveedor);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await prisma.proveedor.update({
    where: { id: Number(id) },
    data: { activo: false },
  });

  return NextResponse.json({ ok: true });
}
