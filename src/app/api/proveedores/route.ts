import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { activo: true };
  if (search) {
    where.nombre = { contains: search };
  }

  const proveedores = await prisma.proveedor.findMany({
    where,
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(proveedores);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const proveedor = await prisma.proveedor.create({
    data: {
      nombre: body.nombre,
      categoria: body.categoria ?? "",
      contacto: body.contacto ?? "",
      telefono: body.telefono ?? "",
      email: body.email ?? "",
      direccion: body.direccion ?? "",
    },
  });

  return NextResponse.json(proveedor, { status: 201 });
}
