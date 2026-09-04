import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const productos = [
  // CERVEZAS 1L
  { nombre: "Heineken 1L", categoria: "Cervezas", precio: 7200, stock: 36, stockMinimo: 24 },
  { nombre: "Schneider 1L", categoria: "Cervezas", precio: 4100, stock: 48, stockMinimo: 24 },
  { nombre: "Imperial Golden 1L", categoria: "Cervezas", precio: 5100, stock: 30, stockMinimo: 24 },
  { nombre: "Imperial IPA 1L", categoria: "Cervezas", precio: 5500, stock: 18, stockMinimo: 12 },
  { nombre: "Córdoba 1L", categoria: "Cervezas", precio: 3500, stock: 42, stockMinimo: 24 },
  { nombre: "Stella Artois 1L", categoria: "Cervezas", precio: 6200, stock: 24, stockMinimo: 12 },
  { nombre: "Quilmes 1L", categoria: "Cervezas", precio: 3900, stock: 60, stockMinimo: 36 },
  { nombre: "Brahma 1L", categoria: "Cervezas", precio: 4100, stock: 48, stockMinimo: 24 },
  { nombre: "Andes Roja 1L", categoria: "Cervezas", precio: 5200, stock: 24, stockMinimo: 12 },
  // CERVEZAS 710
  { nombre: "Heineken 710", categoria: "Cervezas", precio: 6500, stock: 24, stockMinimo: 12 },
  { nombre: "Imperial 710", categoria: "Cervezas", precio: 4300, stock: 36, stockMinimo: 24 },
  { nombre: "Schneider 710", categoria: "Cervezas", precio: 3600, stock: 36, stockMinimo: 24 },
  { nombre: "Corona 710", categoria: "Cervezas", precio: 5600, stock: 18, stockMinimo: 12 },
  { nombre: "Patagonia 710", categoria: "Cervezas", precio: 6000, stock: 3, stockMinimo: 12 },
  { nombre: "Brahma 710", categoria: "Cervezas", precio: 3600, stock: 36, stockMinimo: 24 },
  // CERVEZAS 473
  { nombre: "Heineken 473", categoria: "Cervezas", precio: 4300, stock: 48, stockMinimo: 24 },
  { nombre: "Córdoba 473", categoria: "Cervezas", precio: 2100, stock: 60, stockMinimo: 36 },
  { nombre: "Brahma 473", categoria: "Cervezas", precio: 2500, stock: 72, stockMinimo: 36 },
  { nombre: "Andes Roja 473", categoria: "Cervezas", precio: 3100, stock: 36, stockMinimo: 24 },
  { nombre: "Andes IPA 473", categoria: "Cervezas", precio: 3100, stock: 24, stockMinimo: 12 },
  { nombre: "Corona Chica", categoria: "Cervezas", precio: 4000, stock: 24, stockMinimo: 12 },
  { nombre: "Schneider 473", categoria: "Cervezas", precio: 2500, stock: 48, stockMinimo: 24 },
  // GASEOSAS
  { nombre: "Coca-Cola / Sprite / Fanta 2L", categoria: "Gaseosas", precio: 3800, stock: 72, stockMinimo: 48 },
  { nombre: "Coca-Cola / Sprite 1.5L", categoria: "Gaseosas", precio: 4200, stock: 36, stockMinimo: 24 },
  { nombre: "Coca / Sprite 1.25L Vidrio", categoria: "Gaseosas", precio: 2900, stock: 24, stockMinimo: 12 },
  { nombre: "Coca-Cola 2.5L Descartable", categoria: "Gaseosas", precio: 6200, stock: 18, stockMinimo: 24 },
  { nombre: "Coca-Cola 2.5L Retornable", categoria: "Gaseosas", precio: 4400, stock: 30, stockMinimo: 24 },
  { nombre: "Coca-Cola / Sprite 500", categoria: "Gaseosas", precio: 2000, stock: 60, stockMinimo: 36 },
  { nombre: "Lata de Coca", categoria: "Gaseosas", precio: 1600, stock: 48, stockMinimo: 24 },
  { nombre: "Aquarius", categoria: "Gaseosas", precio: 3800, stock: 24, stockMinimo: 12 },
  { nombre: "Tónica / Pomelo", categoria: "Gaseosas", precio: 4200, stock: 30, stockMinimo: 18 },
  { nombre: "Cepita 1.5L", categoria: "Gaseosas", precio: 3700, stock: 18, stockMinimo: 12 },
  { nombre: "Power 500", categoria: "Gaseosas", precio: 2700, stock: 24, stockMinimo: 12 },
  { nombre: "Pritty 1.5L", categoria: "Gaseosas", precio: 2200, stock: 36, stockMinimo: 24 },
  { nombre: "Pritty 2.25L", categoria: "Gaseosas", precio: 2800, stock: 30, stockMinimo: 24 },
  { nombre: "Pritty 3L", categoria: "Gaseosas", precio: 3400, stock: 24, stockMinimo: 12 },
  { nombre: "Jugo Citric", categoria: "Gaseosas", precio: 6200, stock: 12, stockMinimo: 6 },
  { nombre: "Secco 3L", categoria: "Gaseosas", precio: 2800, stock: 24, stockMinimo: 12 },
  { nombre: "Soda Sifón", categoria: "Gaseosas", precio: 1700, stock: 30, stockMinimo: 18 },
  { nombre: "Soda 500", categoria: "Gaseosas", precio: 1200, stock: 48, stockMinimo: 24 },
  // AGUAS
  { nombre: "Agua 500", categoria: "Aguas", precio: 1000, stock: 80, stockMinimo: 48 },
  { nombre: "Agua 2L", categoria: "Aguas", precio: 1700, stock: 48, stockMinimo: 24 },
  // ENERGIZANTES
  { nombre: "Speed", categoria: "Energizantes", precio: 1800, stock: 60, stockMinimo: 36 },
  { nombre: "Speed XL", categoria: "Energizantes", precio: 2700, stock: 36, stockMinimo: 24 },
  { nombre: "Red Bull", categoria: "Energizantes", precio: 3500, stock: 5, stockMinimo: 18 },
  { nombre: "Monster", categoria: "Energizantes", precio: 3600, stock: 28, stockMinimo: 18 },
  { nombre: "Smirnoff Lata", categoria: "Energizantes", precio: 3800, stock: 18, stockMinimo: 12 },
  { nombre: "Santa Julia Lata", categoria: "Energizantes", precio: 3000, stock: 12, stockMinimo: 12 },
  // FERNET
  { nombre: "Fernet Branca 1L", categoria: "Fernet", precio: 23000, stock: 24, stockMinimo: 18 },
  { nombre: "Fernet Branca 750", categoria: "Fernet", precio: 17000, stock: 36, stockMinimo: 24 },
  { nombre: "Fernet Aniversario (Negro)", categoria: "Fernet", precio: 18500, stock: 12, stockMinimo: 6 },
  { nombre: "Fernet 450", categoria: "Fernet", precio: 12800, stock: 30, stockMinimo: 18 },
  { nombre: "Fernet Petaca", categoria: "Fernet", precio: 5200, stock: 20, stockMinimo: 12 },
  // VODKA
  { nombre: "Skyy", categoria: "Vodka", precio: 12200, stock: 18, stockMinimo: 12 },
  { nombre: "Skyy Chicle", categoria: "Vodka", precio: 15500, stock: 8, stockMinimo: 6 },
  { nombre: "Smirnoff", categoria: "Vodka", precio: 11000, stock: 20, stockMinimo: 12 },
  { nombre: "Absolut", categoria: "Vodka", precio: 30000, stock: 8, stockMinimo: 6 },
  { nombre: "New Style", categoria: "Vodka", precio: 6500, stock: 15, stockMinimo: 12 },
  // GIN
  { nombre: "Gin Gordon", categoria: "Gin", precio: 18000, stock: 12, stockMinimo: 6 },
  { nombre: "Gin Gordon Rosa", categoria: "Gin", precio: 18200, stock: 10, stockMinimo: 6 },
  { nombre: "Gin Blu", categoria: "Gin", precio: 13400, stock: 8, stockMinimo: 6 },
  { nombre: "Gin Aconcagua Rosa", categoria: "Gin", precio: 21000, stock: 6, stockMinimo: 6 },
  { nombre: "Gin Aconcagua Blanco", categoria: "Gin", precio: 21000, stock: 4, stockMinimo: 6 },
  { nombre: "Gin Brighton", categoria: "Gin", precio: 10800, stock: 10, stockMinimo: 6 },
  { nombre: "Gin Brighton Pink", categoria: "Gin", precio: 11800, stock: 8, stockMinimo: 6 },
  { nombre: "Gin Heredero", categoria: "Gin", precio: 14900, stock: 10, stockMinimo: 6 },
  { nombre: "Gin Heredero Pink/Pomelo", categoria: "Gin", precio: 17200, stock: 6, stockMinimo: 6 },
  { nombre: "Gin Bombay", categoria: "Gin", precio: 38000, stock: 4, stockMinimo: 4 },
  { nombre: "Gin Beefeater Pink/Orange", categoria: "Gin", precio: 37500, stock: 3, stockMinimo: 4 },
  { nombre: "Gin Beefeater 750", categoria: "Gin", precio: 28300, stock: 6, stockMinimo: 4 },
  { nombre: "Gin Beefeater 1L", categoria: "Gin", precio: 36000, stock: 4, stockMinimo: 4 },
  // APERITIVOS
  { nombre: "Gancia", categoria: "Aperitivos", precio: 9000, stock: 14, stockMinimo: 8 },
  { nombre: "Campari", categoria: "Aperitivos", precio: 13000, stock: 10, stockMinimo: 6 },
  { nombre: "Carpano", categoria: "Aperitivos", precio: 9100, stock: 8, stockMinimo: 6 },
  { nombre: "Aperol", categoria: "Aperitivos", precio: 12800, stock: 6, stockMinimo: 4 },
  { nombre: "Frizze", categoria: "Aperitivos", precio: 3700, stock: 18, stockMinimo: 12 },
  { nombre: "Dr. Lemon", categoria: "Aperitivos", precio: 4500, stock: 15, stockMinimo: 12 },
  // VINOS
  { nombre: "Toro Tinto Tetra", categoria: "Vinos", precio: 2700, stock: 30, stockMinimo: 18 },
  { nombre: "Nativo Tinto", categoria: "Vinos", precio: 2400, stock: 24, stockMinimo: 12 },
  { nombre: "Nativo Blanco", categoria: "Vinos", precio: 2200, stock: 18, stockMinimo: 12 },
  { nombre: "Balbo", categoria: "Vinos", precio: 3300, stock: 20, stockMinimo: 12 },
  { nombre: "Toro Tinto 1.15", categoria: "Vinos", precio: 4000, stock: 18, stockMinimo: 12 },
  { nombre: "Canciller", categoria: "Vinos", precio: 2600, stock: 24, stockMinimo: 12 },
  { nombre: "Damajuana", categoria: "Vinos", precio: 8800, stock: 6, stockMinimo: 4 },
  { nombre: "Santa Julia Tinto", categoria: "Vinos", precio: 6100, stock: 14, stockMinimo: 8 },
  { nombre: "Santa Julia Tinto Dulce", categoria: "Vinos", precio: 7800, stock: 10, stockMinimo: 6 },
  { nombre: "Chacabuco", categoria: "Vinos", precio: 6300, stock: 8, stockMinimo: 6 },
  { nombre: "Otro Loco", categoria: "Vinos", precio: 4800, stock: 12, stockMinimo: 6 },
  { nombre: "Cordero C/Piel de Lobo", categoria: "Vinos", precio: 6000, stock: 8, stockMinimo: 6 },
  { nombre: "Trumpeter", categoria: "Vinos", precio: 10600, stock: 6, stockMinimo: 4 },
  { nombre: "Alma Mora", categoria: "Vinos", precio: 7100, stock: 8, stockMinimo: 6 },
  { nombre: "Portillo", categoria: "Vinos", precio: 6000, stock: 10, stockMinimo: 6 },
  { nombre: "Prófugo", categoria: "Vinos", precio: 4900, stock: 8, stockMinimo: 6 },
  { nombre: "Náufrago", categoria: "Vinos", precio: 4000, stock: 12, stockMinimo: 6 },
  { nombre: "Gordo en Motoneta", categoria: "Vinos", precio: 4300, stock: 10, stockMinimo: 6 },
  { nombre: "Nampe", categoria: "Vinos", precio: 3600, stock: 12, stockMinimo: 6 },
  { nombre: "Lobo Negro", categoria: "Vinos", precio: 3900, stock: 10, stockMinimo: 6 },
  { nombre: "Luigi Bosca", categoria: "Vinos", precio: 16600, stock: 4, stockMinimo: 4 },
  { nombre: "Rutini", categoria: "Vinos", precio: 17000, stock: 4, stockMinimo: 4 },
  { nombre: "Dilema Blanco", categoria: "Vinos", precio: 4200, stock: 10, stockMinimo: 6 },
  { nombre: "Alarias Blanco", categoria: "Vinos", precio: 4500, stock: 8, stockMinimo: 6 },
  { nombre: "Chacabuco Blanco", categoria: "Vinos", precio: 7600, stock: 6, stockMinimo: 4 },
  { nombre: "Santa Julia Blanco", categoria: "Vinos", precio: 10000, stock: 6, stockMinimo: 6 },
  // ESPUMANTES
  { nombre: "Champagne Nave", categoria: "Espumantes", precio: 5000, stock: 12, stockMinimo: 6 },
  { nombre: "Champagne Du", categoria: "Espumantes", precio: 5700, stock: 10, stockMinimo: 6 },
  { nombre: "Champagne Navarro", categoria: "Espumantes", precio: 12200, stock: 6, stockMinimo: 4 },
  { nombre: "Champagne Chandon", categoria: "Espumantes", precio: 22000, stock: 4, stockMinimo: 4 },
  { nombre: "Dadá Espumante", categoria: "Espumantes", precio: 8900, stock: 8, stockMinimo: 6 },
  // PROMOS
  { nombre: "Fernet 750 + 2 Cocas 2L", categoria: "Promos", precio: 21500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Fernet 750 + 2 Cocas 1.5", categoria: "Promos", precio: 22500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Fernet 750 + 1 Coca 2.25", categoria: "Promos", precio: 21500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Fernet 750 + 1 Coca 2L", categoria: "Promos", precio: 20000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Fernet 1L + 2 Coca 2L", categoria: "Promos", precio: 27300, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Fernet 450 + 1 Coca 2L", categoria: "Promos", precio: 16500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Fernet 450 + 1 Coca 1.5", categoria: "Promos", precio: 16800, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Skyy + 4 Speed", categoria: "Promos", precio: 17500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Skyy + 2 Speed XL", categoria: "Promos", precio: 16000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Skyy + 2 Monster", categoria: "Promos", precio: 17500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Skyy + 1 Cepita 1.5", categoria: "Promos", precio: 15000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Skyy + 4 Red Bull", categoria: "Promos", precio: 21000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Smirnoff + 4 Speed", categoria: "Promos", precio: 16500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Smirnoff + 2 Speed XL", categoria: "Promos", precio: 15000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Smirnoff + 2 Monster", categoria: "Promos", precio: 16500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Smirnoff + 1 Cepita 1.5", categoria: "Promos", precio: 14200, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Smirnoff + 4 Red Bull", categoria: "Promos", precio: 19500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Absolut + 2 Speed XL", categoria: "Promos", precio: 31500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Absolut + 4 Red Bull", categoria: "Promos", precio: 37000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "New Style + 2 Speed XL", categoria: "Promos", precio: 11000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "New Style + 1 Cepita 1.5", categoria: "Promos", precio: 9800, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Campari + 1 Cepita 1.5", categoria: "Promos", precio: 15600, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Gancia + 1 Sprite 2L", categoria: "Promos", precio: 11700, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Gin Gordon + Tónica", categoria: "Promos", precio: 18000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Gin Gordon Rosa + Tónica", categoria: "Promos", precio: 20500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Gin Heredero + Tónica", categoria: "Promos", precio: 18000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Gin Heredero Rosa + Tónica", categoria: "Promos", precio: 20500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Gin Brighton + Tónica", categoria: "Promos", precio: 15000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Gin Brighton Pink + Tónica", categoria: "Promos", precio: 14500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Gin Blu + Tónica", categoria: "Promos", precio: 16000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Gin Aconcagua Blanco + Tónica", categoria: "Promos", precio: 24400, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Gin Aconcagua Rosa + Tónica", categoria: "Promos", precio: 24400, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "2 Balbo + 1 Pritty 2.25", categoria: "Promos", precio: 8500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "2 Balbo + 1 Pritty 3", categoria: "Promos", precio: 9000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "2 Canciller + 1 Pritty 2.25", categoria: "Promos", precio: 8000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "2 Balbo + 1 Secco 3L", categoria: "Promos", precio: 8200, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "2 Vino Toro + 1 Pritty 2.25", categoria: "Promos", precio: 8000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "2 Nativo Tinto + 1 Pritty 2.25", categoria: "Promos", precio: 7500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Chandon + 1 Speed XL", categoria: "Promos", precio: 23500, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Jäger + 4 Red Bull", categoria: "Promos", precio: 52000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Red Label + 4 Red Bull", categoria: "Promos", precio: 50000, stock: 0, stockMinimo: 0, esPromo: true },
  { nombre: "Damonjag + 4 Red Bull", categoria: "Promos", precio: 41000, stock: 0, stockMinimo: 0, esPromo: true },
];

