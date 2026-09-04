import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { categoria, porcentaje, redondeo } = await req.json();

  const productos = await prisma.producto.findMany({
    where: { categoria, activo: true },
  });

  const updates = productos.map((p) => {
    let nuevoPrecio = Math.round(p.precio * (1 + porcentaje / 100));
    if (redondeo > 0) {
      nuevoPrecio = Math.round(nuevoPrecio / redondeo) * redondeo;
    }
    return prisma.producto.update({
      where: { id: p.id },
      data: { precio: nuevoPrecio },
    });
  });

  await Promise.all(updates);

  return NextResponse.json({ actualizados: productos.length });
}
