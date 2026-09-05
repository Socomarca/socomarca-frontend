/**
 * Cálculo de IVA en el cliente.
 *
 * El catálogo pide sus precios con IVA incluido (`vat=true`), pero `GET /cart`
 * sigue devolviendo montos netos y sin desglose. Estas funciones reconstruyen
 * ese desglose con la tasa vigente para que el resumen previo al pago cuadre
 * con la orden que devuelve el backend.
 *
 * La tasa se maneja como porcentaje: 19 significa 19%.
 */

/** Monto de IVA que corresponde a un neto. */
export const calculateVatAmount = (net: number, rate: number): number => {
  if (!Number.isFinite(net) || !Number.isFinite(rate) || rate <= 0) {
    return 0;
  }

  return Math.round((net * rate) / 100);
};

/**
 * Quita el IVA contenido en un precio.
 *
 * Sirve para los precios del catálogo, que llegan con IVA incluido, cuando hay
 * que guardarlos junto a los del carrito, que son netos.
 */
export const removeVat = (gross: number, rate: number): number => {
  if (!Number.isFinite(gross) || !Number.isFinite(rate) || rate <= 0) {
    return gross;
  }

  return gross / (1 + rate / 100);
};

/** Neto más su IVA, redondeado a pesos. */
export const addVat = (net: number, rate: number): number =>
  Math.round(net) + calculateVatAmount(net, rate);

/**
 * Desglose de un neto: lo que se muestra en los resúmenes de compra.
 * @param net - Suma neta de los productos
 * @param rate - Tasa de IVA vigente, como porcentaje
 * @param shipping - Costo de despacho (no afecto al cálculo del IVA acá,
 *                   igual que en la orden que arma el backend)
 */
export const buildVatBreakdown = (
  net: number,
  rate: number,
  shipping: number = 0
) => {
  const vatAmount = calculateVatAmount(net, rate);
  const total = Math.round(net) + vatAmount;

  return {
    subtotal: Math.round(net),
    rate,
    vatAmount,
    /** Productos con IVA, sin despacho: equivale al `total` de la orden. */
    total,
    shipping,
    /** Lo que se cobra: equivale al `amount` de la orden. */
    amount: total + shipping,
  };
};
