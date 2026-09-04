'use client';
import Pagination from '@/app/components/global/Pagination';
import { useCartPage } from '@/hooks/useCartPage';
import { CART_PAGE_CONFIG, CART_PAGE_STYLES } from './constants';
import {
  EmptyCart,
  CartHeader,
  PaginationInfo,
  CartTable,
  CartMobileList,
  OrderSummary,
  DeleteConfirmationModal,
} from './components';

export default function CarroDeCompraPage() {
  const {
    // Estados
    idProductoAEliminar,
    setIdProductoAEliminar,
    
    // Datos
    cartProducts,
    paginationData,
    subtotal,
    vatRate,
    vatAmount,
    total,
    isCartEmpty,
    isCartLoading,
    
    // Navegación
    backHome,
    goNext,
    goBack,
    
    // Handlers
    handlePageChange,
    handleProductRemoval,
    decrementProductInCart,
    incrementProductInCart,
  } = useCartPage();

  return (
    <div className="w-full bg-slate-100 min-h-screen p-4">
      <div>
        {isCartEmpty ? (
          <EmptyCart onGoHome={backHome} />
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
            {/* Sección del carrito */}
            <div className="w-full lg:w-3/4 bg-white rounded-lg shadow p-6">
              <CartHeader 
                totalProducts={cartProducts.length} 
                onGoBack={goBack} 
              />

              {/* Información de paginación */}
              {paginationData.meta.total > CART_PAGE_CONFIG.ITEMS_PER_PAGE && (
                <PaginationInfo
                  from={paginationData.meta.from}
                  to={paginationData.meta.to}
                  total={paginationData.meta.total}
                />
              )}

              {/* Tabla para pantallas grandes */}
              <CartTable products={paginationData.paginatedProducts} />

              {/* Layout para móviles */}
              <CartMobileList
                products={paginationData.paginatedProducts}
                onDecrement={decrementProductInCart}
                onIncrement={incrementProductInCart}
                onSetProductToDelete={(productId, unit) =>
                  setIdProductoAEliminar({ productId, unit })
                }
              />

              {/* Paginación */}
              {paginationData.meta.total > CART_PAGE_CONFIG.ITEMS_PER_PAGE && (
                <div className="mt-6">
                  <Pagination
                    meta={paginationData.meta}
                    links={paginationData.links}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}

              <div className="mt-6">
                <button
                  className={`${CART_PAGE_STYLES.button.primary} hidden lg:block`}
                  onClick={backHome}
                >
                  Seguir comprando
                </button>
              </div>
            </div>

            {/* Resumen de compra */}
            <OrderSummary
              subtotal={subtotal}
              vatRate={vatRate}
              vatAmount={vatAmount}
              total={total}
              cartCount={cartProducts.length}
              onContinue={goNext}
              isLoading={isCartLoading}
            />

            {/* Modal de confirmación */}
            <DeleteConfirmationModal
              isOpen={idProductoAEliminar !== null}
              onCancel={() => setIdProductoAEliminar(null)}
              onConfirm={() =>
                idProductoAEliminar &&
                handleProductRemoval(
                  idProductoAEliminar.productId,
                  idProductoAEliminar.unit
                )
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
