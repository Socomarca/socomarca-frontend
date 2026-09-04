import { StateCreator } from 'zustand';
import { VatSlice } from '../types';
import { fetchVatRate } from '@/services/actions/products.actions';

/**
 * Tasa de IVA vigente, tal como la informan las respuestas de productos.
 *
 * El carrito (`GET /cart`) sigue devolviendo montos netos y sin desglose, así
 * que el resumen previo al pago calcula el IVA en el cliente con esta tasa para
 * cuadrar con la orden que después devuelve el backend.
 */
export const createVatSlice: StateCreator<VatSlice, [], [], VatSlice> = (
  set,
  get
) => ({
  vatRate: 0,
  vatRateInitialized: false,

  setVatRate: (rate: number) => {
    if (!Number.isFinite(rate)) return;

    set({ vatRate: rate, vatRateInitialized: true });
  },

  fetchVatRate: async () => {
    // El catálogo ya deja la tasa en el store; solo se pide cuando el usuario
    // entra directo a una pantalla que no lista productos (carro, checkout).
    if (get().vatRateInitialized) return;

    const rate = await fetchVatRate();

    if (rate !== null) {
      set({ vatRate: rate, vatRateInitialized: true });
    }
  },
});
