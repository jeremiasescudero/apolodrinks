-- CreateTable
CREATE TABLE "Encargo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL DEFAULT '',
    "direccion" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "monto" INTEGER NOT NULL DEFAULT 0,
    "metodoPago" TEXT NOT NULL DEFAULT 'Efectivo',
    "notas" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "entregadoAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clienteId" INTEGER,
    CONSTRAINT "Encargo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Encargo_fecha_orden_idx" ON "Encargo"("fecha", "orden");
