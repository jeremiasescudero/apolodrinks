-- CreateTable
CREATE TABLE "VentaPago" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,

    CONSTRAINT "VentaPago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VentaPago_ventaId_idx" ON "VentaPago"("ventaId");

-- CreateIndex
CREATE INDEX "VentaPago_metodoPago_idx" ON "VentaPago"("metodoPago");

-- AddForeignKey
ALTER TABLE "VentaPago" ADD CONSTRAINT "VentaPago_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Las ventas que ya existen pasan a tener un pago único por su total: así el
-- arqueo por método sigue dando lo mismo que antes y no hay que tratar distinto
-- a las viejas.
INSERT INTO "VentaPago" ("ventaId", "metodoPago", "monto")
SELECT "id", "metodoPago", "total" FROM "Venta";
