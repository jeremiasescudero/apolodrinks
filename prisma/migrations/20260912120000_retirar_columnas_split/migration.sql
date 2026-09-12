-- Se implementó el pago dividido dos veces en paralelo: con tres columnas en
-- Venta (montoPago1, metodoPago2, montoPago2) y con la tabla VentaPago. Se
-- conserva la tabla, que admite cualquier cantidad de métodos, y se retiran
-- las columnas. Al momento de correr esto no existía ninguna venta dividida en
-- las columnas: montoPago1 valía siempre lo mismo que total.
-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "metodoPago2",
DROP COLUMN "montoPago1",
DROP COLUMN "montoPago2";

