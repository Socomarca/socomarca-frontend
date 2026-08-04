'use client';

import CustomTable from '@/app/components/admin/CustomTable';
import { fetchGetProducts } from '@/services/actions/products.actions';
import { fetchExportProducts } from '@/services/actions/exports.actions';
import { useEffect, useState } from 'react';
import { Product } from '@/interfaces/product.interface';
import { PaginationMeta } from '@/stores/base/types';
import { fetchGetCategories } from '@/services/actions/categories.actions';
import CategoryDropdown from '@/app/components/filters/CategoryDropdown';
import { CategoryComponent } from '@/interfaces/category.interface';
import { fetchSearchProductsByFilters } from '@/services/actions/products.actions';
import SortDropdown from '@/app/components/filters/SortDropdown';
import { SortOption } from '@/interfaces/dashboard.interface';
import Search from '@/app/components/global/Search';
import TableSkeleton from '@/app/components/admin/TableSkeleton';
import FilterSkeleton from '@/app/components/global/FilterSkeleton';
import ProductsPageSkeleton from '@/app/components/admin/ProductsPageSkeleton';

const PAGE_SIZE = 20;

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nombre' },
  { key: 'sku', label: 'SKU' },
  { key: 'price', label: 'Precio' },
  { key: 'stock', label: 'Stock' },
  {
    key: 'category',
    label: 'Categoría',
    render: (_: any, row: Product) => row.category?.name,
  },
  {
    key: 'brand',
    label: 'Marca',
    render: (_: any, row: Product) => row.brand?.name,
  },
  {
    key: 'price_list_id',
    label: 'Lista de precios',
    render: (_: any, row: Product) => row.price_list_id || 'Sin lista',
  },
];

