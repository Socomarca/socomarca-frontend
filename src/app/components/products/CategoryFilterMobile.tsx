'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import useStore from '@/stores/base';
import DualRangeSlider from './DualRangerSlider';
import { formatNumber } from '@/utils/formatCurrency';
import { CategoryComplexData } from '@/interfaces/category.interface';

const getCategoryChildren = (category: CategoryComplexData) =>
  category.categories ?? category.subcategories ?? [];

const collectExpandedCategoryIds = (categories: CategoryComplexData[]): number[] =>
  categories.flatMap((category) => {
    const children = getCategoryChildren(category);

    return children.length > 0
      ? [category.id, ...collectExpandedCategoryIds(children)]
      : [];
  });

const categoryMatchesTerm = (category: CategoryComplexData, term: string): boolean => {
  const normalizedTerm = term.toLowerCase();

  return (
    category.name.toLowerCase().includes(normalizedTerm) ||
    getCategoryChildren(category).some((child) => categoryMatchesTerm(child, term))
  );
};

const renderCategoryOption = (
  category: CategoryComplexData,
  selectedCategories: number[],
  toggleCategorySelection: (categoryId: number) => void,
  expandedCategories: number[],
  toggleExpandedCategory: (categoryId: number) => void,
  level = 0
) => {
  const isSelected = selectedCategories.includes(category.id);
  const children = getCategoryChildren(category);
  const hasChildren = children.length > 0;
  const isExpanded = expandedCategories.includes(category.id);

  return (
    <div key={`${category.level ?? level}-${category.id}`} className="w-full">
      <div
        className={`flex w-full min-h-[42px] items-start gap-2 hover:bg-gray-50 transition-all duration-200 px-4 py-2 ${
          isSelected ? 'bg-gray-100' : ''
        }`}
        style={{ paddingLeft: `${16 + level * 14}px` }}
      >
        <button
          type="button"
          className="w-5 h-5 mt-0.5 flex items-center justify-center text-lime-500 disabled:text-transparent"
          disabled={!hasChildren}
          onClick={() => toggleExpandedCategory(category.id)}
          aria-label={isExpanded ? 'Contraer categoría' : 'Expandir categoría'}
        >
          {hasChildren && (isExpanded ? <MinusIcon width={16} /> : <PlusIcon width={16} />)}
        </button>
        <div
          className={`w-5 h-5 mt-0.5 border-2 rounded flex items-center justify-center transition-all duration-200 ease-in-out transform cursor-pointer shrink-0 ${
            isSelected
              ? 'bg-lime-500 border-lime-500 scale-110'
              : 'border-gray-300 scale-100 hover:border-lime-300'
          }`}
          onClick={() => toggleCategorySelection(category.id)}
        >
          <div
            className={`transition-all duration-200 ${
              isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
        <span
          className="text-base text-slate-600 flex-1 transition-colors duration-200 cursor-pointer whitespace-normal break-words leading-6"
          title={category.name}
          onClick={() => hasChildren ? toggleExpandedCategory(category.id) : toggleCategorySelection(category.id)}
        >
          {category.name}
        </span>
      </div>
      {isExpanded && children.map((child) =>
        renderCategoryOption(
          child,
          selectedCategories,
          toggleCategorySelection,
          expandedCategories,
          toggleExpandedCategory,
          level + 1
        )
      )}
    </div>
  );
};

interface CategoryFilterMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryFilterMobile({
  isOpen,
  onClose,
}: CategoryFilterMobileProps) {
  const {
    // Estados de datos
    categories,
    searchCategories,
    brands,

    // Estados de filtros
    selectedCategories,
    selectedBrands,
    minPrice,
    maxPrice,
    selectedMinPrice,
    selectedMaxPrice,
    priceInitialized,
    showOnlyFavorites,

    // Estados de UI
    isMainCategoryOpen,
    isBrandsOpen,
    isFavoritesOpen,
    isPriceOpen,

    // Acciones de filtros
    toggleCategorySelection,
    toggleBrandSelection,
    setSelectedMinPrice,
    setSelectedMaxPrice,
    handlePriceRangeChange,
    toggleShowOnlyFavorites,

    // Acciones de UI
    toggleMainCategory,
    toggleBrandsSection,
    toggleFavoritesSection,
    togglePriceSection,

    // Acciones principales
    clearAllFilters,
    hasActiveFilters,
  } = useStore();

  // Estados locales para búsqueda
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  useEffect(() => {
    if (searchCategories) {
      setExpandedCategories(collectExpandedCategoryIds(searchCategories));
    }
  }, [searchCategories]);

  const toggleExpandedCategory = useCallback((categoryId: number) => {
    setExpandedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  }, []);

  const formatPrice = useCallback((price: number): string => {
    return formatNumber(price);
  }, []);

  // Filtrar categorías por término de búsqueda
  const activeCategories = searchCategories ?? categories;
  const filteredCategories = activeCategories.filter((category) =>
    categoryMatchesTerm(category, categorySearchTerm)
  );
  // Filtrar marcas por término de búsqueda
  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
  );

  // Handle input changes for lower price
  const handleLowerPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove non-numeric characters
      const inputValue = e.target.value.replace(/[^\d]/g, '');

      if (inputValue) {
        const numericValue = parseInt(inputValue);

        if (!isNaN(numericValue)) {
          setSelectedMinPrice(numericValue);
        }
      }
    },
    [setSelectedMinPrice]
  );

  // Handle input changes for upper price
  const handleUpperPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove non-numeric characters
      const inputValue = e.target.value.replace(/[^\d]/g, '');

      if (inputValue) {
        const numericValue = parseInt(inputValue);

        if (!isNaN(numericValue)) {
          setSelectedMaxPrice(numericValue);
        }
      }
    },
    [setSelectedMaxPrice]
  );

  // Check if min and max are the same value
  const hasPriceRange = minPrice !== maxPrice && priceInitialized;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset search terms when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCategorySearchTerm('');
      setBrandSearchTerm('');
    }
  }, [isOpen]);

  // Sincronizar estados cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      // Asegurar que los estados de UI estén sincronizados
      // Los estados de filtros ya están sincronizados por el store
    }
  }, [isOpen, showOnlyFavorites]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[200] flex items-end justify-center">
        <div
          className={`bg-white w-full max-h-[90vh] rounded-t-2xl transform transition-transform duration-300 ease-out flex flex-col ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content - Scrollable area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* CATEGORÍA section */}
            <div
              className="flex w-full h-[48px] p-4 items-center justify-between gap-[10px] border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              onClick={toggleMainCategory}
            >
              <span className="font-bold uppercase text-gray-800">
                Categoría
              </span>
              <div className="transition-transform duration-300 ease-in-out">
                {isMainCategoryOpen ? (
                  <MinusIcon width={24} height={24} className="text-lime-500" />
                ) : (
                  <PlusIcon width={24} height={24} className="text-lime-500" />
                )}
              </div>
            </div>

            {/* Category list */}
            <div
              className={`w-full overflow-hidden transition-all duration-400 ease-in-out ${
                isMainCategoryOpen
                  ? 'max-h-[40vh] opacity-100'
                  : 'max-h-0 opacity-0'
              }`}
            >
              {/* Search input for categories */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar categoría..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:border-lime-500 focus:ring-2 focus:ring-lime-200 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="w-full max-h-[32vh] overflow-y-auto overflow-x-hidden">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) =>
                    renderCategoryOption(
                      category,
                      selectedCategories,
                      toggleCategorySelection,
                      expandedCategories,
                      toggleExpandedCategory
                    )
                  )
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No se encontraron categorías
                  </div>
                )}
              </div>
            </div>

            {/* MARCAS section */}
            <div
              className="flex w-full h-[48px] p-4 items-center justify-between gap-[10px] border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              onClick={toggleBrandsSection}
            >
              <span className="font-bold uppercase text-gray-800">Marcas</span>
              <div className="transition-transform duration-300 ease-in-out">
                {isBrandsOpen ? (
                  <MinusIcon width={24} height={24} className="text-lime-500" />
                ) : (
                  <PlusIcon width={24} height={24} className="text-lime-500" />
                )}
              </div>
            </div>

            {/* Brands list */}
            <div
              className={`w-full overflow-hidden transition-all duration-400 ease-in-out ${
                isBrandsOpen ? 'max-h-[40vh] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              {/* Search input for brands */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar marca..."
                    value={brandSearchTerm}
                    onChange={(e) => setBrandSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:border-lime-500 focus:ring-2 focus:ring-lime-200 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="w-full max-h-[32vh] overflow-y-auto">
                {filteredBrands.length > 0 ? (
                  filteredBrands.map((brand) => (
                    <div key={brand.id} className="w-full">
                      <div
                        className={`flex w-full min-h-[48px] items-center gap-3 cursor-pointer hover:bg-gray-50 transition-all duration-300 px-4 py-3 ${
                          selectedBrands.includes(brand.id) ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => toggleBrandSelection(brand.id)}
                      >
                        <div
                          className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-300 ease-in-out transform ${
                            selectedBrands.includes(brand.id)
                              ? 'bg-lime-500 border-lime-500 scale-110'
                              : 'border-gray-300 scale-100 hover:border-lime-300'
                          }`}
                        >
                          <div
                            className={`transition-all duration-200 ${
                              selectedBrands.includes(brand.id)
                                ? 'opacity-100 scale-100'
                                : 'opacity-0 scale-75'
                            }`}
                          >
                            {selectedBrands.includes(brand.id) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-base text-slate-600 flex-1 transition-colors duration-200">
                          {brand.name}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No se encontraron marcas
                  </div>
                )}
              </div>
            </div>

            {/* MIS FAVORITOS section */}
            <div
              className="flex w-full h-[48px] p-4 items-center justify-between gap-[10px] border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              onClick={toggleFavoritesSection}
            >
              <span className="font-bold uppercase text-gray-800">
                Mis favoritos
              </span>
              <div className="transition-transform duration-300 ease-in-out">
                {isFavoritesOpen ? (
                  <MinusIcon width={24} height={24} className="text-lime-500" />
                ) : (
                  <PlusIcon width={24} height={24} className="text-lime-500" />
                )}
              </div>
            </div>

            {/* Favoritos content */}
            <div
              className={`w-full overflow-hidden transition-all duration-400 ease-in-out ${
                isFavoritesOpen
                  ? 'max-h-[20vh] opacity-100'
                  : 'max-h-0 opacity-0'
              }`}
            >
              {' '}
              <div className="w-full p-4">
                <div className="flex items-center gap-2">
                  <input
                    id="favorite-checkbox-mobile"
                    type="checkbox"
                    checked={showOnlyFavorites}
                    onChange={() => {
                      console.log(
                        'Toggle favorites clicked, current state:',
                        showOnlyFavorites
                      );
                      toggleShowOnlyFavorites();
                    }}
                  />
                  <label
                    htmlFor="favorite-checkbox-mobile"
                    className="text-sm text-slate-500 cursor-pointer"
                  >
                    Mostrar solo favoritos
                  </label>
                </div>
              </div>
            </div>

            {/* PRECIO section */}
            <div
              className="flex w-full h-[48px] p-4 items-center justify-between gap-[10px] border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              onClick={togglePriceSection}
            >
              <span className="font-bold uppercase text-gray-800">Precio</span>
              <div className="transition-transform duration-300 ease-in-out">
                {isPriceOpen ? (
                  <MinusIcon width={24} height={24} className="text-lime-500" />
                ) : (
                  <PlusIcon width={24} height={24} className="text-lime-500" />
                )}
              </div>
            </div>

            {/* Price range slider and inputs */}
            <div
              className={`w-full overflow-hidden transition-all duration-400 ease-in-out ${
                isPriceOpen && priceInitialized
                  ? 'max-h-96 opacity-100'
                  : 'max-h-0 opacity-0'
              }`}
            >
              {' '}
              <div className="w-full p-4">
                {hasPriceRange ? (
                  <div className="transition-opacity duration-300">
                    {' '}
                    <DualRangeSlider
                      min={minPrice}
                      max={maxPrice}
                      selectedMin={selectedMinPrice}
                      selectedMax={selectedMaxPrice}
                      onChange={handlePriceRangeChange}
                      step={100}
                    />{' '}
                    <div className="flex justify-between gap-3 mb-4">
                      <div className="w-1/2">
                        <div className="text-sm text-gray-500 mb-2">Desde</div>
                        <input
                          disabled
                          type="text"
                          className="w-full border border-gray-300 rounded-md p-3 text-base transition-all duration-200 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 focus:outline-none"
                          placeholder={`$${formatPrice(minPrice)}`}
                          value={`${formatPrice(selectedMinPrice)}`}
                          onChange={handleLowerPriceChange}
                          onBlur={() => {
                            if (selectedMinPrice < minPrice)
                              setSelectedMinPrice(minPrice);
                            if (selectedMinPrice > selectedMaxPrice)
                              setSelectedMinPrice(selectedMaxPrice);
                          }}
                        />
                      </div>
                      <div className="w-1/2">
                        <div className="text-sm text-gray-500 mb-2">Hasta</div>
                        <input
                          disabled
                          type="text"
                          className="w-full border border-gray-300 rounded-md p-3 text-base transition-all duration-200 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 focus:outline-none"
                          placeholder={`${formatPrice(maxPrice)}`}
                          value={`${formatPrice(selectedMaxPrice)}`}
                          onChange={handleUpperPriceChange}
                          onBlur={() => {
                            if (selectedMaxPrice > maxPrice)
                              setSelectedMaxPrice(maxPrice);
                            if (selectedMaxPrice < selectedMinPrice)
                              setSelectedMaxPrice(selectedMinPrice);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 mt-4 transition-opacity duration-300">
                    <div className="text-base text-center text-gray-500">
                      {priceInitialized
                        ? 'Todos los productos tienen el mismo precio'
                        : 'Cargando precios...'}
                    </div>
                    <div className="relative h-2 mb-6 mt-3">
                      <div className="absolute w-full h-2 bg-gray-200 rounded-full"></div>
                      <div className="absolute h-2 w-full bg-lime-500 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Los filtros se aplican solos al marcarlos; el modal se cierra con
              la X o tocando el fondo. Acá solo queda limpiar, si hay filtros. */}
          {hasActiveFilters() && (
            <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
              <button
                className="w-full bg-gray-200 text-gray-700 rounded-md py-3 px-6 text-center text-base font-medium hover:bg-gray-300 transition-all duration-300 cursor-pointer"
                onClick={clearAllFilters}
              >
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Mobile Filter Button Component
export function CategoryFilterMobileButton({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="w-full h-[36px] items-center px-2">
      <div className="pl-[9px] pr-auto">
        <button
          className="bg-lime-200 flex items-center rounded-3xl gap-[6px] px-[14px] py-[6px] hover:bg-lime-300 transition-colors duration-200"
          onClick={onOpen}
        >
          <AdjustmentsHorizontalIcon width={24} height={24} />
          <label className="text-sm cursor-pointer">
            Seleccionar Categoría
          </label>
        </button>
      </div>
    </div>
  );
}
