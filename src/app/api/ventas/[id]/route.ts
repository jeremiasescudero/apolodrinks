import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;
  const venta = await prisma.venta.findUnique({
    where: { id: Number(id) },
    include: {
      cliente: { select: { nombre: true } },
      items: { include: { producto: { select: { nombre: true } } } },
    },
  });
  if (!venta) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(venta);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;

  await prisma.$transaction(async (tx) => {
    const venta = await tx.venta.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });
    if (!venta) throw new Error("No encontrado");

    for (const item of venta.items) {
      const producto = await tx.producto.findUnique({
        where: { id: item.productoId },
        include: { componentes: true },
      });

      if (producto?.esPromo && producto.componentes.length > 0) {
        for (const comp of producto.componentes) {
          await tx.producto.update({
            where: { id: comp.productoId },
            data: { stock: { increment: comp.cantidad * item.cantidad } },
          });
        }
      } else {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { increment: item.cantidad } },
        });
      }
    }

    await tx.venta.delete({ where: { id: Number(id) } });
  });

  return NextResponse.json({ ok: true });
}
