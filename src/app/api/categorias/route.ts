import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { validar } from "@/lib/validar";
import { NextRequest, NextResponse } from "next/server";

/** Devuelve las categorías con cuántos productos usa cada una. */
export async function GET() {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const [categorias, uso] = await Promise.all([
    prisma.categoria.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }] }),
    prisma.producto.groupBy({ by: ["categoria"], _count: true }),
  ]);

  const conteo = new Map(uso.map((u) => [u.categoria, u._count]));
  return NextResponse.json(
    categorias.map((c) => ({ ...c, productos: conteo.get(c.nombre) ?? 0 })),
  );
}

export async function POST(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const body = await req.json();
  const error = validar(body, {
    nombre: { tipo: "string", min: 1, max: 40, obligatorio: true },
  });
  if (error) return error;

  const nombre = String(body.nombre).trim();

  // El índice único distingue mayúsculas, así que "cervezas" y "Cervezas"
  // entrarían las dos. Para el usuario son la misma categoría.
  const repetida = await prisma.categoria.findFirst({
    where: { nombre: { equals: nombre, mode: "insensitive" } },
  });
  if (repetida) {
    return NextResponse.json({ error: `Ya existe la categoría "${repetida.nombre}"` }, { status: 400 });
  }

  const ultima = await prisma.categoria.findFirst({ orderBy: { orden: "desc" }, select: { orden: true } });
  const categoria = await prisma.categoria.create({
    data: { nombre, orden: (ultima?.orden ?? 0) + 1 },
  });

  return NextResponse.json({ ...categoria, productos: 0 }, { status: 201 });
}
