/**
 * VAT Settings Actions
 *
 * Lee y actualiza la tasa de IVA que el backend aplica a los productos y a las
 * órdenes nuevas. Requiere los permisos `read-content-settings` y
 * `update-content-settings`; las órdenes ya emitidas conservan la tasa con la
 * que se cobraron.
 *
 * @module services/actions/vat.actions
 */

'use server';

import { BACKEND_URL } from '@/utils/getEnv';
import { cookiesManagement } from '@/stores/base/utils/cookiesManagement';

interface ActionResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

/** Obtiene la tasa de IVA vigente, como porcentaje (19 significa 19%). */
export const fetchGetVatRate = async (): Promise<ActionResult<number>> => {
  try {
    const { getCookie } = await cookiesManagement();
    const token = getCookie('token');

    if (!token) {
      return { ok: false, data: null, error: 'Unauthorized: No token found' };
    }

    const response = await fetch(`${BACKEND_URL}/settings/vat`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: data?.message || `Error HTTP: ${response.status}`,
      };
    }

    return { ok: true, data: Number(data?.rate) || 0, error: null };
  } catch (error) {
    console.error('Error fetching VAT rate:', error);
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

/**
 * Actualiza la tasa de IVA.
 * @param rate - Porcentaje entre 0 y 100
 */
export const fetchUpdateVatRate = async (
  rate: number
): Promise<ActionResult<string>> => {
  try {
    const { getCookie } = await cookiesManagement();
    const token = getCookie('token');

    if (!token) {
      return { ok: false, data: null, error: 'Unauthorized: No token found' };
    }

    const response = await fetch(`${BACKEND_URL}/settings/vat`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rate }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // 422 trae los mensajes de validación en `errors`
      const validationMessage = data?.errors?.rate?.[0];

      return {
        ok: false,
        data: null,
        error:
          validationMessage || data?.message || `Error HTTP: ${response.status}`,
      };
    }

    return {
      ok: true,
      data: data?.message || 'Configuración actualizada correctamente',
      error: null,
    };
  } catch (error) {
    console.error('Error updating VAT rate:', error);
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};
