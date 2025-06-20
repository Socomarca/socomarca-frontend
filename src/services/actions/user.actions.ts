'use server';

import { cookiesManagement } from '@/stores/base/utils/cookiesManagement';
import { BACKEND_URL } from '@/utils/getEnv';

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  phone: string;
  rut: string;
  business_name: string;
  is_active: boolean;
  last_login: string | null;
  password_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface UsersApiResponse {
  data: ApiUser[];
  meta: ApiMeta;
}


export async function getUserData() {
  const { getCookie } = await cookiesManagement();

  const userId = getCookie('userId');
  const token = getCookie('token');

  if (!userId) {
    throw new Error('No userId found in cookies');
  }

  if (!token) {
    throw new Error('No token found in cookies');
  }

  const res = await fetch(`${BACKEND_URL}/users/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user data: ${res.statusText}`);
  }
const data = await res.json();
return data;

}


export async function getUsersAction(params: {
  page?: number;
  per_page?: number;
}): Promise<{
  success: boolean;
  data?: UsersApiResponse;
  error?: string;
}> {
  try {
    const { page = 1, per_page = 10 } = params;
    
    const baseURL = process.env.BACKEND_URL;
    const url = new URL(`${baseURL}/users`);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('per_page', per_page.toString());
     const { getCookie } = await cookiesManagement();
    const token = getCookie('token');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
       Accept: 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      next: {
        revalidate: 0, // No cache para datos que cambian frecuentemente
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: UsersApiResponse = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}