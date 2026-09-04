import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_SESION,
  DURACION_SESION_SEG,
  compararConstante,
  configAuth,
  firmarSesion,
  verificarPassword,
} from "@/lib/auth";

const MAX_INTENTOS = 8;
const VENTANA_MS = 15 * 60 * 1000;

// Freno en memoria. Alcanza para un servidor único, que es este caso; si algún
// día corre en varias instancias hay que moverlo a un almacén compartido.
const intentos = new Map<string, { fallos: number; desde: number }>();

function origen(req: NextRequest): string {
  const reenviado = req.headers.get("x-forwarded-for");
  return (reenviado ? reenviado.split(",")[0] : null)?.trim() || "desconocido";
}

function bloqueado(ip: string): boolean {
  const reg = intentos.get(ip);
  if (!reg) return false;
  if (Date.now() - reg.desde > VENTANA_MS) {
    intentos.delete(ip);
    return false;
  }
  return reg.fallos >= MAX_INTENTOS;
}

function anotarFallo(ip: string) {
  const reg = intentos.get(ip);
  if (!reg || Date.now() - reg.desde > VENTANA_MS) {
    intentos.set(ip, { fallos: 1, desde: Date.now() });
    return;
  }
  reg.fallos += 1;
}

export async function POST(req: NextRequest) {
  const config = configAuth();
  if (!config) {
    // Sin credenciales configuradas no se entra: ante la duda, cerrado.
    return NextResponse.json({ error: "El acceso no está configurado en el servidor" }, { status: 503 });
  }

  const ip = origen(req);
  if (bloqueado(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos fallidos. Esperá unos minutos." },
      { status: 429 },
    );
  }

  let usuario = "";
  let password = "";
  try {
    const cuerpo = await req.json();
    usuario = typeof cuerpo.usuario === "string" ? cuerpo.usuario : "";
    password = typeof cuerpo.password === "string" ? cuerpo.password : "";
  } catch {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  // Se verifican los dos siempre, aunque el usuario ya no coincida: si cortáramos
  // antes, el tiempo de respuesta delataría cuál de los dos campos está bien.
  const usuarioOk = compararConstante(usuario, config.usuario);
  const passwordOk = verificarPassword(password, config.hash);

  if (!usuarioOk || !passwordOk) {
    anotarFallo(ip);
    // Un solo mensaje para los dos casos: no le decimos a nadie qué acertó.
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  intentos.delete(ip);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, firmarSesion(config.secreto), {
    httpOnly: true,                                  // fuera del alcance de cualquier script
    sameSite: "lax",                                 // corta el CSRF desde otros sitios
    secure: process.env.NODE_ENV === "production",   // sobre HTTPS no viaja en claro
    path: "/",
    maxAge: DURACION_SESION_SEG,
  });
  return res;
}
