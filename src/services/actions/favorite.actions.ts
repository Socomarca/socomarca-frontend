'use server';

import { cookiesManagement } from '@/stores/base/utils/cookiesManagement';
import { BACKEND_URL } from '@/utils/getEnv';

export async function fetchGetFavoriteLists() {
  const { getCookie } = await cookiesManagement();
  const cookie = getCookie('token');

  if (!cookie) {
    return {
      ok: false,
      data: null,
      error: 'Unauthorized: No token provided',
    };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/favorites`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${cookie}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching favorite lists');
    }

    const data = await response.json();
    return {
      ok: true,
      data: data.data,
      error: null,
    };
  } catch (error) {
    console.log('Error fetching categories:', error);
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function fetchCreateFavoriteList(name: string) {
  const { getCookie } = await cookiesManagement();
  const cookie = getCookie('token');

  if (!cookie) {
    return {
      ok: false,
      data: null,
      error: 'Unauthorized: No token provided',
    };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/favorites-list`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cookie}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error('Error creating favorite list');
    }

    const data = await response.json();
    return {
      ok: true,
      data,
      error: null,
    };
  } catch (error) {
    console.log('Error creating favorite list:', error);
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function fetchAddProductToFavoriteList(
  favoriteListId: number,
  productId: number
) {
  const { getCookie } = await cookiesManagement();
  const cookie = getCookie('token');

  if (!cookie) {
    return {
      ok: false,
      data: null,
      error: 'Unauthorized: No token provided',
    };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/favorites`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cookie}`,
      },
      body: JSON.stringify({
        favorite_list_id: favoriteListId,
        product_id: productId,
      }),
    });

    if (!response.ok) {
      throw new Error('Error adding product to favorite list');
    }

    const data = await response.json();
    return {
      ok: true,
      data,
      error: null,
    };
  } catch (error) {
    console.log('Error adding product to favorite list:', error);
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function fetchRemoveProductFromFavorites(productId: number) {
  const { getCookie } = await cookiesManagement();
  const cookie = getCookie('token');

  if (!cookie) {
    return {
      ok: false,
      data: null,
      error: 'Unauthorized: No token provided',
    };
  }

  console.log('Removing product from favorites:', productId);

  try {
    const response = await fetch(`${BACKEND_URL}/favorites/${productId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${cookie}`,
      },
    });
    const data = await response.json();
    console.log('Response from server:', data);

    if (!response.ok) {
      throw new Error('Error removing product from favorites');
    }

    return {
      ok: true,
      data,
      error: null,
    };
  } catch (error) {
    console.log('Error removing product from favorites:', error);
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
