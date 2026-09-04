import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const { searchParams } = new URL(req.url);
  const metodo = searchParams.get("metodo");
  const search = searchParams.get("search");

  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const fecha = searchParams.get("fecha");

  const where: Record<string, unknown> = {};
  if (metodo && metodo !== "Todos") {
    where.metodoPago = metodo;
  }
  if (search) {
    where.numero = { contains: search };
  }
  if (fecha) {
    const [y, m, d] = fecha.split("-").map(Number);
    const dayStart = new Date(y, m - 1, d);
    const dayEnd = new Date(y, m - 1, d + 1);
    where.createdAt = { gte: dayStart, lt: dayEnd };
  } else if (desde) {
    where.createdAt = {
      gte: new Date(desde),
      ...(hasta ? { lte: new Date(hasta) } : {}),
    };
  }

  const ventas = await prisma.venta.findMany({
    where,
    include: {
      cliente: { select: { id: true, nombre: true } },
      items: { include: { producto: { select: { nombre: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ventas);
}

export async function POST(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const body = await req.json();

  const lastVenta = await prisma.venta.findFirst({ orderBy: { id: "desc" } });
  const nextNum = (lastVenta?.id ?? 0) + 1;
  const numero = `V-${String(nextNum).padStart(3, "0")}`;

  const items: { productoId: number; cantidad: number; precioUnitario: number }[] = body.items;
  const total = items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);

  const venta = await prisma.$transaction(async (tx) => {
    const v = await tx.venta.create({
      data: {
        numero,
        clienteId: body.clienteId || null,
        metodoPago: body.metodoPago,
        total,
        items: {
          create: items.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
          })),
        },
      },
      include: {
        cliente: { select: { nombre: true } },
        items: { include: { producto: { select: { nombre: true } } } },
      },
    });

    for (const item of items) {
      const producto = await tx.producto.findUnique({
        where: { id: item.productoId },
        include: { componentes: true },
      });

      if (producto?.esPromo && producto.componentes.length > 0) {
        for (const comp of producto.componentes) {
          await tx.producto.update({
            where: { id: comp.productoId },
            data: { stock: { decrement: comp.cantidad * item.cantidad } },
          });
        }
      } else {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { decrement: item.cantidad } },
        });
      }
    }

    return v;
  });

  return NextResponse.json(venta, { status: 201 });
}