const proveedores = [
  { nombre: "Galpón Bebidas", categoria: "Distribuidora general" },
  { nombre: "Amaranto", categoria: "Distribuidora" },
  { nombre: "Gringo Recalde", categoria: "Distribuidora" },
  { nombre: "Gringo Bellon", categoria: "Distribuidora" },
  { nombre: "Rojo Malbec", categoria: "Vinos" },
  { nombre: "Zeta", categoria: "Distribuidora" },
  { nombre: "3D Distribuidora", categoria: "Distribuidora" },
  { nombre: "López Hnos.", categoria: "Distribuidora" },
  { nombre: "DMG Distribuidora", categoria: "Distribuidora" },
  { nombre: "Quilmes", categoria: "Cervezas" },
  { nombre: "Arcor", categoria: "Gaseosas y alimentos" },
];

const clientes = [
  { nombre: "Bar El Trébol", tipo: "Comercio", telefono: "351 456-1234", direccion: "Bv. San Juan 890" },
  { nombre: "Kiosco Don Pedro", tipo: "Comercio", telefono: "351 678-5678", direccion: "Bv. San Juan 450" },
  { nombre: "Rest. La Pampa", tipo: "Comercio", telefono: "351 234-9012", direccion: "Av. Colón 2100" },
  { nombre: "Disco Zen", tipo: "Comercio", telefono: "351 345-6789", direccion: "Av. H. Yrigoyen 890" },
  { nombre: "Almacén San Martín", tipo: "Comercio", telefono: "351 567-8901", direccion: "Deán Funes 340" },
  { nombre: "Cervecería Norte", tipo: "Comercio", telefono: "351 890-1234", direccion: "" },
  { nombre: "Bar Los Amigos", tipo: "Comercio", telefono: "351 123-4567", direccion: "" },
  { nombre: "Hotel Central", tipo: "Comercio", telefono: "351 456-7890", direccion: "Buenos Aires 150" },
  { nombre: "Minimarket Sol", tipo: "Comercio", telefono: "351 789-0123", direccion: "Chacabuco 780" },
  { nombre: "Café del Centro", tipo: "Comercio", telefono: "351 012-3456", direccion: "9 de Julio 560" },
];

async function main() {
  console.log("Seeding database...");

  await prisma.producto.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.cliente.deleteMany();

  await prisma.producto.createMany({ data: productos });
  console.log(`  ${productos.length} productos creados`);

  await prisma.proveedor.createMany({ data: proveedores });
  console.log(`  ${proveedores.length} proveedores creados`);

  for (const c of clientes) {
    await prisma.cliente.create({ data: c });
  }
  console.log(`  ${clientes.length} clientes creados`);

  console.log("Seed completado!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
