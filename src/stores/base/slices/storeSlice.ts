import { StateCreator } from 'zustand';
import {
  StoreSlice,
  StoreState,
  BrandsSlice,
  CategoriesSlice,
  ProductsSlice,
  FiltersSlice,
  AuthSlice,
} from '../types';

export const createStoreSlice: StateCreator<
  StoreState &
    StoreSlice &
    AuthSlice &
    BrandsSlice &
    CategoriesSlice &
    ProductsSlice &
    FiltersSlice,
  [],
  [],
  StoreSlice
> = (set, get) => ({
  // Reset individual states
  resetBrandsState: () => {
    set({ brands: [], searchBrands: null });
  },

  resetCategoriesState: () => {
    set({ categories: [] });
  },

  resetProductsState: () => {
    set({
      products: [],
      filteredProducts: [],
      productPaginationMeta: null,
      productPaginationLinks: null,
      currentPage: 1,
      searchTerm: '',
    });
  },

  resetFiltersState: () => {
    set({
      selectedCategories: [],
      selectedSupercategoryIds: [],
      selectedCategoryIds: [],
      selectedSubcategoryIds: [],
      selectedBrands: [],
      selectedFavorites: [],
      minPrice: 0,
      maxPrice: 0,
      selectedMinPrice: 0,
      selectedMaxPrice: 0,
      priceInitialized: false,
      isMainCategoryOpen: true,
      isBrandsOpen: false,
      isFavoritesOpen: false,
      isPriceOpen: true,
    });
  },

  // Reset search-related states and reload products
  resetSearchRelatedStates: async () => {
    const { fetchProducts, productPaginationMeta } = get();

    // Reset search and filter states
    set({
      searchTerm: '',
      selectedCategories: [],
      selectedSupercategoryIds: [],
      selectedCategoryIds: [],
      selectedSubcategoryIds: [],
      selectedBrands: [],
      selectedFavorites: [],
      isLoading: false,
      searchCategories: null,
      searchBrands: null,
    });

    try {
      // Reload products with default pagination
      await fetchProducts(1, productPaginationMeta?.per_page || 9);
    } catch (error) {
      console.error('Error al resetear estados de búsqueda:', error);
    }
  },

  // Reset all states
  resetAllStates: async () => {
    const { resetSearchRelatedStates } = get();

    // Reset all individual states
    get().resetBrandsState();
    get().resetCategoriesState();
    get().resetProductsState();
    get().resetFiltersState();

    // Reset search-related states and reload data
    await resetSearchRelatedStates();
  },
});
