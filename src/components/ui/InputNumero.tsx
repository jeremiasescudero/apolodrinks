"use client";

import type { CSSProperties } from "react";

/**
 * Campo para importes y cantidades enteras.
 *
 * No usa type="number" a propósito: ese tipo acepta "e", "+" y "-", cambia el
 * valor si girás la ruedita del mouse encima, y muestra flechitas que en el
 * celular no sirven de nada. Con type="text" + inputMode="numeric" el teléfono
 * abre igual el teclado numérico y el campo solo acepta dígitos.
 *
 * El valor lo maneja el formulario como texto, no como número. Si fuera número,
 * un campo vacío valdría 0, React pintaría "0" y no habría forma de borrarlo.
 */
interface Props {
  value: string;
  onChange: (valor: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  maxDigitos?: number;
  /** Para saldos a favor y bajas de precio, donde el menos significa algo. */
  permiteNegativo?: boolean;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
}

export default function InputNumero({
  value,
  onChange,
  id,
  placeholder = "0",
  disabled,
  maxDigitos = 12,
  permiteNegativo = false,
  className,
  style,
  "aria-label": ariaLabel,
}: Props) {
  return (
    <input
      id={id}
      type="text"
      inputMode={permiteNegativo ? "text" : "numeric"}
      autoComplete="off"
      disabled={disabled}
      value={value}
      placeholder={placeholder}
      className={className}
      style={style}
      aria-label={ariaLabel}
      onChange={(e) => {
        const bruto = e.target.value;
        const negativo = permiteNegativo && bruto.trimStart().startsWith("-");

        // Si pegan un importe con centavos ("50.000,25") hay que descartar la
        // parte decimal antes de sacar los separadores: si no, quedaría
        // 5.000.025, cien veces el monto real. La app maneja pesos enteros.
        const sinCentavos = bruto.replace(/[.,]\d{1,2}$/, "");
        const soloDigitos = sinCentavos.replace(/\D/g, "").slice(0, maxDigitos);
        // "05000" -> "5000", pero un "0" solo se respeta.
        const limpio = soloDigitos.replace(/^0+(?=\d)/, "");

        // Un "-" solo se conserva para poder seguir tipeando el número.
        onChange(negativo ? "-" + limpio : limpio);
      }}
    />
  );
}

/** Convierte a número lo que escribió el usuario. Vacío (o sólo "-") es 0. */
export function aNumero(texto: string): number {
  const t = texto.trim();
  if (t === "" || t === "-") return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

/** Lo inverso: prepara un número del servidor para mostrarlo en el campo. */
export function aTexto(n: number | null | undefined): string {
  if (n === null || n === undefined || n === 0) return "";
  return String(n);
}
