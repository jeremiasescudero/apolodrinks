"use client";

/**
 * Campo para importes y cantidades enteras.
 *
 * No usa type="number" a propósito: ese tipo acepta "e", "+" y "-", cambia el
 * valor si girás la ruedita del mouse encima, y muestra flechitas que en el
 * celular no sirven de nada. Con type="text" + inputMode="numeric" el teléfono
 * abre igual el teclado numérico y el campo solo acepta dígitos.
 *
 * El valor lo maneja el formulario como texto, no como número. Si fuera número,
 * un campo vacío valdría 0, React pintaría "0" y no habría forma de borrarlo:
 * es justo el problema que tenía la apertura de caja.
 */
interface Props {
  value: string;
  onChange: (valor: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  maxDigitos?: number;
}

export default function InputNumero({
  value,
  onChange,
  id,
  placeholder = "0",
  disabled,
  maxDigitos = 12,
}: Props) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        // Si pegan un importe con centavos ("50.000,25") hay que descartar la
        // parte decimal antes de sacar los separadores: si no, quedaría
        // 5.000.025, cien veces el monto real. La app maneja pesos enteros.
        const sinCentavos = e.target.value.replace(/[.,]\d{1,2}$/, "");
        const soloDigitos = sinCentavos.replace(/\D/g, "").slice(0, maxDigitos);
        // "05000" -> "5000", pero un "0" solo se respeta.
        onChange(soloDigitos.replace(/^0+(?=\d)/, ""));
      }}
    />
  );
}

/** Convierte a número lo que escribió el usuario. Vacío es 0, no un error. */
export function aNumero(texto: string): number {
  if (texto.trim() === "") return 0;
  const n = Number(texto);
  return Number.isFinite(n) ? n : NaN;
}
