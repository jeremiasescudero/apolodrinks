import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { activo: true };
  if (tipo && tipo !== "Todos") {
    where.tipo = tipo;
  }
  if (search) {
    where.OR = [
      { nombre: { contains: search } },
      { telefono: { contains: search } },
    ];
  }

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const body = await req.json();

  const cliente = await prisma.cliente.create({
    data: {
      nombre: body.nombre,
      tipo: body.tipo ?? "Particular",
      telefono: body.telefono ?? "",
      direccion: body.direccion ?? "",
      email: body.email ?? "",
      saldo: body.saldo ?? 0,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}
