import { StateCreator } from 'zustand';
import {
  PaginationLinks,
  PaginationMeta,
  ProductsSlice,
  StoreState,
  FiltersSlice,
  CategoriesSlice,
} from '../types';
import {
  fetchGetProducts,
  fetchMinMaxPrice,
  fetchSearchProductsByFilters,
} from '@/services/actions/products.actions';
import { filterAndRankProducts } from '../utils/searchUtils';
import { FetchSearchProductsByFiltersProps } from '@/interfaces/product.interface';
import {
  buildBrandListFromSearchExtra,
  buildCategoryTreeFromSearchExtra,
} from './filterSlice';

export const createProductsSlice: StateCreator<
  StoreState & ProductsSlice & FiltersSlice & CategoriesSlice,
  [],
  [],
  ProductsSlice
> = (set, get) => ({
  // Estados de productos
  products: [],
  filteredProducts: [],
  searchTerm: '',
  productPaginationMeta: null,
  productPaginationLinks: null,
  currentPage: 1,
  isLoadingProducts: false,

  // Acciones
  setProducts: (products, meta?: PaginationMeta, links?: PaginationLinks) => {
    const searchTerm = get().searchTerm;

    const finalProducts = searchTerm
      ? filterAndRankProducts(products, searchTerm)
      : products;

    set({
      products,
      filteredProducts: finalProducts,
      productPaginationMeta: meta || get().productPaginationMeta,
      productPaginationLinks: links || get().productPaginationLinks,
    });
  },

  setFilteredProducts: (filteredProducts) => {
    const currentMeta = get().productPaginationMeta;

    if (!currentMeta) {
      set({ filteredProducts });
      return;
    }

    const perPage = currentMeta.per_page || 9;
    const lastPage = Math.max(1, Math.ceil(filteredProducts.length / perPage));

    const updatedMeta: PaginationMeta = {
      ...currentMeta,
      current_page: 1,
      from: filteredProducts.length > 0 ? 1 : 0,
      last_page: lastPage,
      to: Math.min(filteredProducts.length, perPage),
      total: filteredProducts.length,
      links: Array.from({ length: lastPage }, (_, i) => ({
        url: i === 0 ? null : `?page=${i + 1}`,
        label:
          i === 0
            ? 'Previous'
            : i === lastPage - 1
            ? 'Next'
            : (i + 1).toString(),
        active: i === 0,
      })),
    };

    // Update navigation links
    const updatedLinks: PaginationLinks = {
      first: filteredProducts.length > 0 ? '?page=1' : null,
      last: filteredProducts.length > 0 ? `?page=${lastPage}` : null,
      next: 1 < lastPage ? '?page=2' : null,
      prev: null,
    };

    set({
      filteredProducts,
      productPaginationMeta: updatedMeta,
      productPaginationLinks: updatedLinks,
      currentPage: 1,
    });
  },

  setSearchTerm: async (
    terms: FetchSearchProductsByFiltersProps & { page?: number; size?: number }
  ) => {
    try {
      set({ isLoadingProducts: true });
      
      const searchParams = {
        ...terms,
        page: terms.page || 1,
        size: terms.size || 9,
      };

      const response = await fetchSearchProductsByFilters(searchParams);

      if (response.ok && response.data) {
        const products = response.data.data;
        const searchCategories = terms.value
          ? buildCategoryTreeFromSearchExtra(
              response.data.extra,
              get().categories
            ) ?? []
          : null;
        const searchBrands = terms.value
          ? buildBrandListFromSearchExtra(
              response.data.extra,
              get().brands,
              get().selectedBrands
            )
          : null;

        set({
          searchTerm: terms.value || '',
          filteredProducts: products,
          searchCategories,
          searchBrands,
          productPaginationMeta: response.data.meta,
          productPaginationLinks: response.data.links,
          currentPage: response.data.meta.current_page,
          isLoadingProducts: false,
        });
      } else {
        console.error('Error en la respuesta del servidor:', response.error);
        set({ isLoadingProducts: false });
      }
    } catch (error: any) {
      console.error('Error in setSearchTerm:', error);
      set({ isLoadingProducts: false });
    }
  },

  fetchMinMaxPrice: async () => {
    const { setAvailablePriceRange } = get();
    const response = await fetchMinMaxPrice();
    if (response.ok && response.data) {
      const { min_price, max_price } = response.data;
      setAvailablePriceRange(min_price, max_price);
    }
  },

  fetchProducts: async (page = 1, size = 9) => {
    try {
      set({ isLoadingProducts: true });

      const response = await fetchGetProducts({ page, size });
      await get().fetchMinMaxPrice(); // Establecer los valores extremos del endpoint

      if (response.ok && response.data) {
        const products = response.data.data;
        set({
          products: products,
          filteredProducts: products,
          productPaginationMeta: response.data.meta,
          productPaginationLinks: response.data.links,
          currentPage: response.data.meta.current_page,
          isLoadingProducts: false,
        });
      } else {
        console.error('Error en la respuesta del servidor:', response.error);
        set({ isLoadingProducts: false });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ isLoadingProducts: false });
    }
  },
});
