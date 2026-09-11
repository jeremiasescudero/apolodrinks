-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");


-- Carga inicial: las categorías que ya usan los productos, conservando el orden
-- con el que venían mostrándose. Cualquier categoría inesperada va al final.
INSERT INTO "Categoria" ("nombre", "orden", "createdAt", "updatedAt")
SELECT p."categoria",
       COALESCE(o."orden", 99),
       NOW(),
       NOW()
FROM (SELECT DISTINCT "categoria" FROM "Producto" WHERE "categoria" <> '') AS p
LEFT JOIN (VALUES
  ('Cervezas', 1), ('Gaseosas', 2), ('Aguas', 3), ('Energizantes', 4),
  ('Fernet', 5), ('Vodka', 6), ('Gin', 7), ('Aperitivos', 8),
  ('Vinos', 9), ('Espumantes', 10), ('Promos', 11)
) AS o(nombre, orden) ON o.nombre = p."categoria"
ON CONFLICT ("nombre") DO NOTHING;
