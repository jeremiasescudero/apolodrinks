/*
  Pone las migraciones al día con schema.prisma: el schema ya declaraba
  PromoComponente y un Pedido asociado a Proveedor, pero no existía la
  migración correspondiente.

  Warnings:

  - You are about to drop the column `clienteId` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `direccionEntrega` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `tipoEntrega` on the `Pedido` table. All the data in the column will be lost.
  - Added the required column `proveedorId` to the `Pedido` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "PromoComponente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "promoId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "PromoComponente_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Producto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromoComponente_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pedido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "total" INTEGER NOT NULL DEFAULT 0,
    "notas" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pedido_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pedido" ("createdAt", "estado", "id", "notas", "numero", "total", "updatedAt") SELECT "createdAt", "estado", "id", "notas", "numero", "total", "updatedAt" FROM "Pedido";
DROP TABLE "Pedido";
ALTER TABLE "new_Pedido" RENAME TO "Pedido";
CREATE UNIQUE INDEX "Pedido_numero_key" ON "Pedido"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
