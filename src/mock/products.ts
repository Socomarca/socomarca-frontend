import { Category } from '@/interfaces/category.interface';
import {
  Subcategory,
  Brand,
  Product,
  ProductToBuy,
} from '@/interfaces/product.interface';

const CATEGORIES: Category[] = [
  { id: 1, name: 'Alimentos Básicos' },
  { id: 2, name: 'Verduras y Hortalizas' },
  { id: 3, name: 'Carnes y Proteínas' },
  { id: 4, name: 'Lácteos' },
  { id: 5, name: 'Bebidas' },
  { id: 6, name: 'Snacks y Dulces' },
  { id: 7, name: 'Cuidado Personal' },
  { id: 8, name: 'Limpieza del Hogar' },
];

const SUBCATEGORIES: Subcategory[] = [
  { id: 1, name: 'Cereales y Granos' },
  { id: 2, name: 'Legumbres' },
  { id: 3, name: 'Pastas' },
  { id: 4, name: 'Verduras Frescas' },
  { id: 5, name: 'Tubérculos' },
  { id: 6, name: 'Carnes Rojas' },
  { id: 7, name: 'Aves' },
  { id: 8, name: 'Pescados' },
  { id: 9, name: 'Leches' },
  { id: 10, name: 'Quesos' },
  { id: 11, name: 'Yogures' },
  { id: 12, name: 'Jugos' },
  { id: 13, name: 'Refrescos' },
  { id: 14, name: 'Aguas' },
];

const BRANDS: Brand[] = [
  { id: 1, name: 'Marca Premium' },
  { id: 2, name: 'DeliciFood' },
  { id: 3, name: 'NutriVida' },
  { id: 4, name: 'Orgánico Plus' },
  { id: 5, name: 'SaludMax' },
  { id: 6, name: 'FreshMart' },
  { id: 7, name: 'SuperNatural' },
  { id: 8, name: 'BioSelect' },
  { id: 9, name: 'PureTaste' },
  { id: 10, name: 'GreenChoice' },
];

const PRODUCT_NAMES = {
  cereales: [
    'Arroz Grano Largo Premium',
    'Arroz Integral Orgánico',
    'Arroz Basmati Aromático',
    'Arroz Arborio para Risotto',
    'Arroz Sushi Japonés',
    'Arroz Salvaje Mezcla Gourmet',
    'Quínoa Orgánica',
    'Bulgur Fino',
    'Couscous Integral',
    'Avena Instantánea',
  ],
  legumbres: [
    'Lentejas Rojas Partidas',
    'Lentejas Verdes',
    'Garbanzos Seleccionados',
    'Porotos Negros Selectos',
    'Porotos Blancos Medianos',
    'Frijoles Rojos Mexicanos',
    'Arvejas Secas',
    'Habas Secas',
  ],
  pastas: [
    'Fideos Spaghetti N°5',
    'Fideos Tallarines al Huevo',
    'Fideos Rigati Tricolor',
    'Fideos Lasaña Precocidos',
    'Fideos Cabello de Ángel',
    'Fideos Ramen Pack',
    'Ñoquis Frescos',
    'Ravioles de Ricota',
  ],
  verduras: [
    'Papas Russet Premium',
    'Papas Amarillas',
    'Papas Camote Orgánicas',
    'Papas Nativas Mix',
    'Tomates Cherry',
    'Lechuga Hidropónica',
    'Zanahorias Baby',
    'Brócoli Fresco',
  ],
};

const UNITS = [
  'kg',
  'g',
  'unidad',
  'litro',
  'ml',
  'paquete',
  'caja',
  'bandeja',
];

// Utility functions
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomPrice = (): number => {
  const prices = [
    490, 690, 890, 990, 1190, 1290, 1490, 1590, 1690, 1890, 1990, 2190, 2490,
    2790, 2990, 3190, 3490, 3790,
  ];
  return getRandomElement(prices);
};

const generateSKU = (
  category: string,
  productName: string,
  id: number
): string => {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const productCode = productName.split(' ')[0].substring(0, 3).toUpperCase();
  const numericCode = String(id).padStart(3, '0');
  return `${categoryCode}-${productCode}-${numericCode}`;
};

// Mapeo de categorías a subcategorías basado en IDs
const CATEGORY_SUBCATEGORY_MAP: Record<number, number[]> = {
  1: [1, 2, 3], // Alimentos Básicos: Cereales, Legumbres, Pastas
  2: [4, 5], // Verduras y Hortalizas: Verduras Frescas, Tubérculos
  3: [6, 7, 8], // Carnes y Proteínas: Carnes Rojas, Aves, Pescados
  4: [9, 10, 11], // Lácteos: Leches, Quesos, Yogures
  5: [12, 13, 14], // Bebidas: Jugos, Refrescos, Aguas
  6: [], // Snacks y Dulces (sin subcategorías definidas)
  7: [], // Cuidado Personal (sin subcategorías definidas)
  8: [], // Limpieza del Hogar (sin subcategorías definidas)
};

