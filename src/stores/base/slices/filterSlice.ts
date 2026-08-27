import { StateCreator } from 'zustand';
import {
  FiltersSlice,
  StoreState,
  ProductsSlice,
  FavoritesSlice,
  StoreSlice,
  CategoriesSlice,
} from '../types';
import {
  Product,
  SearchWithPaginationProps,
} from '@/interfaces/product.interface';
import { Brand } from '@/interfaces/brand.interface';
import { CategoryComplexData } from '@/interfaces/category.interface';
import { fetchSearchProductsByFilters } from '@/services/actions/products.actions';

const findCategory = (
  categories: CategoryComplexData[] | null,
  categoryId: number
): CategoryComplexData | null => {
  for (const category of categories ?? []) {
    if (category.id === categoryId) {
      return category;
    }

    const childCategory = findCategory(
      category.categories ?? category.subcategories ?? null,
      categoryId
    );

    if (childCategory) {
      return childCategory;
    }
  }

  return null;
};

const findCategoryPath = (
  categories: CategoryComplexData[] | null,
  categoryId: number,
  path: CategoryComplexData[] = []
): CategoryComplexData[] | null => {
  for (const category of categories ?? []) {
    const nextPath = [...path, category];

    if (category.id === categoryId) {
      return nextPath;
    }

    const childPath = findCategoryPath(
      category.categories ?? category.subcategories ?? null,
      categoryId,
      nextPath
    );

    if (childPath) {
      return childPath;
    }
  }

  return null;
};

const collectCategoryIds = (category: CategoryComplexData): number[] => [
  category.id,
  ...(category.categories ?? []).flatMap(collectCategoryIds),
  ...(category.subcategories ?? []).flatMap(collectCategoryIds),
];

const getSelectionByLevel = (
  selectedCategories: number[],
  categories: CategoryComplexData[],
  searchCategories: CategoryComplexData[] | null
) => {
  const selectedSupercategoryIds: number[] = [];
  const selectedCategoryIds: number[] = [];
  const selectedSubcategoryIds: number[] = [];

  selectedCategories.forEach((categoryId) => {
    const category = findCategory(searchCategories, categoryId) ?? findCategory(categories, categoryId);
    const level = Number(category?.level) || 1;

    if (level === 1) selectedSupercategoryIds.push(categoryId);
    else if (level === 3) selectedSubcategoryIds.push(categoryId);
    else selectedCategoryIds.push(categoryId);
  });

  return {
    selectedCategories,
    selectedSupercategoryIds,
    selectedCategoryIds,
    selectedSubcategoryIds,
  };
};

export const buildCategoryTreeFromSearchExtra = (
  extra: any,
  allCategories: CategoryComplexData[]
): CategoryComplexData[] | null => {
  const supercategoryIds = new Set<number>(
    (extra?.supercategories ?? []).map((category: CategoryComplexData) => category.id)
  );
  const categoryIds = new Set<number>(
    (extra?.categories ?? []).map((category: CategoryComplexData) => category.id)
  );
  const subcategoryIds = new Set<number>(
    (extra?.subcategories ?? []).map((category: CategoryComplexData) => category.id)
  );

  if (supercategoryIds.size === 0 && categoryIds.size === 0 && subcategoryIds.size === 0) {
    return null;
  }

  return allCategories.flatMap((supercategory) => {
    const categories = (supercategory.categories ?? []).flatMap((category) => {
      const subcategories = (category.subcategories ?? []).filter((subcategory) =>
        subcategoryIds.has(subcategory.id)
      );
      const shouldIncludeCategory = categoryIds.has(category.id) || subcategories.length > 0;

      return shouldIncludeCategory ? [{ ...category, subcategories }] : [];
    });
    const shouldIncludeSupercategory = supercategoryIds.has(supercategory.id) || categories.length > 0;

    return shouldIncludeSupercategory ? [{ ...supercategory, categories }] : [];
  });
};

