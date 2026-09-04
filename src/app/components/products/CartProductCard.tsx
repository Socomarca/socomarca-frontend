import { CartItem } from '@/interfaces/product.interface';
import useStore from '@/stores/base';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { 
  QuantitySelector, 
  ProductImage, 
  ProductInfo 
} from '@/app/components/atoms';
import { addVat } from '@/utils/vat';

interface Props {
  product: CartItem;
  index: number;
}

export default function CartProductCard({ product, index }: Props) {
  const {
    addProductToCartOptimistic,
    removeProductFromCartOptimistic,
    vatRate,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);

  const decreaseQuantity = async () => {
    setIsLoading(true);
    
    if (product.quantity > 1) {
      try {
        const response = await removeProductFromCartOptimistic(product, 1);
        if (!response.ok) {
          console.error('Error decrementing product in cart:');
        }
      } catch (error) {
        console.error('Error decrementing product:', error);
      }
    }
    setIsLoading(false);
  };

  const increaseQuantity = async () => {
    setIsLoading(true);
    
    if (product.quantity < product.stock) {
      try {
        const response = await addProductToCartOptimistic(product.id, 1, product.unit, product);
        if (!response.ok) {
          console.error('Error adding product to cart:');
        }
      } catch (error) {
        console.error('Error adding product:', error);
      }
    }
    setIsLoading(false);
  };

  const deleteAllQuantity = async () => {
    setIsLoading(true);
    
    try {
      const response = await removeProductFromCartOptimistic(product, product.quantity);
      if (!response.ok) {
        console.error('Error removing all quantity of product from cart:');
      }
    } catch (error) {
      console.error('Error removing product:', error);
    }
    setIsLoading(false);
  };
  
  // El carrito llega neto desde la API; se muestra con IVA como el catálogo.
  const totalPrice = addVat(
    product.price * product.quantity,
    vatRate
  ).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
  });

  return (
    <div
      className={`flex w-full min-w-0 p-3 items-center gap-2 bg-white border-r border-l border-b border-slate-300 relative ${
        index === 0 && 'border-t'
      } h-[80px]`}
    >
      {/* Imagen del producto - fijo */}
      <div className="flex-shrink-0">
        <ProductImage
          src={product.image}
          alt={product.name}
          variant="cart"
        />
      </div>
      
      {/* Información del producto - flexible con truncado */}
      <ProductInfo
        brand={product.brand}
        name={product.name}
        price={addVat(product.price, vatRate)}
        unit={product.unit}
        variant="cart"
        truncateLength={{ brand: 10, name: 10 }}
      />
      
      {/* Controles y precio - flexible */}
      <div className="flex flex-1 min-w-0 justify-end items-center gap-2">
        {/* Controles de cantidad */}
        <QuantitySelector
          quantity={product.quantity}
          minQuantity={1}
          maxQuantity={product.stock}
          onDecrease={decreaseQuantity}
          onIncrease={increaseQuantity}
          onChange={() => {}} // No se usa en el cart
          disabled={isLoading}
          size="sm"
        />
        
        {/* Precio - con ancho máximo */}
        <div className="flex items-center justify-end min-w-0 max-w-[80px]">
          <span className="text-[11px] font-bold truncate" title={totalPrice}>
            {totalPrice}
          </span>
        </div>
        
        {/* Icono de eliminar - fijo */}
        <div className="flex-shrink-0">
          <TrashIcon
            className={`transition-all duration-200 ${
              isLoading 
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:text-red-600'
            }`}
            onClick={isLoading ? undefined : deleteAllQuantity}
            color="#E11D48"
            width={14}
            height={14}
          />
        </div>
      </div>
    </div>
  );
}