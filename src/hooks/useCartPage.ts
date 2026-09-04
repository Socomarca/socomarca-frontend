/**
 * Custom hook para manejar la lógica de la página del carrito de compras
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useStore from '@/stores/base';
import { buildVatBreakdown } from '@/utils/vat';

const ITEMS_PER_PAGE = 10;

export const useCartPage = () => {
  const router = useRouter();
  const {
    cartProducts,
    removeAllQuantityByProductId,
    decrementProductInCart,
    incrementProductInCart,
    isCartLoading,
    vatRate,
    fetchVatRate,
  } = useStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [idProductoAEliminar, setIdProductoAEliminar] = useState<{
    productId: number;
    unit: string;
  } | null>(null);

  /** Datos de paginación calculados */
  const paginationData = useMemo(() => {
    const totalProducts = cartProducts?.length || 0;
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedProducts = cartProducts?.slice(startIndex, endIndex) || [];

    const meta = {
      current_page: currentPage,
      from: totalProducts > 0 ? startIndex + 1 : 0,
      last_page: totalPages,
      links: [],
      path: '/carro-de-compra',
      per_page: ITEMS_PER_PAGE,
      to: Math.min(endIndex, totalProducts),
      total: totalProducts,
    };

    const links = {
      first: totalPages > 0 ? '/carro-de-compra?page=1' : null,
      last: totalPages > 0 ? `/carro-de-compra?page=${totalPages}` : null,
      prev: currentPage > 1 ? `/carro-de-compra?page=${currentPage - 1}` : null,
      next: currentPage < totalPages ? `/carro-de-compra?page=${currentPage + 1}` : null,
    };

    return { meta, links, paginatedProducts };
  }, [cartProducts, currentPage]);

  // El carrito puede abrirse sin pasar por el catálogo, que es quien deja la
  // tasa en el store.
  useEffect(() => {
    fetchVatRate();
  }, [fetchVatRate]);

  /**
   * Desglose del carrito. `GET /cart` devuelve precios netos, así que el IVA se
   * calcula acá con la tasa vigente para que coincida con la orden final.
   */
  const totals = useMemo(() => {
    const net =
      cartProducts?.reduce((acc, p) => acc + p.price * p.quantity, 0) || 0;

    return buildVatBreakdown(net, vatRate);
  }, [cartProducts, vatRate]);

  /** Navegación al inicio */
  const backHome = useCallback(() => {
    router.push('/');
  }, [router]);

  /** Continuar con la compra */
  const goNext = useCallback(() => {
    router.push('/finalizar-compra');
  }, [router]);

  /** Volver atrás */
  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  /** Cambiar página y hacer scroll suave */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /** Eliminar producto y ajustar paginación */
  const handleProductRemoval = useCallback((productId: number, unit: string) => {
    removeAllQuantityByProductId(productId, unit);

    // Ajustar página si queda vacía después de eliminar
    const remainingProducts = cartProducts?.filter(
      (p) => p.id !== productId || p.unit !== unit
    ) || [];
    const totalPagesAfterRemoval = Math.ceil(remainingProducts.length / ITEMS_PER_PAGE);

    if (currentPage > totalPagesAfterRemoval && totalPagesAfterRemoval > 0) {
      setCurrentPage(totalPagesAfterRemoval);
    } else if (remainingProducts.length === 0) {
      setCurrentPage(1);
    }

    setIdProductoAEliminar(null);
  }, [cartProducts, currentPage, removeAllQuantityByProductId]);

  /** Verificar si el carrito está vacío */
  const isCartEmpty = useMemo(() => {
    return !cartProducts || cartProducts.length === 0;
  }, [cartProducts]);

  return {
    // Estados
    currentPage,
    idProductoAEliminar,
    setIdProductoAEliminar,
    
    // Datos calculados
    cartProducts: cartProducts || [],
    paginationData,
    subtotal: totals.subtotal,
    vatRate: totals.rate,
    vatAmount: totals.vatAmount,
    total: totals.total,
    isCartEmpty,
    isCartLoading,
    
    // Funciones de navegación
    backHome,
    goNext,
    goBack,
    
    // Funciones de manejo
    handlePageChange,
    handleProductRemoval,
    
    // Funciones del store
    decrementProductInCart,
    incrementProductInCart,
  };
};
