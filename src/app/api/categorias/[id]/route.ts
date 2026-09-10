import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { validar } from "@/lib/validar";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;
  const body = await req.json();
  const error = validar(body, {
    nombre: { tipo: "string", min: 1, max: 40, obligatorio: true },
  });
  if (error) return error;

  const categoria = await prisma.categoria.findUnique({ where: { id: Number(id) } });
  if (!categoria) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const nombre = String(body.nombre).trim();
  if (nombre === categoria.nombre) {
    return NextResponse.json(categoria);
  }

  const repetida = await prisma.categoria.findFirst({
    where: { nombre: { equals: nombre, mode: "insensitive" }, id: { not: categoria.id } },
  });
  if (repetida) {
    return NextResponse.json({ error: `Ya existe la categoría "${repetida.nombre}"` }, { status: 400 });
  }

  // Los productos guardan el nombre, no el id, así que el renombre tiene que
  // arrastrarlos. En una sola transacción: si falla algo, no queda a medias con
  // productos apuntando a una categoría que ya no existe.
  const [actualizada, movidos] = await prisma.$transaction([
    prisma.categoria.update({ where: { id: categoria.id }, data: { nombre } }),
    prisma.producto.updateMany({ where: { categoria: categoria.nombre }, data: { categoria: nombre } }),
  ]);

  return NextResponse.json({ ...actualizada, productosMovidos: movidos.count });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { id } = await params;
  const categoria = await prisma.categoria.findUnique({ where: { id: Number(id) } });
  if (!categoria) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  // Borrarla dejaría productos en una categoría que ya no figura en ningún lado:
  // no aparecerían en los filtros y no se podrían editar sin reasignarlos.
  const enUso = await prisma.producto.count({ where: { categoria: categoria.nombre } });
  if (enUso > 0) {
    return NextResponse.json(
      { error: `No se puede borrar: ${enUso} producto${enUso === 1 ? "" : "s"} usa${enUso === 1 ? "" : "n"} esta categoría` },
      { status: 400 },
    );
  }

  await prisma.categoria.delete({ where: { id: categoria.id } });
  return NextResponse.json({ ok: true });
}
