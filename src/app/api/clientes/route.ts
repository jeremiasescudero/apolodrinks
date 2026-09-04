import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { validar, sanitizar } from "@/lib/validar";
import { TIPOS_CLIENTE } from "@/lib/constants";
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
      { nombre: { contains: search, mode: "insensitive" } },
      { telefono: { contains: search, mode: "insensitive" } },
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

  const error = validar(body, {
    nombre: { tipo: "string", min: 1, max: 200, obligatorio: true },
    tipo: { tipo: "enum", valores: TIPOS_CLIENTE },
    telefono: { tipo: "string", max: 50 },
    direccion: { tipo: "string", max: 300 },
    email: { tipo: "string", max: 200 },
    saldo: { tipo: "number" },
  });
  if (error) return error;

  const cliente = await prisma.cliente.create({
    data: {
      nombre: sanitizar(body.nombre),
      tipo: body.tipo ?? "Particular",
      telefono: sanitizar(body.telefono ?? ""),
      direccion: sanitizar(body.direccion ?? ""),
      email: sanitizar(body.email ?? ""),
      saldo: body.saldo ?? 0,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}
