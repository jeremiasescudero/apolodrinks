-- DropIndex
DROP INDEX "Caja_fecha_key";

-- CreateIndex
CREATE INDEX "Caja_fecha_idx" ON "Caja"("fecha");

-- CreateIndex
CREATE INDEX "Caja_estado_idx" ON "Caja"("estado");

