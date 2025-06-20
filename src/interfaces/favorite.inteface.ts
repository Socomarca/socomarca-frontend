export interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: number;
  product: Product;
  created_at: string | null;
  updated_at: string | null;
}

export interface FavoriteList {
  id: number;
  name: string;
  user_id: number;
  favorites: Favorite[];
}
