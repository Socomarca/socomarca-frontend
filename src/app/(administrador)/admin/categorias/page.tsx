'use client'

import CustomTable from "@/app/components/admin/CustomTable";
import { fetchGetAllCategories } from "@/services/actions/categories.actions";
import { fetchExportCategories } from "@/services/actions/exports.actions";
import { useEffect, useState } from "react";
import { CategoryComponent } from "@/interfaces/category.interface";
import { PaginationMeta } from "@/stores/base/types";
import Search from "@/app/components/global/Search";
import TableSkeleton from "@/app/components/admin/TableSkeleton";
import SortDropdown from "@/app/components/filters/SortDropdown";
import { SortOption } from "@/interfaces/dashboard.interface";
import { formatDate } from "@/utils/formatCurrency";

const PAGE_SIZE = 20;

// La tabla lista los tres niveles juntos, así que agruparlos es lo que la hace
// legible: primero las supercategorías, luego las categorías, luego las
// subcategorías, alfabéticas dentro de cada grupo.
const DEFAULT_SORT: SortOption = { key: "level", label: "Nivel", direction: "asc" };

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Nombre" },
  { key: "code", label: "Código" },
  { key: "level", label: "Nivel", render: (_: any, row: CategoryComponent) => row.level ?? '-' },
  { key: "products_count", label: "Productos", render: (_: any, row: CategoryComponent) => row.products_count || 0 },
  { key: "created_at", label: "Fecha Creación", render: (_: any, row: CategoryComponent) => row.created_at ? formatDate(row.created_at) : '-' },
];

// Función para filtrar y ordenar datos localmente
const filterAndSortData = (categories: CategoryComponent[], search: string, sort: SortOption | null) => {
  let filteredData = [...categories];

  // Aplicar filtro de búsqueda
  if (search) {
    filteredData = filteredData.filter(category =>
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      category.code?.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Aplicar ordenamiento
  if (sort) {
    const factor = sort.direction === 'asc' ? 1 : -1;

    filteredData.sort((a, b) => {
      // El nivel tiene pocos valores distintos, así que sin desempate por
      // nombre las filas de un mismo nivel quedarían en orden arbitrario.
      if (sort.key === 'level') {
        const levelDiff = (a.level ?? 0) - (b.level ?? 0);
        return factor * (levelDiff || a.name.localeCompare(b.name));
      }

      let aValue: number;
      let bValue: number;

      switch (sort.key) {
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case 'id':
        default:
          aValue = a.id;
          bValue = b.id;
      }

      return factor * (aValue - bValue);
    });
  }

  return filteredData;
};

export default function CategoriesAdmin() {
  const [data, setData] = useState<CategoryComponent[]>([]);
  const [originalData, setOriginalData] = useState<CategoryComponent[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Estado para el ordenamiento
  const [sortOption, setSortOption] = useState<SortOption | null>(DEFAULT_SORT);

  // Estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    setInitialLoading(true);
    fetchGetAllCategories().then((res) => {
      if (res.ok && res.data) {
        // Asegurar que sea un array
        const categoriesData = (Array.isArray(res.data) ? res.data : res.data.data || []) as CategoryComponent[];
        setData(filterAndSortData(categoriesData, "", DEFAULT_SORT));
        setOriginalData(categoriesData);
        
        // Crear meta de paginación simulada para los datos mock
        const totalItems = categoriesData.length;
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        setMeta({
          current_page: 1,
          last_page: totalPages,
          per_page: PAGE_SIZE,
          total: totalItems,
          from: 1,
          to: Math.min(PAGE_SIZE, totalItems),
          links: [],
          path: '/admin/categorias'
        });
      }
      setInitialLoading(false);
    });
  }, []);

  // Opciones de columnas para ordenar
  const sortColumns = [
    { key: "id", label: "ID" },
    { key: "level", label: "Nivel" },
    { key: "created_at", label: "Fecha Creación" },
  ];

  // Manejar cambio de orden
  const handleSortChange = (option: SortOption | null) => {
    setSortOption(option);
    setLoading(true);
    
    // Simular delay para mostrar loading
    setTimeout(() => {
      const filteredData = filterAndSortData(originalData, searchTerm, option);
      
      // Actualizar meta de paginación
      const totalItems = filteredData.length;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);
      setMeta({
        current_page: 1,
        last_page: totalPages,
        per_page: PAGE_SIZE,
        total: totalItems,
        from: 1,
        to: Math.min(PAGE_SIZE, totalItems),
        links: [],
        path: '/admin/categorias'
      });
      
      setData(filteredData);
      setLoading(false);
    }, 300);
  };

  // Manejar búsqueda por nombre
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setLoading(true);
    
    // Simular delay para mostrar loading
    setTimeout(() => {
      const filteredData = filterAndSortData(originalData, term, sortOption);
      
      // Actualizar meta de paginación
      const totalItems = filteredData.length;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);
      setMeta({
        current_page: 1,
        last_page: totalPages,
        per_page: PAGE_SIZE,
        total: totalItems,
        from: 1,
        to: Math.min(PAGE_SIZE, totalItems),
        links: [],
        path: '/admin/categorias'
      });
      
      setData(filteredData);
      setLoading(false);
    }, 300);
  };

  // Limpiar búsqueda
  const handleClearSearch = async () => {
    setSearchTerm("");
    const defaultSort = DEFAULT_SORT;
    setSortOption(defaultSort);
    setLoading(true);
    
    // Simular delay para mostrar loading
    setTimeout(() => {
      const filteredData = filterAndSortData(originalData, "", defaultSort);
      
      // Actualizar meta de paginación
      const totalItems = filteredData.length;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);
      setMeta({
        current_page: 1,
        last_page: totalPages,
        per_page: PAGE_SIZE,
        total: totalItems,
        from: 1,
        to: Math.min(PAGE_SIZE, totalItems),
        links: [],
        path: '/admin/categorias'
      });
      
      setData(filteredData);
      setLoading(false);
    }, 300);
  };

  // Manejar descarga de categorías
  const handleDownload = async () => {
    try {
      setDownloadLoading(true);

      // Preparar filtros para la exportación
      const exportFilters: any = {};

      if (sortOption) {
        exportFilters.sort = sortOption.key;
        exportFilters.sort_direction = sortOption.direction;
      }

      const response = await fetchExportCategories(exportFilters);

      if (response.success && response.data) {
        // Crear blob y descargar el archivo
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `categorias_${
          new Date().toISOString().split('T')[0]
        }.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Error al exportar categorías:', response.message);
        alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al descargar categorías:', error);
      alert('Error al descargar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setDownloadLoading(false);
    }
  };

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
              placeholder="Buscar categoría por nombre o código"
              showLabel={false}
              initialValue={searchTerm}
            />
          </div>
          {/* FILTROS EN LÍNEA */}
          <div className="flex justify-between items-center w-full">
            <div className="flex justify-start gap-4">
              <div className="w-[300px]">
                <SortDropdown
                  tableColumns={sortColumns}
                  selectedOption={sortOption}
                  onSelectionChange={handleSortChange}
                />
              </div>
            </div>
            {/* Botones de descarga */}
            <div className="flex justify-end items-center gap-4">
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
        
        {initialLoading ? (
          <TableSkeleton columns={columns.length} rows={10} title="Categorías" />
        ) : loading ? (
          <TableSkeleton columns={columns.length} rows={10} title="Categorías" />
        ) : (
          <div className="relative w-full">
            <CustomTable
              title="Categorías"
              data={data}
              columns={columns}
              productPaginationMeta={meta}
              onPageChange={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
