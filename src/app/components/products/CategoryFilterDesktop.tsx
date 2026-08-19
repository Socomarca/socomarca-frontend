'use client';

import { useCallback, useEffect, useState } from 'react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
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
        className={`flex w-full min-h-[36px] items-start gap-2 hover:bg-gray-50 transition-all duration-200 px-3 py-1.5 ${
          isSelected ? 'bg-gray-100' : ''
        }`}
        style={{ paddingLeft: `${12 + level * 12}px` }}
      >
        <button
          type="button"
          className="w-4 h-4 mt-0.5 flex items-center justify-center text-lime-500 disabled:text-transparent"
          disabled={!hasChildren}
          onClick={() => toggleExpandedCategory(category.id)}
          aria-label={isExpanded ? 'Contraer categoría' : 'Expandir categoría'}
        >
          {hasChildren && (isExpanded ? <MinusIcon width={14} /> : <PlusIcon width={14} />)}
        </button>
        <div
          className={`w-4 h-4 mt-0.5 border-2 rounded flex items-center justify-center transition-all duration-200 ease-in-out transform cursor-pointer shrink-0 ${
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
          className="text-sm text-slate-500 flex-1 transition-colors duration-200 cursor-pointer whitespace-normal break-words leading-5"
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

export default function CategoryFilterDesktop() {
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

  return (
    <div className="flex flex-col items-start bg-white w-[235px] h-full">
      {/* Main category header */}
      <div
        className="flex w-full h-[48px] p-3 items-center justify-between gap-[10px] border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={toggleMainCategory}
      >
        <span className="font-bold uppercase text-gray-800">Categoría</span>
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
          isMainCategoryOpen ? 'max-h-[40dvh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="w-full max-h-[40dvh] overflow-y-auto overflow-x-hidden">
          {(searchCategories ?? categories)?.map((category) =>
            renderCategoryOption(
              category,
              selectedCategories,
              toggleCategorySelection,
              expandedCategories,
              toggleExpandedCategory
            )
          )}
        </div>
      </div>

      {/* MARCAS section */}
      <div
        className="flex w-full h-[48px] p-3 items-center justify-between gap-[10px] border-t border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
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
          isBrandsOpen ? 'max-h-[40dvh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="w-full max-h-[40dvh] overflow-y-auto">
          {brands?.map((brand) => (
            <div key={brand.id} className="w-full">
              <div
                className={`flex w-full min-h-[40px] items-center gap-3 cursor-pointer hover:bg-gray-50 transition-all duration-300 px-3 py-2 ${
                  selectedBrands.includes(brand.id) ? 'bg-gray-100' : ''
                }`}
                onClick={() => toggleBrandSelection(brand.id)}
              >
                <div
                  className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all duration-300 ease-in-out transform ${
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
                <span className="text-sm text-slate-500 flex-1 transition-colors duration-200">
                  {brand.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MIS FAVORITOS section */}
      <div
        className="flex w-full h-[48px] p-3 items-center justify-between gap-[10px] border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={toggleFavoritesSection}
      >
        <span className="font-bold uppercase text-gray-800">Mis favoritos</span>
        <div className="transition-transform duration-300 ease-in-out">
          {isFavoritesOpen ? (
            <MinusIcon width={24} height={24} className="text-lime-500" />
          ) : (
            <PlusIcon width={24} height={24} className="text-lime-500" />
          )}
        </div>
      </div>

      {/* Favoritos content (placeholder) */}
      <div
        className={`w-full overflow-hidden transition-all duration-400 ease-in-out ${
          isFavoritesOpen ? 'max-h-[20dvh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {' '}
        <div className="w-full p-3 flex items-center gap-2">
          <input
            id="favorite-checkbox"
            type="checkbox"
            checked={showOnlyFavorites}
            onChange={toggleShowOnlyFavorites}
          />
          <label
            htmlFor="favorite-checkbox"
            className="text-sm text-slate-500 cursor-pointer"
          >
            Mostrar solo favoritos
          </label>
        </div>
      </div>

      {/* PRECIO section */}
      <div
        className="flex w-full h-[48px] p-3 items-center justify-between gap-[10px] border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
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
        <div className="w-full p-3">
          {' '}
          {hasPriceRange ? (
            <div className="transition-opacity duration-300">
              {(() => {
                return null;
              })()}
              <DualRangeSlider
                min={minPrice}
                max={maxPrice}
                selectedMin={selectedMinPrice}
                selectedMax={selectedMaxPrice}
                onChange={handlePriceRangeChange}
                step={100}
              />
            </div>
          ) : (
            <div className="mb-6 mt-4 transition-opacity duration-300">
              <div className="text-sm text-center text-gray-500">
                {priceInitialized
                  ? 'Todos los productos tienen el mismo precio'
                  : 'Cargando precios...'}
              </div>
              <div className="relative h-2 mb-6 mt-3">
                <div className="absolute w-full h-2 bg-gray-200 rounded-full"></div>
                <div className="absolute h-2 w-full bg-lime-500 rounded-full"></div>
              </div>
            </div>
          )}{' '}
          <div className="flex justify-between gap-2 mb-4">
            <div className="w-1/2">
              <div className="text-xs text-gray-500 mb-1">Desde</div>
              <input
                disabled
                type="text"
                className="w-full border border-gray-300 rounded-md p-2 text-sm transition-all duration-200 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 focus:outline-none"
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
              <div className="text-xs text-gray-500 mb-1">Hasta</div>
              <input
                disabled
                type="text"
                className="w-full border border-gray-300 rounded-md p-2 text-sm transition-all duration-200 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 focus:outline-none"
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
      </div>

      {/* Los filtros se aplican solos al marcarlos, así que acá solo queda la
          acción de limpiarlos, y únicamente si hay alguno aplicado. */}
      {hasActiveFilters() && (
        <div className="w-full p-3 mt-auto border-t border-gray-200">
          <button
            className="w-full bg-gray-200 text-gray-700 rounded-md py-3 px-12 text-center text-[12px] hover:bg-gray-300 transition-all duration-300 cursor-pointer"
            onClick={clearAllFilters}
          >
            Limpiar Filtros
          </button>
        </div>
      )}
    </div>
  );
}