const getSubcategoriesByCategory = (categoryId: number): Subcategory[] => {
  const subcategoryIds = CATEGORY_SUBCATEGORY_MAP[categoryId] || [];
  return SUBCATEGORIES.filter((sub) => subcategoryIds.includes(sub.id));
};

// Listas de precios simuladas: en QA un producto puede venir de cualquiera de ellas
const PRICE_LISTS = ['Lista 1', 'Lista 2', 'Lista Mayorista'];

const getUnitByCategory = (categoryId: number): string => {
  switch (categoryId) {
    case 1: // Alimentos Básicos
      return getRandomElement(['kg', 'g', 'paquete']);
    case 2: // Verduras y Hortalizas
      return getRandomElement(['kg', 'g', 'unidad', 'bandeja']);
    case 3: // Carnes y Proteínas
      return getRandomElement(['kg', 'g', 'bandeja']);
    case 4: // Lácteos
      return getRandomElement(['litro', 'ml', 'unidad', 'paquete']);
    case 5: // Bebidas
      return getRandomElement(['litro', 'ml']);
    case 6: // Snacks y Dulces
      return getRandomElement(['g', 'unidad', 'paquete', 'caja']);
    case 7: // Cuidado Personal
      return getRandomElement(['ml', 'unidad']);
    case 8: // Limpieza del Hogar
      return getRandomElement(['litro', 'ml', 'unidad']);
    default:
      return getRandomElement(UNITS);
  }
};

// Main generator functions
export const generateProduct = (id: number): Product => {
  const category = getRandomElement(CATEGORIES);
  const availableSubcategories = getSubcategoriesByCategory(category.id);

  // Si no hay subcategorías para esta categoría, usar una subcategoría aleatoria
  const subcategory =
    availableSubcategories.length > 0
      ? getRandomElement(availableSubcategories)
      : getRandomElement(SUBCATEGORIES);

  const brand = getRandomElement(BRANDS);

  // Seleccionar nombre basado en la categoría
  let productName: string;
  if (category.id === 1) {
    // Alimentos Básicos
    if (subcategory.name.includes('Cereales')) {
      productName = getRandomElement(PRODUCT_NAMES.cereales);
    } else if (subcategory.name.includes('Legumbres')) {
      productName = getRandomElement(PRODUCT_NAMES.legumbres);
    } else {
      productName = getRandomElement(PRODUCT_NAMES.pastas);
    }
  } else if (category.id === 2) {
    // Verduras
    productName = getRandomElement(PRODUCT_NAMES.verduras);
  } else {
    productName = `Producto ${category.name} ${id}`;
  }

  const sku = generateSKU(category.name, productName, id);
  const price = getRandomPrice();
  const stock = getRandomNumber(0, 200);
  const status = stock > 0 && Math.random() > 0.1; // 90% de productos activos
  const unit = getUnitByCategory(category.id);
  const is_favorite = Math.random() > 0.7; // 30% de probabilidad de ser favorito

  return {
    id,
    name: `${productName} ${getRandomNumber(100, 999)}${
      unit === 'unidad' ? ' unidades' : unit
    }`,
    price,
    vat: 0,
    stock,
    sku,
    price_list_id: getRandomElement(PRICE_LISTS),
    image: `/assets/global/logo_plant.png`,
    category,
    subcategory,
    brand,
    status,
    unit,
    is_favorite,
  };
};

export const generateProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, index) =>
    generateProduct(index + 1)
  );
};

export const generateProductToBuy = (
  product: Product,
  quantity?: number
): ProductToBuy => {
  return {
    ...product,
    quantity: quantity || getRandomNumber(1, 5),
  };
};

export const generateProductsToBuy = (
  products: Product[],
  count?: number
): ProductToBuy[] => {
  const selectedProducts = count
    ? products.slice(0, count)
    : products.filter(() => Math.random() > 0.5);

  return selectedProducts.map((product) => generateProductToBuy(product));
};

// Funciones para obtener datos específicos
export const getCategories = (): Category[] => [...CATEGORIES];

export const getSubcategories = (): Subcategory[] => [...SUBCATEGORIES];

export const getBrands = (): Brand[] => [...BRANDS];

export const getProductsByCategory = (
  categoryId: number,
  count: number = 10
): Product[] => {
  return generateProducts(count * 3)
    .filter((product) => product.category?.id === categoryId)
    .slice(0, count);
};

export const getProductsByBrand = (
  brandId: number,
  count: number = 10
): Product[] => {
  return generateProducts(count * 2)
    .filter((product) => product.brand?.id === brandId)
    .slice(0, count);
};

export const searchProducts = (
  query: string,
  allProducts: Product[]
): Product[] => {
  const searchTerm = query.toLowerCase();
  return allProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.category?.name?.toLowerCase().includes(searchTerm) ||
      product.brand?.name?.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm)
  );
};

// Funciones de utilidad para paginación
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export const paginateProducts = (
  products: Product[],
  page: number = 1,
  perPage: number = 20
): PaginatedResult<Product> => {
  const total = products.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const data = products.slice(start, end);

  return {
    data,
    total,
    page,
    per_page: perPage,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
  };
};
