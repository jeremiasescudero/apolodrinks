import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarSesion } from "@/lib/sesion";

// Lo único que se sirve sin sesión: la pantalla de login y el endpoint que la atiende.
const RUTAS_PUBLICAS = new Set(["/login", "/api/auth/login"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const conSesion = await verificarSesion(req.cookies.get(COOKIE_SESION)?.value, process.env.AUTH_SECRET);

  if (RUTAS_PUBLICAS.has(pathname)) {
    // Ya adentro, el login no tiene sentido.
    if (conSesion && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (conSesion) return NextResponse.next();

  // La API contesta 401; una redirección a HTML rompería a quien la consuma.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  // Todo pasa por acá salvo los estáticos, que si se bloquean dejan la pantalla sin CSS.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
