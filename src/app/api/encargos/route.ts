import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { NextRequest, NextResponse } from "next/server";

function parseFecha(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export async function GET(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get("fecha");
  const estado = searchParams.get("estado");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (fecha) {
    where.fecha = parseFecha(fecha);
  }
  if (estado && estado !== "Todos") {
    where.estado = estado;
  }
  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: "insensitive" } },
      { telefono: { contains: search, mode: "insensitive" } },
      { direccion: { contains: search, mode: "insensitive" } },
      { detalle: { contains: search, mode: "insensitive" } },
    ];
  }

  const encargos = await prisma.encargo.findMany({
    where,
    orderBy: [{ fecha: "desc" }, { orden: "asc" }],
  });

  return NextResponse.json(encargos);
}

export async function POST(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const body = await req.json();

  if (!body.nombre?.trim() || !body.direccion?.trim()) {
    return NextResponse.json({ error: "Nombre y dirección son obligatorios" }, { status: 400 });
  }

  const fecha = parseFecha(body.fecha);

  // El encargo nuevo va al final de la hoja de ruta del día.
  const ultimo = await prisma.encargo.findFirst({
    where: { fecha },
    orderBy: { orden: "desc" },
    select: { orden: true },
  });

  let clienteId: number | null = body.clienteId ?? null;

  // "Guardar en clientes" crea la ficha para no volver a tipear la dirección.
  if (!clienteId && body.guardarCliente) {
    const cliente = await prisma.cliente.create({
      data: {
        nombre: body.nombre.trim(),
        telefono: body.telefono?.trim() ?? "",
        direccion: body.direccion.trim(),
      },
    });
    clienteId = cliente.id;
  }

  const encargo = await prisma.encargo.create({
    data: {
      fecha,
      orden: (ultimo?.orden ?? 0) + 1,
      nombre: body.nombre.trim(),
      telefono: body.telefono?.trim() ?? "",
      direccion: body.direccion.trim(),
      detalle: body.detalle?.trim() ?? "",
      monto: body.monto ?? 0,
      metodoPago: body.metodoPago ?? "Efectivo",
      notas: body.notas?.trim() ?? "",
      clienteId,
    },
  });

  return NextResponse.json(encargo, { status: 201 });
}
