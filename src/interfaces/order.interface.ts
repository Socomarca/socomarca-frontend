interface BillingAddress {
  address_line1: string;
  address_line2: string;
  contact_name: string;
  created_at: Date;
  id: number;
  is_default: boolean;
  municipality_id: number;
  phone: string;
  postal_code: string;
  type: string;
  updated_at: Date;
  user_id: number;
}
export interface UserData {
  billing_address: BillingAddress;
  business_name: string;
  created_at: Date;
  email: string;
  email_verified_at: Date | null;
  id: number;
  is_active: boolean;
  last_login: Date | null;
  name: string;
  password_changed_at: Date | null;
  phone: string;
  rut: string;
  updated_at: Date;
}

export interface OrderDataForm {
  nombre: string;
  rut: string;
  correo: string;
  telefono: string;
  region: string;
  comuna: string;
  direccionId: number;
  detallesDireccion: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  image: string;
  category_id: number;
  subcategory_id: number;
  brand_id: number;
  status: boolean;
  created_at: string;
  updated_at: string;
  random_product_id: string | null;
}

export interface OrderItem {
  id: number;
  product: Product;
  unit: string;
  quantity: number;
  /** Precio unitario neto */
  price: string;
  /** Neto de la línea (price x quantity) */
  subtotal: number;
  /** Tasa de IVA aplicada a la línea, como porcentaje */
  vat: string;
  /** Monto de IVA de la línea */
  vat_amount: string;
  /** Total de la línea con IVA */
  total: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  random_document_number: string | null;
  user: UserData;
  /** Suma neta de los productos */
  subtotal: number;
  /**
   * Tasa de IVA con la que se cobró la orden, como porcentaje. Las órdenes
   * anteriores a la incorporación del IVA traen 0 y `total` igual a `subtotal`.
   */
  vat: string;
  /** Monto de IVA de la orden */
  vat_amount: string;
  /** Subtotal + IVA, sin despacho */
  total: string;
  /** Costo de despacho */
  shipping_cost: string;
  /** Total efectivamente cobrado (total + despacho) */
  amount: number;
  status: string;
  order_items: OrderItem[];
  order_meta: string; // viene como string, tipo JSON
  branch: Branch;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: number | null;
  name: string | null;
  code: string | null;
}

export interface OrderResponse {
  data: Order[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    path: string;
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
  };
}