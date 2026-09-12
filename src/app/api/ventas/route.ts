import { prisma } from "@/lib/prisma";
import { exigirSesion } from "@/lib/guard";
import { esFechaValida, rangoDelDia } from "@/lib/fecha";
import { validar } from "@/lib/validar";
import { METODOS_PAGO } from "@/lib/constants";
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
    // Por la relación, no por el resumen: una venta mitad efectivo y mitad
    // transferencia tiene que aparecer al filtrar por cualquiera de los dos.
    where.pagos = { some: { metodoPago: metodo } };
  }
  if (search) {
    where.numero = { contains: search, mode: "insensitive" };
  }
  // Ventas de un turno de caja: se toman por el rango real entre la apertura y
  // el cierre, no por fecha del calendario. Un turno puede cruzar la medianoche
  // y esas ventas tienen que quedar en el cierre al que pertenecen.
  const cajaId = searchParams.get("cajaId");
  if (cajaId) {
    const caja = await prisma.caja.findUnique({ where: { id: Number(cajaId) } });
    if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });

    // Un turno termina cuando se cierra o cuando arranca el siguiente, lo que
    // pase primero. Sin ese tope, un turno que quedó sin cerrar se llevaría
    // todas las ventas posteriores, incluidas las de los turnos que vinieron
    // después.
    const siguiente = await prisma.caja.findFirst({
      where: { openedAt: { gt: caja.openedAt } },
      orderBy: { openedAt: "asc" },
      select: { openedAt: true },
    });
    const hasta = caja.closedAt ?? siguiente?.openedAt ?? null;
    where.createdAt = { gte: caja.openedAt, ...(hasta ? { lt: hasta } : {}) };
  } else if (fecha) {
    if (!esFechaValida(fecha)) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }
    // El día del negocio, no el del servidor: una venta de las 22:00 en Córdoba
    // caía en el día siguiente y quedaba fuera del cierre de caja.
    const { desde: dayStart, hasta: dayEnd } = rangoDelDia(fecha);
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
      pagos: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ventas);
}

export async function POST(req: NextRequest) {
  const bloqueo = await exigirSesion();
  if (bloqueo) return bloqueo;

  const body = await req.json();

  const error = validar(body, {
    clienteId: { tipo: "number" },
    metodoPago: { tipo: "enum", valores: METODOS_PAGO },
    items: { tipo: "array", minLen: 1, obligatorio: true },
    pagos: { tipo: "array", minLen: 1 },
  });
  if (error) return error;

  const lastVenta = await prisma.venta.findFirst({ orderBy: { id: "desc" } });
  const nextNum = (lastVenta?.id ?? 0) + 1;
  const numero = `V-${String(nextNum).padStart(3, "0")}`;

  const items: { productoId: number; cantidad: number; precioUnitario: number }[] = body.items;
  const total = items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);

  // Una venta puede cobrarse con varios medios. Si viene el formato viejo de un
  // solo método, se arma un pago único por el total: así siguen andando los
  // llamados que no conocen los pagos combinados.
  const pagos: { metodoPago: string; monto: number }[] = Array.isArray(body.pagos) && body.pagos.length > 0
    ? body.pagos
    : [{ metodoPago: body.metodoPago, monto: total }];

  for (const pago of pagos) {
    if (!(METODOS_PAGO as readonly string[]).includes(pago?.metodoPago)) {
      return NextResponse.json({ error: `Método de pago inválido: ${pago?.metodoPago}` }, { status: 400 });
    }
    if (!Number.isInteger(pago.monto) || pago.monto <= 0) {
      return NextResponse.json({ error: "Cada pago tiene que ser un monto mayor a cero" }, { status: 400 });
    }
  }

  // Sin esta comprobación se podría registrar una venta cobrada de menos o de
  // más, y el arqueo de caja nunca cerraría.
  const sumaPagos = pagos.reduce((s, p) => s + p.monto, 0);
  if (sumaPagos !== total) {
    return NextResponse.json(
      { error: `Los pagos suman ${sumaPagos} y la venta es de ${total}` },
      { status: 400 },
    );
  }

  // Un método repetido dos veces es casi siempre un error de carga.
  const metodosUsados = new Set(pagos.map((p) => p.metodoPago));
  if (metodosUsados.size !== pagos.length) {
    return NextResponse.json({ error: "Hay un método de pago repetido" }, { status: 400 });
  }

  // Resumen para la lista y los filtros rápidos; el detalle va en `pagos`.
  const resumenMetodo = pagos.length === 1 ? pagos[0].metodoPago : "Mixto";

  const venta = await prisma.$transaction(async (tx) => {
    // El costo se lee del servidor, nunca de lo que mande el navegador, y se
    // congela en la venta: así la ganancia de un cierre ya hecho no cambia
    // aunque después se actualice el costo del producto.
    const productos = await tx.producto.findMany({
      where: { id: { in: items.map((i) => i.productoId) } },
      select: { id: true, costo: true },
    });
    const costoPorProducto = new Map(productos.map((p) => [p.id, p.costo]));

    const v = await tx.venta.create({
      data: {
        numero,
        clienteId: body.clienteId || null,
        metodoPago: resumenMetodo,
        total,
        pagos: { create: pagos.map((p) => ({ metodoPago: p.metodoPago, monto: p.monto })) },
        items: {
          create: items.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
            costoUnitario: costoPorProducto.get(i.productoId) ?? 0,
          })),
        },
      },
      include: {
        cliente: { select: { nombre: true } },
        items: { include: { producto: { select: { nombre: true } } } },
        pagos: true,
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
