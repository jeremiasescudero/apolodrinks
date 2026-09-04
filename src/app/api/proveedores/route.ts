import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { validar, sanitizar } from "@/lib/validar";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { activo: true };
  if (search) {
    where.nombre = { contains: search, mode: "insensitive" };
  }

  const proveedores = await prisma.proveedor.findMany({
    where,
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(proveedores);
}

export async function POST(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const body = await req.json();

  const error = validar(body, {
    nombre: { tipo: "string", min: 1, max: 200, obligatorio: true },
    categoria: { tipo: "string", max: 100 },
    contacto: { tipo: "string", max: 200 },
    telefono: { tipo: "string", max: 50 },
    email: { tipo: "string", max: 200 },
    direccion: { tipo: "string", max: 300 },
  });
  if (error) return error;

  const proveedor = await prisma.proveedor.create({
    data: {
      nombre: sanitizar(body.nombre),
      categoria: sanitizar(body.categoria ?? ""),
      contacto: sanitizar(body.contacto ?? ""),
      telefono: sanitizar(body.telefono ?? ""),
      email: sanitizar(body.email ?? ""),
      direccion: sanitizar(body.direccion ?? ""),
    },
  });

  return NextResponse.json(proveedor, { status: 201 });
}