// El backend devuelve en `extra.brands` las marcas que tienen al menos un producto
// dentro de los resultados de la búsqueda, para que el sidebar ofrezca solo esas.
// Devuelve null si el backend no manda la clave (modo QA o versión antigua): en ese
// caso el sidebar sigue mostrando el catálogo completo de marcas.
export const buildBrandListFromSearchExtra = (
  extra: any,
  allBrands: Brand[],
  selectedBrands: number[]
): Brand[] | null => {
  const matchingBrands = extra?.brands;

  if (!Array.isArray(matchingBrands)) {
    return null;
  }

  // Una marca ya marcada debe seguir visible aunque la búsqueda no la devuelva,
  // o el usuario se queda sin forma de desmarcarla.
  const matchingIds = new Set<number>(matchingBrands.map((brand: Brand) => brand.id));
  const selectedOutsideSearch = allBrands.filter(
    (brand) => selectedBrands.includes(brand.id) && !matchingIds.has(brand.id)
  );

  return [...matchingBrands, ...selectedOutsideSearch].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};

export const addSelectedCategoryFilter = (
  searchParams: SearchWithPaginationProps,
  selectedSupercategoryIds: number[],
  selectedCategoryIds: number[],
  selectedSubcategoryIds: number[]
) => {
  if (selectedSupercategoryIds.length > 0) {
    searchParams.supercategory_id = selectedSupercategoryIds;
  }

  if (selectedCategoryIds.length > 0) {
    searchParams.category_id = selectedCategoryIds;
  }

  if (selectedSubcategoryIds.length > 0) {
    searchParams.subcategory_id = selectedSubcategoryIds;
  }
};

// Los filtros se aplican solos al cambiar la selección, sin botón "Aplicar".
// El slider de precio dispara un onChange por cada píxel arrastrado, así que
// las llamadas se agrupan con un debounce en vez de pegarle al backend por cada
// evento. El timer vive a nivel de módulo porque el store es un singleton.
const AUTO_APPLY_DELAY_MS = 350;
let autoApplyTimer: ReturnType<typeof setTimeout> | null = null;

const cancelScheduledApply = () => {
  if (autoApplyTimer) {
    clearTimeout(autoApplyTimer);
    autoApplyTimer = null;
  }
};

export const createFiltersSlice: StateCreator<
  StoreState & FiltersSlice & ProductsSlice & FavoritesSlice & StoreSlice & CategoriesSlice,
  [],
  [],
  FiltersSlice
