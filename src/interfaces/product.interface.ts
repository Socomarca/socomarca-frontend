export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  sku: string;
  // Lista de precios a la que corresponde esta fila. Un mismo producto se repite
  // una vez por cada lista permitida del usuario, y este campo las distingue.
  price_list_id: string | null;
  image: string;
  category: Category | null;
  subcategory: Subcategory | null;
  brand: Brand | null;
  status: boolean;
  unit: string;
  is_favorite: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface Subcategory {
  id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface ProductToBuy extends Product {
  quantity: number;
}

export interface ProductCart {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  price: string;
  unit: string;
  subtotal: number;
}

export interface Cart {
  items: ProductCart[];
  total: number;
}

export interface CartItem extends ProductToBuy {
  subtotal: number;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

type Operator = 'fulltext' | '=';
export type Field =
  | 'name'
  | 'supercategory_id'
  | 'category_id'
  | 'subcategory_id'
  | 'sales'
  | 'brand_id'
  | 'is_favorite';

export interface FetchSearchProductsByFiltersProps {
  field?: Field;
  value?: string;
  operator?: Operator;
  min?: number;
  max?: number;
  sort?: 'asc' | 'desc';
  sort_field?: 'id' | 'name' | 'price' | 'stock' | 'category_name' | 'brand_name';
  sort_direction?: 'asc' | 'desc';
  unit?: string;
  supercategory_id?: number[];
  category_id?: number[];
  subcategory_id?: number[];
  brand_id?: number[];
  is_favorite?: boolean;
}

export interface SearchWithPaginationProps
  extends FetchSearchProductsByFiltersProps {
  page?: number;
  size?: number;
}

export interface BackendFilters {
  min_price: number | null;
  max_price: number | null;
  unit: string | null;
}

export interface ProductSearchResponse {
  data: Product[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
  filters?: BackendFilters;
}

/**
 * Respuesta de la API de sincronización de imágenes de productos
 */
export interface ProductImagesSyncResponse {
  success: boolean;
  message: string;
  data?: {
    processed_files?: number;
    synced_products?: number;
    errors?: string[];
    warnings?: string[];
    [key: string]: any; // Permitir propiedades adicionales para debug y errores
  } | null;
}

/**
 * Parámetros para la sincronización de imágenes
 */
export interface ProductImagesSyncParams {
  file: File;
}
