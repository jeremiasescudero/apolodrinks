import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_SESION, verificarSesion } from "./auth";

/**
 * Segunda línea de defensa. El proxy ya filtra, pero la documentación de Next
 * avisa que no debe ser la única barrera: la verificación tiene que estar lo
 * más cerca posible de los datos. Esto se llama en cada handler de la API.
 */
export async function haySesion(): Promise<boolean> {
  const almacen = await cookies();
  return verificarSesion(almacen.get(COOKIE_SESION)?.value, process.env.AUTH_SECRET);
}

export async function exigirSesion(): Promise<NextResponse | null> {
  if (await haySesion()) return null;
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