> = (set, get) => ({
  selectedCategories: [],
  selectedSupercategoryIds: [],
  selectedCategoryIds: [],
  selectedSubcategoryIds: [],
  selectedBrands: [],
  selectedFavorites: [],
  minPrice: 0,
  maxPrice: 0,
  isFiltered: false,

  selectedMinPrice: 0,
  selectedMaxPrice: 0,

  priceInitialized: false,

  isMainCategoryOpen: true,
  isBrandsOpen: false,
  isFavoritesOpen: false,
  isPriceOpen: true,

  setSelectedCategories: (categories) => {
    const { categories: allCategories, searchCategories } = get();
    const categoriesWithParents = categories.flatMap((categoryId) => {
      const path =
        findCategoryPath(searchCategories, categoryId) ??
        findCategoryPath(allCategories, categoryId) ??
        [];

      return path.map((category) => category.id);
    });

    set(getSelectionByLevel([...new Set(categoriesWithParents)], allCategories, searchCategories));
    get().scheduleApplyFilters();
  },

  toggleCategorySelection: (categoryId) => {
    const { selectedCategories, categories, searchCategories } = get();
    const category = findCategory(searchCategories, categoryId) ?? findCategory(categories, categoryId);
    const isSelected = selectedCategories.includes(categoryId);

    if (isSelected && category) {
      const idsToRemove = new Set(collectCategoryIds(category));
      const nextSelectedCategories = selectedCategories.filter((id) => !idsToRemove.has(id));

      set(getSelectionByLevel(nextSelectedCategories, categories, searchCategories));
      get().scheduleApplyFilters();
      return;
    }

    const path =
      findCategoryPath(searchCategories, categoryId) ??
      findCategoryPath(categories, categoryId) ??
      [];
    const idsToAdd = path.map((category) => category.id);
    const nextSelectedCategories = [...new Set([...selectedCategories, ...idsToAdd])];

    set(getSelectionByLevel(nextSelectedCategories, categories, searchCategories));
    get().scheduleApplyFilters();
  },

  setSelectedBrands: (brands) => {
    set({ selectedBrands: brands });
    get().scheduleApplyFilters();
  },

  toggleBrandSelection: (brandId) => {
    const { selectedBrands } = get();
    const newSelection = selectedBrands.includes(brandId)
      ? selectedBrands.filter((id) => id !== brandId)
      : [...selectedBrands, brandId];

    set({ selectedBrands: newSelection });
    get().scheduleApplyFilters();
  },

  setSelectedFavorites: (favorites) => {
    set({ selectedFavorites: favorites });
  },

  toggleFavoriteSelection: (favoriteId) => {
    const { selectedFavorites } = get();
    const newSelection = selectedFavorites.includes(favoriteId)
      ? selectedFavorites.filter((id) => id !== favoriteId)
      : [...selectedFavorites, favoriteId];

    set({ selectedFavorites: newSelection });
  },

  setAvailablePriceRange: (min, max) => {
    set({
      minPrice: min,
      maxPrice: max,
      selectedMinPrice: min,
      selectedMaxPrice: max,
      priceInitialized: true,
    });
  },

  setSelectedPriceRange: (selectedMin, selectedMax) => {
    set({
      selectedMinPrice: selectedMin,
      selectedMaxPrice: selectedMax,
    });
    get().scheduleApplyFilters();
  },

  setSelectedMinPrice: (price) => {
    set({ selectedMinPrice: price });
    get().scheduleApplyFilters();
  },

  setSelectedMaxPrice: (price) => {
    set({ selectedMaxPrice: price });
    get().scheduleApplyFilters();
  },

  handlePriceRangeChange: (lower, upper) => {
    set({
      selectedMinPrice: lower,
      selectedMaxPrice: upper,
    });
    get().scheduleApplyFilters();
  },

  setMainCategoryOpen: (isOpen) => {
    set({ isMainCategoryOpen: isOpen });
  },

  setBrandsOpen: (isOpen) => {
    set({ isBrandsOpen: isOpen });
  },

  setFavoritesOpen: (isOpen) => {
    set({ isFavoritesOpen: isOpen });
  },

  setPriceOpen: (isOpen) => {
    set({ isPriceOpen: isOpen });
  },

  toggleMainCategory: () => {
    const { isMainCategoryOpen } = get();
    set({ isMainCategoryOpen: !isMainCategoryOpen });
  },

  toggleBrandsSection: () => {
    const { isBrandsOpen } = get();
    set({ isBrandsOpen: !isBrandsOpen });
  },

  toggleFavoritesSection: () => {
    const { isFavoritesOpen } = get();
    set({ isFavoritesOpen: !isFavoritesOpen });
  },

  togglePriceSection: () => {
    const { isPriceOpen } = get();
    set({ isPriceOpen: !isPriceOpen });
  },

  // Agenda un applyFilters agrupando los cambios seguidos (checkboxes, slider)
  // en una sola llamada al backend.
  scheduleApplyFilters: () => {
    cancelScheduledApply();

    autoApplyTimer = setTimeout(() => {
      autoApplyTimer = null;
      get().applyFilters();
    }, AUTO_APPLY_DELAY_MS);
  },

  applyFilters: async () => {
    cancelScheduledApply();

    const {
      selectedSupercategoryIds,
      selectedCategoryIds,
      selectedSubcategoryIds,
      selectedBrands,
      //    selectedFavorites,
      selectedMinPrice,
      selectedMaxPrice,
      productPaginationMeta,
      searchTerm,
      showOnlyFavorites,
    } = get();

    try {
      set({ isLoadingProducts: true });

      const searchParams: SearchWithPaginationProps = {
        page: 1,
        size: productPaginationMeta?.per_page || 9,
        min: selectedMinPrice,
        max: selectedMaxPrice,
      };

      // Mantener el término de búsqueda si existe
      if (searchTerm) {
        searchParams.field = 'name';
        searchParams.value = searchTerm;
      }

      // Agregar categorías si están seleccionadas
      addSelectedCategoryFilter(
        searchParams,
        selectedSupercategoryIds,
        selectedCategoryIds,
        selectedSubcategoryIds
      );

      // Agregar marcas si están seleccionadas
      if (selectedBrands.length > 0) {
        searchParams.brand_id = selectedBrands;
      }

      // Agregar filtro de favoritos si está activado
      if (showOnlyFavorites) {
        searchParams.is_favorite = true;
      }

      if (process.env.NODE_ENV === 'development') {
        console.info('[product filters categories]', {
          supercategory_id: searchParams.supercategory_id ?? [],
          category_id: searchParams.category_id ?? [],
          subcategory_id: searchParams.subcategory_id ?? [],
        });
      }

      const response = await fetchSearchProductsByFilters(searchParams);

      if (response.ok && response.data) {
        const searchCategories = searchTerm
          ? buildCategoryTreeFromSearchExtra(
              response.data.extra,
              get().categories
            ) ?? []
          : null;
        const searchBrands = searchTerm
          ? buildBrandListFromSearchExtra(
              response.data.extra,
              get().brands,
              selectedBrands
            )
          : null;

        set({
          filteredProducts: response.data.data,
          searchCategories,
          searchBrands,
          productPaginationMeta: response.data.meta,
          productPaginationLinks: response.data.links,
          currentPage: response.data.meta.current_page,
          isLoadingProducts: false,
          isFiltered: true,
        });
      } else {
        console.error('Error en la respuesta del servidor:', response.error);
        set({ isLoadingProducts: false });
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      set({ isLoadingProducts: false });
    }
  },

  clearAllFilters: async () => {
    // resetSearchRelatedStates ya recarga los productos: si quedara un apply
    // agendado se dispararía una segunda petición con el mismo resultado.
    cancelScheduledApply();

    const {
      // fetchProducts,
      // productPaginationMeta,
      minPrice,
      maxPrice,
      resetSearchRelatedStates,
    } = get();

    set({
      selectedCategories: [],
      selectedSupercategoryIds: [],
      selectedCategoryIds: [],
      selectedSubcategoryIds: [],
      selectedBrands: [],
      selectedFavorites: [],
      showOnlyFavorites: false,
      selectedMinPrice: minPrice,
      selectedMaxPrice: maxPrice,
      isFiltered: false,
      searchCategories: null,
      searchBrands: null,
    });

    try {
      // Limpiar búsqueda y recargar productos
      await resetSearchRelatedStates();
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  },

  resetFiltersState: () => {
    cancelScheduledApply();

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
      searchTerm: '',
      showOnlyFavorites: false,
      isMainCategoryOpen: true,
      isBrandsOpen: false,
      isFavoritesOpen: false,
      isPriceOpen: true,
      isFiltered: false,
      searchCategories: null,
      searchBrands: null,
    });
  },

  hasActiveFilters: () => {
    const {
      selectedCategories,
      selectedSupercategoryIds,
      selectedCategoryIds,
      selectedSubcategoryIds,
      selectedBrands,
      selectedFavorites,
      selectedMinPrice,
      selectedMaxPrice,
      minPrice,
      maxPrice,
      searchTerm,
      showOnlyFavorites,
    } = get();

    return (
      selectedCategories.length > 0 ||
      selectedSupercategoryIds.length > 0 ||
      selectedCategoryIds.length > 0 ||
      selectedSubcategoryIds.length > 0 ||
      selectedBrands.length > 0 ||
      selectedFavorites.length > 0 ||
      selectedMinPrice > minPrice ||
      selectedMaxPrice < maxPrice ||
      searchTerm.length > 0 ||
      showOnlyFavorites
    );
  },

  filterProductsByBrands: () => {
    const { products, selectedBrands } = get();
    if (selectedBrands.length === 0) return products;

    const filteredProducts = products.filter((product: Product) =>
      product.brand != null && selectedBrands.includes(product.brand.id)
    );

    set({ filteredProducts });
  },
});
