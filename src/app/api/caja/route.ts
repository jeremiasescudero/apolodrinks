import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { validar } from "@/lib/validar";
import { aDiaUTC, esFechaValida, hoyEnNegocio } from "@/lib/fecha";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get("fecha");
  const abierta = searchParams.get("abierta");

  // La caja en curso se busca por estado, no por fecha: un turno que empezó
  // anoche sigue siendo el turno en curso después de las 12.
  if (abierta) {
    const caja = await prisma.caja.findFirst({
      where: { estado: "ABIERTA" },
      orderBy: { openedAt: "desc" },
    });
    return NextResponse.json(caja);
  }

  if (fecha) {
    if (!esFechaValida(fecha)) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }
    const caja = await prisma.caja.findFirst({ where: { fecha: aDiaUTC(fecha) } });
    return NextResponse.json(caja);
  }

  const cajas = await prisma.caja.findMany({
    orderBy: { fecha: "desc" },
    take: 30,
  });
  return NextResponse.json(cajas);
}

export async function POST(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const body = await req.json();

  // Esta ruta no validaba nada: aceptaba texto, negativos o un número absurdo.
  const error = validar(body, {
    montoInicial: { tipo: "number", min: 0, max: 100_000_000 },
  });
  if (error) return error;

  // Sólo puede haber un turno abierto a la vez, sin importar la fecha: si el
  // turno de anoche sigue abierto, hay que cerrarlo a mano antes de abrir otro.
  const abierta = await prisma.caja.findFirst({ where: { estado: "ABIERTA" } });
  if (abierta) {
    return NextResponse.json({ error: "Ya hay una caja abierta. Cerrala antes de abrir otra." }, { status: 400 });
  }

  // La fecha es sólo la etiqueta del día en que se abre el turno.
  const today = aDiaUTC(hoyEnNegocio());

  const caja = await prisma.caja.create({
    data: {
      fecha: today,
      montoInicial: Number(body.montoInicial ?? 0),
      estado: "ABIERTA",
    },
  });

  return NextResponse.json(caja, { status: 201 });
}
