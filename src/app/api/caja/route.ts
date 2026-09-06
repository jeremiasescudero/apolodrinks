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

  if (fecha) {
    if (!esFechaValida(fecha)) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }
    const caja = await prisma.caja.findUnique({ where: { fecha: aDiaUTC(fecha) } });
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

  // El día lo decide el negocio, no el reloj del servidor: en Vercel corre en UTC.
  const today = aDiaUTC(hoyEnNegocio());

  const existing = await prisma.caja.findUnique({ where: { fecha: today } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una caja abierta para hoy" }, { status: 400 });
  }

  const caja = await prisma.caja.create({
    data: {
      fecha: today,
      montoInicial: Number(body.montoInicial ?? 0),
      estado: "ABIERTA",
    },
  });

  return NextResponse.json(caja, { status: 201 });
}
