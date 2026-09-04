/**
 * Genera las tres variables de entorno del login.
 *
 *   npm run credenciales
 *
 * La contraseña se pide por teclado y no se muestra ni queda en el historial
 * de la terminal. Lo único que sale por pantalla es el hash, que es público:
 * de él no se puede volver a la contraseña.
 */
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline";
import { hashearPassword } from "../src/lib/auth";

function preguntar(texto: string, oculto = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      rl.close();
      if (oculto) process.stdout.write("\n");
      resolve(respuesta);
    });
    if (oculto) {
      const salida = rl as unknown as { output: NodeJS.WriteStream; _writeToOutput: (s: string) => void };
      salida._writeToOutput = () => {};
    }
  });
}

async function main() {
  console.log("\n  Credenciales de acceso — Apolo's Drinks\n");

  const usuario = (await preguntar("  Usuario: ")).trim();
  if (!usuario) {
    console.error("\n  El usuario no puede quedar vacío.\n");
    process.exit(1);
  }

  const password = await preguntar("  Contraseña: ", true);
  if (password.length < 12) {
    console.error("\n  Usá al menos 12 caracteres. Con menos, el hash no te salva.\n");
    process.exit(1);
  }

  const repetida = await preguntar("  Repetir contraseña: ", true);
  if (password !== repetida) {
    console.error("\n  No coinciden.\n");
    process.exit(1);
  }

  console.log("\n  Calculando el hash (tarda unos segundos a propósito)...\n");

  const lineas = [
    `AUTH_USUARIO="${usuario}"`,
    `AUTH_PASSWORD_HASH="${hashearPassword(password)}"`,
    `AUTH_SECRET="${randomBytes(48).toString("base64url")}"`,
  ];

  console.log("  Pegá estas tres líneas en el archivo .env:\n");
  console.log(lineas.map((l) => "    " + l).join("\n"));
  console.log("\n  Ojo: si cambiás AUTH_SECRET se cierran todas las sesiones abiertas.\n");
}

main();
