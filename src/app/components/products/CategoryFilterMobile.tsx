'use client';

import { useEffect, useCallback } from 'react';
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import useStore from '@/stores/base';
import DualRangeSlider from './DualRangerSlider';

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
    brands,
    products,

    // Estados de filtros
    selectedCategories,
    selectedBrands,
    minPrice,
    maxPrice,
    lowerPrice,
    upperPrice,
    priceInitialized,

    // Estados de UI
    isMainCategoryOpen,
    isBrandsOpen,
    isFavoritesOpen,
    isPriceOpen,

    // Acciones de filtros
    toggleCategorySelection,
    toggleBrandSelection,
    setLowerPrice,
    setUpperPrice,
    handlePriceRangeChange,
    initializePriceRange,

    // Acciones de UI
    toggleMainCategory,
    toggleBrandsSection,
    toggleFavoritesSection,
    togglePriceSection,

    // Acciones principales
    applyFilters,
    clearAllFilters,
    hasActiveFilters,
  } = useStore();

  const formatPrice = useCallback((price: number): string => {
    return price.toLocaleString('es-CL');
  }, []);

  // Inicializar rango de precios cuando cambien los productos
  useEffect(() => {
    initializePriceRange(products);
  }, [products, initializePriceRange]);

  // Handle input changes for lower price
  const handleLowerPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^\d]/g, '');

      if (inputValue) {
        const numericValue = parseInt(inputValue);

        if (!isNaN(numericValue)) {
          setLowerPrice(numericValue);
        }
      }
    },
    [setLowerPrice]
  );

  // Handle input changes for upper price
  const handleUpperPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^\d]/g, '');

      if (inputValue) {
        const numericValue = parseInt(inputValue);

        if (!isNaN(numericValue)) {
          setUpperPrice(numericValue);
        }
      }
    },
    [setUpperPrice]
  );

  const handleApplyFilters = () => {
    applyFilters();
    onClose();
  };

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
          className={`bg-white w-full max-h-[90vh] rounded-t-2xl transform transition-transform duration-300 ease-out ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
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
              <div className="w-full max-h-[40vh] overflow-y-auto">
                {categories?.map((category) => (
                  <div key={category.id} className="w-full">
                    <div
                      className={`flex w-full min-h-[48px] items-center gap-3 cursor-pointer hover:bg-gray-50 transition-all duration-300 px-4 py-3 ${
                        selectedCategories.includes(category.id)
                          ? 'bg-gray-100'
                          : ''
                      }`}
                      onClick={() => toggleCategorySelection(category.id)}
                    >
                      <div
                        className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-300 ease-in-out transform ${
                          selectedCategories.includes(category.id)
                            ? 'bg-lime-500 border-lime-500 scale-110'
                            : 'border-gray-300 scale-100 hover:border-lime-300'
                        }`}
                      >
                        <div
                          className={`transition-all duration-200 ${
                            selectedCategories.includes(category.id)
                              ? 'opacity-100 scale-100'
                              : 'opacity-0 scale-75'
                          }`}
                        >
                          {selectedCategories.includes(category.id) && (
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
                        {category.name}
                      </span>
                    </div>
                  </div>
                ))}
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
              <div className="w-full max-h-[40vh] overflow-y-auto">
                {brands?.map((brand) => (
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
                ))}
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
              <div className="w-full p-4">
                <div className="text-base text-center text-gray-500">
                  Funcionalidad de favoritos próximamente
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
              <div className="w-full p-4">
                {hasPriceRange ? (
                  <div className="transition-opacity duration-300">
                    <DualRangeSlider
                      min={minPrice}
                      max={maxPrice}
                      initialLower={lowerPrice}
                      initialUpper={upperPrice}
                      onChange={handlePriceRangeChange}
                      formatValue={formatPrice}
                      step={100}
                    />
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

                <div className="flex justify-between gap-3 mb-4">
                  <div className="w-1/2">
                    <div className="text-sm text-gray-500 mb-2">Desde</div>
                    <input
                      disabled
                      type="text"
                      className="w-full border border-gray-300 rounded-md p-3 text-base transition-all duration-200 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 focus:outline-none"
                      placeholder={`$${formatPrice(minPrice)}`}
                      value={`${formatPrice(lowerPrice)}`}
                      onChange={handleLowerPriceChange}
                      onBlur={() => {
                        if (lowerPrice < minPrice) setLowerPrice(minPrice);
                        if (lowerPrice > upperPrice) setLowerPrice(upperPrice);
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
                      value={`${formatPrice(upperPrice)}`}
                      onChange={handleUpperPriceChange}
                      onBlur={() => {
                        if (upperPrice > maxPrice) setUpperPrice(maxPrice);
                        if (upperPrice < lowerPrice) setUpperPrice(lowerPrice);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with action buttons */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col gap-3">
              <button
                className="w-full bg-lime-500 text-white rounded-md py-4 px-6 text-center text-base font-medium hover:bg-lime-600 transition-all duration-300 cursor-pointer"
                onClick={handleApplyFilters}
              >
                Aplicar Filtros
              </button>

              {/* Clear filters button */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  hasActiveFilters()
                    ? 'max-h-16 opacity-100 transform translate-y-0'
                    : 'max-h-0 opacity-0 transform -translate-y-2'
                }`}
              >
                {hasActiveFilters() && (
                  <button
                    className="w-full bg-gray-200 text-gray-700 rounded-md py-3 px-6 text-center text-base font-medium hover:bg-gray-300 transition-all duration-300 cursor-pointer"
                    onClick={clearAllFilters}
                  >
                    Limpiar Filtros
                  </button>
                )}
              </div>
            </div>
          </div>
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
