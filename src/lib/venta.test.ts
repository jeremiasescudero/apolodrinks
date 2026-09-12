import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularLinea, resumenVenta } from "./venta";

test("calcularLinea: ganancia es precio menos costo por la cantidad", () => {
  const r = calcularLinea({ precioUnitario: 11000, costoUnitario: 6000, cantidad: 10 });
  assert.equal(r.venta, 110000);
  assert.equal(r.costo, 60000);
  assert.equal(r.ganancia, 50000);
});

test("calcularLinea: el precio mayorista recalcula la ganancia hacia abajo", () => {
  // Mismo producto (costo 6000), pero vendido al por mayor a 8000 en vez de 14200.
  const minorista = calcularLinea({ precioUnitario: 14200, costoUnitario: 6000, cantidad: 1 });
  const mayorista = calcularLinea({ precioUnitario: 8000, costoUnitario: 6000, cantidad: 1 });
  assert.equal(minorista.ganancia, 8200);
  assert.equal(mayorista.ganancia, 2000);
  assert.ok(mayorista.margen !== null && mayorista.margen < minorista.margen!);
});

test("calcularLinea: vender por debajo del costo da ganancia negativa", () => {
  const r = calcularLinea({ precioUnitario: 5000, costoUnitario: 6000, cantidad: 3 });
  assert.equal(r.ganancia, -3000);
});

test("calcularLinea: sin costo cargado no informa margen", () => {
  const r = calcularLinea({ precioUnitario: 5000, costoUnitario: 0, cantidad: 2 });
  assert.equal(r.margen, null);
  assert.equal(r.ganancia, 10000); // venta - 0
});

test("resumenVenta: suma venta, costo y ganancia de varias líneas", () => {
  const r = resumenVenta([
    { precioUnitario: 11000, costoUnitario: 6000, cantidad: 10 },
    { precioUnitario: 7500, costoUnitario: 4000, cantidad: 6 },
  ]);
  assert.equal(r.totalVenta, 110000 + 45000);
  assert.equal(r.totalCosto, 60000 + 24000);
  assert.equal(r.ganancia, 50000 + 21000);
  assert.equal(r.unidadesSinCosto, 0);
});

test("resumenVenta: las unidades sin costo quedan fuera de la ganancia pero suman a la venta", () => {
  const r = resumenVenta([
    { precioUnitario: 10000, costoUnitario: 6000, cantidad: 1 }, // con costo
    { precioUnitario: 5000, costoUnitario: 0, cantidad: 3 },     // sin costo
  ]);
  assert.equal(r.totalVenta, 10000 + 15000);
  assert.equal(r.totalCosto, 6000);
  assert.equal(r.ganancia, 4000); // solo la primera línea
  assert.equal(r.unidadesSinCosto, 3);
});

test("resumenVenta: carrito vacío da todo en cero y margen nulo", () => {
  const r = resumenVenta([]);
  assert.deepEqual(r, { totalVenta: 0, totalCosto: 0, ganancia: 0, margen: null, unidadesSinCosto: 0 });
});
