import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;
  const componentes = await prisma.promoComponente.findMany({
    where: { promoId: Number(id) },
    include: { producto: { select: { id: true, nombre: true, categoria: true, stock: true } } },
  });
  return NextResponse.json(componentes);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;
  const body: { productoId: number; cantidad: number }[] = await req.json();

  await prisma.$transaction(async (tx) => {
    await tx.promoComponente.deleteMany({ where: { promoId: Number(id) } });
    if (body.length > 0) {
      await tx.promoComponente.createMany({
        data: body.map((c) => ({
          promoId: Number(id),
          productoId: c.productoId,
          cantidad: c.cantidad,
        })),
      });
    }
  });

  const componentes = await prisma.promoComponente.findMany({
    where: { promoId: Number(id) },
    include: { producto: { select: { id: true, nombre: true, categoria: true } } },
  });

  return NextResponse.json(componentes);
}
