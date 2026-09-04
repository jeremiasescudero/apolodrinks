import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { activo: true };
  if (tipo && tipo !== "Todos") {
    where.tipo = tipo;
  }
  if (search) {
    where.nombre = { contains: search };
  }

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
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
