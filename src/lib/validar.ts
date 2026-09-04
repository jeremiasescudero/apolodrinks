import { NextResponse } from "next/server";

type Regla =
  | { tipo: "string"; min?: number; max?: number; obligatorio?: boolean }
  | { tipo: "number"; min?: number; max?: number; obligatorio?: boolean }
  | { tipo: "boolean"; obligatorio?: boolean }
  | { tipo: "enum"; valores: readonly string[]; obligatorio?: boolean }
  | { tipo: "array"; minLen?: number; obligatorio?: boolean };

type Esquema = Record<string, Regla>;

function revisarCampo(valor: unknown, regla: Regla, campo: string): string | null {
  if (valor === undefined || valor === null || valor === "") {
    return regla.obligatorio ? `"${campo}" es obligatorio` : null;
  }

  switch (regla.tipo) {
    case "string": {
      if (typeof valor !== "string") return `"${campo}" debe ser texto`;
      const s = valor.trim();
      if (regla.min && s.length < regla.min) return `"${campo}" debe tener al menos ${regla.min} caracteres`;
      if (regla.max && s.length > regla.max) return `"${campo}" no puede superar ${regla.max} caracteres`;
      break;
    }
    case "number": {
      const n = Number(valor);
      if (isNaN(n)) return `"${campo}" debe ser un número`;
      if (regla.min !== undefined && n < regla.min) return `"${campo}" no puede ser menor a ${regla.min}`;
      if (regla.max !== undefined && n > regla.max) return `"${campo}" no puede superar ${regla.max}`;
      break;
    }
    case "boolean":
      if (typeof valor !== "boolean") return `"${campo}" debe ser verdadero o falso`;
      break;
    case "enum":
      if (!regla.valores.includes(valor as string)) return `"${campo}" debe ser uno de: ${regla.valores.join(", ")}`;
      break;
    case "array":
      if (!Array.isArray(valor)) return `"${campo}" debe ser una lista`;
      if (regla.minLen && valor.length < regla.minLen) return `"${campo}" debe tener al menos ${regla.minLen} elemento(s)`;
      break;
  }
  return null;
}

export function validar(body: Record<string, unknown>, esquema: Esquema): NextResponse | null {
  const extras = Object.keys(body).filter((k) => !(k in esquema));
  if (extras.length > 0) {
    return NextResponse.json({ error: `Campos no permitidos: ${extras.join(", ")}` }, { status: 400 });
  }

  for (const [campo, regla] of Object.entries(esquema)) {
    const err = revisarCampo(body[campo], regla, campo);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }

  return null;
}

export function sanitizar(valor: string): string {
  return valor.trim().replace(/[<>]/g, "");
}
