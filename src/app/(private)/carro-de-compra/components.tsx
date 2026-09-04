/**
 * Subcomponentes para la página del carrito de compras
 */
import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import CarroCompraCard from '@/app/components/carro-de-compra/CarroCompraCard';
import CarroCompraCardMobile from '@/app/components/carro-de-compra/CarroCompraCardMobile';
import { CART_PAGE_CONFIG, CART_PAGE_STYLES } from './constants';
import { CartItem } from '@/interfaces/product.interface';
import useStore from '@/stores/base';

interface EmptyCartProps {
  onGoHome: () => void;
}

export const EmptyCart = ({ onGoHome }: EmptyCartProps) => (
  <div className="flex flex-col items-center justify-center mt-10">
    <Image
      src={CART_PAGE_CONFIG.EMPTY_CART_IMAGE}
      alt="Carrito vacío"
      width={96}
      height={96}
      className="mb-6"
    />
    <h2 data-cy="empty-cart-message" className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
    <p className="text-gray-500 mb-4">
      Agrega productos a tu carrito para comenzar a comprar.
    </p>
    <button
      onClick={onGoHome}
      className={CART_PAGE_STYLES.button.primary}
    >
      Ir a la tienda
    </button>
  </div>
);

interface CartHeaderProps {
  totalProducts: number;
  onGoBack: () => void;
}

export const CartHeader = ({ totalProducts, onGoBack }: CartHeaderProps) => {
  const { clearCart } = useStore();
  const [isClearing, setIsClearing] = useState(false);

  const handleEmptyCart = async () => {
    setIsClearing(true);
    try {
      await clearCart();
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
         <ChevronLeftIcon
           className="w-5 h-5 font-bold lg:hidden cursor-pointer"
           strokeWidth={3}
           onClick={onGoBack}
           aria-label="Volver atrás"
         />
         <div className="flex flex-col">
           <h2 className="text-2xl font-bold">
             Carro
           </h2>
           <p className="text-lime-500 text-base font-normal">
             ({totalProducts} productos)
           </p>
         </div>
       </div>
      {totalProducts > 0 && (
        <span
          data-cy="empty-cart-btn"
          onClick={isClearing ? undefined : handleEmptyCart}
          className={`flex gap-2 items-center font-semibold ${
            isClearing 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-lime-500 cursor-pointer hover:text-lime-700'
          }`}
        >
          {isClearing ? (
            <>
              Vaciando... 
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-lime-500"></div>
            </>
          ) : (
            <>
              Vaciar carro <TrashIcon width={14} height={14} />
            </>
          )}
        </span>
      )}
    </div>
  );
};

interface PaginationInfoProps {
  from: number;
  to: number;
  total: number;
}

export const PaginationInfo = ({ from, to, total }: PaginationInfoProps) => (
  <div className="mb-4 text-sm text-gray-600">
    Mostrando {from} - {to} de {total} productos
  </div>
);

interface CartTableProps {
  products: CartItem[];
}

export const CartTable = ({ products }: CartTableProps) => (
  <div className="hidden lg:block overflow-x-auto">
    <div className={`max-h-[${CART_PAGE_CONFIG.MAX_HEIGHT_DESKTOP}] overflow-y-auto overflow-hidden`}>
      <table className="min-w-full text-sm">
        <thead className="sticky -top-[1px] bg-white z-10">
          <tr className="border border-slate-100 bg-slate-50 font-semibold text-gray-600 text-left">
            <th className="p-4 text-center font-semibold text-black">
              Producto
            </th>
            <th className="p-4 text-center font-semibold text-black">
              Cantidad
            </th>
            <th className="p-4 text-center font-semibold text-black">
              Precio (IVA incl.)
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <CarroCompraCard key={`${product.id}-${product.unit}`} product={product} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

interface CartMobileListProps {
  products: CartItem[];
  onDecrement: (productId: number, unit: string) => void;
  onIncrement: (productId: number, unit: string) => void;
  onSetProductToDelete: (productId: number, unit: string) => void;
}

export const CartMobileList = ({ 
  products, 
  onDecrement, 
  onIncrement, 
  onSetProductToDelete 
}: CartMobileListProps) => (
  <div className={`lg:hidden flex flex-col gap-4 max-h-[${CART_PAGE_CONFIG.MAX_HEIGHT_DESKTOP}] overflow-y-auto`}>
    {products.map((product) => (
      <CarroCompraCardMobile
        key={`${product.id}-${product.unit}`}
        decrementProductInCart={onDecrement}
        incrementProductInCart={onIncrement}
        p={product}
        setIdProductoAEliminar={onSetProductToDelete}
      />
    ))}
  </div>
);

interface OrderSummaryProps {
  /** Suma neta de los productos */
  subtotal: number;
  /** Tasa de IVA vigente, como porcentaje */
  vatRate: number;
  /** IVA calculado sobre el subtotal */
  vatAmount: number;
  /** Subtotal + IVA, sin despacho */
  total: number;
  cartCount: number;
  onContinue: () => void;
  isLoading?: boolean;
}

/** Monto del resumen, con su placeholder mientras se recalcula el carro. */
const SummaryAmount = ({
  amount,
  isLoading,
}: {
  amount: number;
  isLoading: boolean;
}) =>
  isLoading ? (
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-lime-500"></div>
      <span className="text-gray-400">Calculando...</span>
    </div>
  ) : (
    <span>${amount.toLocaleString(CART_PAGE_CONFIG.CURRENCY_LOCALE)}</span>
  );

export const OrderSummary = ({
  subtotal,
  vatRate,
  vatAmount,
  total,
  cartCount,
  onContinue,
  isLoading = false,
}: OrderSummaryProps) => (
  <aside className="w-full lg:w-1/4 bg-white rounded-lg shadow p-6 h-fit">
    <div className="border-b-[1px] border-b-slate-100 pb-2 mb-3">
      <h3 className="text-xl font-bold border-b-slate-50">
        Resumen de compra
      </h3>
    </div>
    <div className="flex justify-between mb-2">
      <span>Subtotal (neto)</span>
      <SummaryAmount amount={subtotal} isLoading={isLoading} />
    </div>
    <div className="flex justify-between mb-2 pb-3 border-b-[1px] border-b-slate-100">
      <span>IVA ({vatRate}%)</span>
      <SummaryAmount amount={vatAmount} isLoading={isLoading} />
    </div>
    <div className="flex justify-between font-bold mb-2">
      <span>Total todo medio de pago</span>
      <SummaryAmount amount={total} isLoading={isLoading} />
    </div>
    <p className="text-xs text-gray-500 mb-4">
      Envíos calculados al finalizar la compra
    </p>

    <button
      onClick={onContinue}
      disabled={cartCount === 0 || isLoading}
      className={`w-full ${
        cartCount > 0 && !isLoading
          ? 'bg-lime-500 hover:bg-lime-600'
          : CART_PAGE_STYLES.button.disabled
      } text-white py-2 rounded`}
    >
      Continuar con la compra
    </button>
  </aside>
);

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal = ({ 
  isOpen, 
  onCancel, 
  onConfirm 
}: DeleteConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={CART_PAGE_STYLES.modal.overlay}>
      <div className={CART_PAGE_STYLES.modal.content}>
        <h4 className="text-lg font-bold mb-2">Eliminar producto</h4>
        <p className="text-sm text-gray-600 mb-4">
          ¿Estás seguro que deseas eliminar este producto del carrito?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className={CART_PAGE_STYLES.button.secondary}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={CART_PAGE_STYLES.button.danger}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
