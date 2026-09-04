import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const caja = await prisma.caja.findUnique({ where: { id: Number(id) } });
  if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
  if (caja.estado === "CERRADA") return NextResponse.json({ error: "La caja está cerrada" }, { status: 400 });

  const movimiento = await prisma.cajaMovimiento.create({
    data: {
      cajaId: Number(id),
      concepto: body.concepto,
      metodoPago: body.metodoPago ?? "",
      monto: body.monto,
      tipo: body.tipo,
    },
  });

  return NextResponse.json(movimiento, { status: 201 });
}
