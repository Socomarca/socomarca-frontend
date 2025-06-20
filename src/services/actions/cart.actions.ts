'use server';

import { BACKEND_URL, IS_QA_MODE } from '@/utils/getEnv';
import { cookiesManagement } from '@/stores/base/utils/cookiesManagement';
import { CartItem } from '@/interfaces/product.interface';

interface AddToCartPayload {
  product_id: number;
  quantity: number;
  unit: string;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

export type CartPayload = {
  product_id: string;
  quantity: string;
  unit: string;
};
interface ActionResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

export const fetchPostAddToCart = async (
  payload: AddToCartPayload
): Promise<ActionResult<any>> => {
  try {
    if (IS_QA_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        ok: true,
        data: {
          message: 'Producto añadido al carrito (mock)',
          product_id: payload.product_id,
          quantity: payload.quantity,
          cart_id: 123,
        },
        error: null,
      };
    }

    const { getCookie } = await cookiesManagement();
    const token = getCookie('token');

    if (!token) {
      return {
        ok: false,
        data: null,
        error: 'Unauthorized: No token found',
      };
    }

    const payloadToString: CartPayload = {
      product_id: String(payload.product_id),
      quantity: String(payload.quantity),
      unit: payload.unit,
    };

    console.log('POST payload:', payloadToString);

    const response = await fetch(`${BACKEND_URL}/cart/items`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadToString),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return {
      ok: true,
      data,
      error: null,
    };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

export const fetchDeleteCartItem = async (
  itemId: number,
  quantity: number,
  unit: string
): Promise<ActionResult<any>> => {
  try {
    if (IS_QA_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        ok: true,
        data: {
          message: 'Producto eliminado del carrito (mock)',
          item_id: itemId,
          quantity,
          unit,
        },
        error: null,
      };
    }

    const { getCookie } = await cookiesManagement();
    const token = getCookie('token');

    if (!token) {
      return {
        ok: false,
        data: null,
        error: 'Unauthorized: No token found',
      };
    }
    const payload = {
      product_id: itemId,
      quantity: quantity,
      unit: unit,
    };
    const response = await fetch(`${BACKEND_URL}/cart/items`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();

    return {
      ok: true,
      data,
      error: null,
    };
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

export const fetchGetCart = async (): Promise<ActionResult<CartResponse>> => {
  try {
    const { getCookie } = await cookiesManagement();
    const token = getCookie('token');

    if (!token) {
      return {
        ok: false,
        data: null,
        error: 'Unauthorized: No token found',
      };
    }

    const response = await fetch(`${BACKEND_URL}/cart`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    console.log(result);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return {
      ok: true,
      data: result.data,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching cart:', error);
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

export const fetchDeleteCart = async (): Promise<ActionResult<any>> => {
  try {
    const { getCookie } = await cookiesManagement();
    const token = getCookie('token');

    if (!token) {
      return {
        ok: false,
        data: null,
        error: 'Unauthorized: No token found',
      };
    }

    const response = await fetch(`${BACKEND_URL}/cart`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return {
      ok: true,
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Error deleting cart:', error);
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};
