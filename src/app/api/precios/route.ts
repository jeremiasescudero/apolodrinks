import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { validar } from "@/lib/validar";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const body = await req.json();

  // La lista de categorías ahora vive en la base, no en una constante.
  const categorias = (await prisma.categoria.findMany({ select: { nombre: true } })).map((c) => c.nombre);

  const error = validar(body, {
    categoria: { tipo: "enum", valores: categorias, obligatorio: true },
    porcentaje: { tipo: "number", min: -100, max: 1000, obligatorio: true },
    redondeo: { tipo: "number", min: 0 },
  });
  if (error) return error;

  const { categoria, porcentaje, redondeo } = body;

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