export default function ProductsAdmin() {
  const [data, setData] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Categorías
  const [categories, setCategories] = useState<CategoryComponent[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Estado para el ordenamiento
  const [sortOption, setSortOption] = useState<SortOption | null>(null);
  // const [sorting, setSorting] = useState(false);

  // Estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  // const [searching, setSearching] = useState(false);

  useEffect(() => {
    setLoadingCategories(true);
    fetchGetCategories().then((res) => {
      if (res.ok && res.data) {
        // Asegurar que sea un array
        const categoriesData = Array.isArray(res.data)
          ? res.data
          : res.data.data || [];
        setCategories(categoriesData as CategoryComponent[]);
      }
      setLoadingCategories(false);
    });
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    setInitialLoading(true);
    fetchGetProducts({ page: 1, size: PAGE_SIZE }).then((res) => {
      if (res.ok && res.data) {
        setData(res.data.data);
        setMeta(res.data.meta);
      }
      setInitialLoading(false);
    });
  }, []);

  // Opciones de columnas para ordenar
  const sortColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    { key: 'price', label: 'Precio' },
    { key: 'stock', label: 'Stock' },
    { key: 'category_name', label: 'Categoría' },
    { key: 'brand_name', label: 'Marca' },
  ];

  // Manejar cambio de orden
  const handleSortChange = (option: SortOption | null) => {
    // setSorting(true);
    if (!option) {
      // Si se limpia el ordenamiento, volver a id asc
      const defaultSort: SortOption = {
        key: 'id',
        label: 'ID',
        direction: 'asc',
      };
      setSortOption(defaultSort);
      // Aplicar el ordenamiento por defecto
      const sortParams = {
        sort_field: 'id' as const,
        sort_direction: 'asc' as const,
      };
      setLoading(true);
      if (selectedCategories.length > 0) {
        fetchSearchProductsByFilters({
          category_id: [selectedCategories[0]],
          page,
          size: PAGE_SIZE,
          ...sortParams,
        }).then((res) => {
          if (res.ok && res.data) {
            setData(res.data.data);
            setMeta(res.data.meta);
          }
          setLoading(false);
          // setSorting(false);
        });
      } else {
        fetchSearchProductsByFilters({
          page,
          size: PAGE_SIZE,
          ...sortParams,
        }).then((res) => {
          if (res.ok && res.data) {
            setData(res.data.data);
            setMeta(res.data.meta);
          }
          setLoading(false);
          // setSorting(false);
        });
      }
      return;
    }
    setSortOption(option);
    if (option) {
      // alert eliminado
      // Aplicar el ordenamiento a los productos
      const sortParams = {
        sort_field: option.key as
          | 'id'
          | 'name'
          | 'price'
          | 'stock'
          | 'category_name'
          | 'brand_name',
        sort_direction: option.direction,
      };
      // Actualizar productos con el nuevo ordenamiento
      setLoading(true);
      if (selectedCategories.length > 0) {
        fetchSearchProductsByFilters({
          category_id: [selectedCategories[0]],
          page,
          size: PAGE_SIZE,
          ...sortParams,
        }).then((res) => {
          if (res.ok && res.data) {
            setData(res.data.data);
            setMeta(res.data.meta);
          }
          setLoading(false);
          // setSorting(false);
        });
      } else {
        fetchSearchProductsByFilters({
          page,
          size: PAGE_SIZE,
          ...sortParams,
        }).then((res) => {
          if (res.ok && res.data) {
            setData(res.data.data);
            setMeta(res.data.meta);
          }
          setLoading(false);
          // setSorting(false);
        });
      }
    }
  };

  // Manejar búsqueda por nombre
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setPage(1); // Reiniciar paginación al buscar
    // setSearching(true);
    setLoading(true);
    const sortParams = sortOption
      ? {
          sort_field: sortOption.key as
            | 'id'
            | 'name'
            | 'price'
            | 'stock'
            | 'category_name'
            | 'brand_name',
          sort_direction: sortOption.direction,
        }
      : {};
    const params: any = {
      page: 1,
      size: PAGE_SIZE,
      ...sortParams,
    };
    if (selectedCategories.length > 0) {
      params.category_id = selectedCategories[0];
    }
    if (term) {
      params.field = 'name';
      params.value = term;
    }
    const res = await fetchSearchProductsByFilters(params);
    if (res.ok && res.data) {
      setData(res.data.data);
      setMeta(res.data.meta);
    }
    setLoading(false);
    // setSearching(false);
  };

  // Limpiar búsqueda
  const handleClearSearch = async () => {
    setSearchTerm('');
    setPage(1);
    // setSearching(true);
    setLoading(true);
    const sortParams = sortOption
      ? {
          sort_field: sortOption.key as
            | 'id'
            | 'name'
            | 'price'
            | 'stock'
            | 'category_name'
            | 'brand_name',
          sort_direction: sortOption.direction,
        }
      : {};
    const params: any = {
      page: 1,
      size: PAGE_SIZE,
      ...sortParams,
    };
    if (selectedCategories.length > 0) {
      params.category_id = selectedCategories[0];
    }
    const res = await fetchSearchProductsByFilters(params);
    if (res.ok && res.data) {
      setData(res.data.data);
      setMeta(res.data.meta);
    }
    setLoading(false);
    // setSearching(false);
  };

  // Actualizar productos al cambiar de página, manteniendo el filtro si está activo
  useEffect(() => {
    setLoading(true);
    const sortParams = sortOption
      ? {
          sort_field: sortOption.key as
            | 'id'
            | 'name'
            | 'price'
            | 'stock'
            | 'category_name'
            | 'brand_name',
          sort_direction: sortOption.direction,
        }
      : {};
    const params: any = {
      page,
      size: PAGE_SIZE,
      ...sortParams,
    };
    if (selectedCategories.length > 0) {
      params.category_id = selectedCategories[0];
    }
    if (searchTerm) {
      params.field = 'name';
      params.value = searchTerm;
    }
    fetchSearchProductsByFilters(params).then((res) => {
      if (res.ok && res.data) {
        setData(res.data.data);
        setMeta(res.data.meta);
      }
      setLoading(false);
    });
  }, [page, selectedCategories, sortOption, searchTerm]);

  const handleCategoryChange = async (selectedIds: number[]) => {
    setSelectedCategories(selectedIds);
    setPage(1); // Reiniciar paginación al filtrar
    const sortParams = sortOption
      ? {
          sort_field: sortOption.key as
            | 'id'
            | 'name'
            | 'price'
            | 'stock'
            | 'category_name'
            | 'brand_name',
          sort_direction: sortOption.direction,
        }
      : {};

    const params: any = {
      page: 1,
      size: PAGE_SIZE,
      ...sortParams,
    };

    if (selectedIds.length > 0) {
      params.category_id = selectedIds[0];
    }

    if (searchTerm) {
      params.field = 'name';
      params.value = searchTerm;
    }

    setLoading(true);
    const res = await fetchSearchProductsByFilters(params);
    if (res.ok && res.data) {
      setData(res.data.data);
      setMeta(res.data.meta);
    }
    setLoading(false);
  };

  // Manejar descarga de productos
  const handleDownload = async () => {
    try {
      setDownloadLoading(true);

      // Preparar filtros para la exportación
      const exportFilters: any = {};

      if (sortOption) {
        exportFilters.sort = sortOption.key;
        exportFilters.sort_direction = sortOption.direction;
      }

      const response = await fetchExportProducts(exportFilters);

      if (response.success && response.data) {
        // Crear blob y descargar el archivo
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `productos_${
          new Date().toISOString().split('T')[0]
        }.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Error al exportar productos:', response.message);
        alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al descargar productos:', error);
      alert('Error al descargar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setDownloadLoading(false);
    }
  };

  if (initialLoading) {
    return <ProductsPageSkeleton />;
  }

  return (
    <div className="flex justify-center flex-row w-full">
      <div className="flex flex-col py-7 px-4 md:px-12 items-center justify-center w-full max-w-7xl">
        {/* BUSCADOR Y FILTROS */}
        <div className="w-full mb-6">
          {/* BUSCADOR */}
          <div className="w-full mb-4">
            <Search
              onSearch={handleSearch}
              onClear={handleClearSearch}
              placeholder="Buscar producto por nombre"
              showLabel={false}
              initialValue={searchTerm}
            />
          </div>
          {/* FILTROS EN LÍNEA */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              {loadingCategories ? (
                <div className="w-full md:w-[300px]">
                  <FilterSkeleton type="dropdown" label="Categoría" />
                </div>
              ) : (
                <div className="w-full md:w-[300px]">
                  <CategoryDropdown
                    categories={categories}
                    selectedIds={selectedCategories}
                    onSelectionChange={handleCategoryChange}
                  />
                </div>
              )}
              <div className="w-full md:w-[300px]">
                <SortDropdown
                  tableColumns={sortColumns}
                  selectedOption={sortOption}
                  onSelectionChange={handleSortChange}
                />
              </div>
            </div>
            {/* Botones de descarga */}
            <div className="flex justify-end items-center gap-4 w-full md:w-auto">
              {/* BOTÓN DE DESCARGA DESKTOP */}
              <div className="hidden md:block">
                <button
                  onClick={handleDownload}
                  disabled={downloadLoading}
                  className="bg-lime-500 hover:bg-lime-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-[6px] text-sm font-medium transition-colors duration-300 ease-in-out"
                >
                  {downloadLoading ? 'Descargando...' : 'Descargar Excel'}
                </button>
              </div>
            </div>
          </div>
          {/* BOTÓN DE DESCARGA MÓVIL */}
          <div className="block md:hidden mt-4">
            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="w-full bg-lime-500 hover:bg-lime-600 disabled:bg-gray-400 text-white py-2 rounded-[6px] text-sm font-medium transition-colors duration-300 ease-in-out"
            >
              {downloadLoading ? 'Descargando...' : 'Descargar Excel'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="relative w-full">
            <TableSkeleton
              columns={columns.length}
              rows={10}
              title="Productos"
            />
          </div>
        ) : (
          <div className="relative w-full">
            <CustomTable
              title="Productos"
              data={data}
              columns={columns}
              productPaginationMeta={meta}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
