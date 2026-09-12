# Architecture Decision Records

Record significant architectural decisions here.

The purpose is to prevent future developers and AI agents from accidentally reversing intentional decisions.

## Format

```md
## ADR-XXX — Title

Date: YYYY-MM-DD
Status: Accepted

### Context

Why was this decision necessary?

### Decision

What did we decide?

### Consequences

What becomes easier or harder?

### Alternatives considered

What else was considered and why was it rejected?
```

---

## ADR-001 — Repository is the source of truth

Date: [DATE]
Status: Accepted

### Context

AI coding agents need consistent project rules.

### Decision

Engineering conventions, architecture, testing requirements, and important decisions are documented in the repository.

### Consequences

Agents can discover project rules without relying on conversation history.

---

## ADR-002 — Automated validation is mandatory

Date: [DATE]
Status: Accepted

### Context

AI-generated changes can appear correct while introducing regressions.

### Decision

The project must provide a canonical validation command and CI quality gates.

### Consequences

A task cannot be considered complete merely because the code looks correct.

---

## New decisions

Add significant decisions below this line.

## ADR-003 — Venta mayorista con precio por producto y costo real

Date: 2026-09-12
Status: Accepted

### Context

El negocio también vende al por mayor a un precio más bajo que el de mostrador.
El usuario indicó que lo más fácil para él es cargar el precio a mano.

### Decision

Una venta puede marcarse como mayorista (`Venta.esMayorista`). Cuando lo está,
el precio de venta de cada ítem (`VentaItem.precioUnitario`) lo carga el usuario
a mano, por producto. El costo sigue siendo el costo real del producto, congelado
al vender (`VentaItem.costoUnitario`), y la ganancia se recalcula como
`precioUnitario − costoUnitario`. El cálculo vive en `src/lib/venta.ts`, aislado
y con tests unitarios.

### Consequences

- La ganancia del día en caja sigue siendo verdadera, porque usa el costo real.
- Reaprovecha el modelo existente: el precio ya era por ítem; sólo se agregó el
  flag y se hizo editable el precio en modo mayorista.
- El costo no se carga a mano por venta: si en el futuro hiciera falta un costo
  distinto por operación, requiere otra decisión.

### Alternatives considered

- Precio total de la venta en un solo campo: rechazado, difumina la ganancia por
  producto (habría que repartir el total entre los ítems).
- Cargar también el costo a mano en cada venta: rechazado por ahora, más tipeo y
  más chance de error; el costo real del producto da la cuenta correcta.
