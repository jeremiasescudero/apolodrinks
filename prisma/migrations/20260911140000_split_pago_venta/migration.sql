-- AlterTable
-- Permite dividir el pago de una venta en dos métodos. montoPago1 guarda el
-- total completo cuando no se divide, para no perder el dato en ventas viejas.
ALTER TABLE "Venta" ADD COLUMN     "montoPago1" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Venta" ADD COLUMN     "metodoPago2" TEXT;
ALTER TABLE "Venta" ADD COLUMN     "montoPago2" INTEGER NOT NULL DEFAULT 0;

-- Las ventas ya cargadas no estaban divididas: su pago completo fue con
-- metodoPago, así que montoPago1 pasa a valer lo mismo que total.
UPDATE "Venta" SET "montoPago1" = "total";
