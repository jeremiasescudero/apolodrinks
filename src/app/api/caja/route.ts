import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get("fecha");

  if (fecha) {
    const [y, m, d] = fecha.split("-").map(Number);
    const day = new Date(y, m - 1, d);
    const caja = await prisma.caja.findUnique({ where: { fecha: day } });
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.caja.findUnique({ where: { fecha: today } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una caja abierta para hoy" }, { status: 400 });
  }

  const caja = await prisma.caja.create({
    data: {
      fecha: today,
      montoInicial: body.montoInicial ?? 0,
      estado: "ABIERTA",
    },
  });

  return NextResponse.json(caja, { status: 201 });
}
