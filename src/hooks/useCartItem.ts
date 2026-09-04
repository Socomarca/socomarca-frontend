/**
 * Custom hook para manejar la lógica de un item del carrito de compras
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartItem } from '@/interfaces/product.interface';
import useStore from '@/stores/base';
import { CART_CONFIG, ERROR_MESSAGES } from '@/app/components/carro-de-compra/constants';
import { addVat } from '@/utils/vat';

interface UseCartItemReturn {
  isLoading: boolean;
  backgroundImage: string;
  totalPrice: string;
  decreaseQuantity: () => Promise<void>;
  increaseQuantity: () => Promise<void>;
  deleteAllQuantity: () => Promise<void>;
}

export const useCartItem = (product: CartItem): UseCartItemReturn => {
  const { addProductToCart, removeProductFromCart, vatRate } = useStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(`url(${product.image})`);

  // Manejo de fallback para imagen del producto
  useEffect(() => {
    const img = new Image();
    img.src = product.image;
    img.onerror = () => {
      setBackgroundImage(`url(${CART_CONFIG.FALLBACK_IMAGE})`);
    };
  }, [product.image]);

  // Función para manejar errores
  const handleError = useCallback((error: string, action: string) => {
    console.error(`Error al ${action}: ${error}`);
    // Aquí podrías agregar un sistema de notificaciones
    // toast.error(`Error al ${action}`);
  }, []);

  /** Disminuye la cantidad del producto en 1 */
  const decreaseQuantity = useCallback(async () => {
    if (isLoading || product.quantity <= 1) return;
    
    setIsLoading(true);
    try {
      const response = await removeProductFromCart(product, 1);
      if (!response.ok) {
        throw new Error('Failed to decrease quantity');
      }    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Unknown error', ERROR_MESSAGES.DECREASE_QUANTITY);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, product, removeProductFromCart, handleError]);

  /** Aumenta la cantidad del producto en 1 */
  const increaseQuantity = useCallback(async () => {
    if (isLoading || product.quantity >= product.stock) return;
    
    setIsLoading(true);
    try {
      const response = await addProductToCart(product.id, 1, product.unit);
      if (!response.ok) {
        throw new Error('Failed to increase quantity');
      }    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Unknown error', ERROR_MESSAGES.INCREASE_QUANTITY);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, product, addProductToCart, handleError]);

  /** Elimina todas las unidades del producto */
  const deleteAllQuantity = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await removeProductFromCart(product, product.quantity);
      if (!response.ok) {
        throw new Error('Failed to remove product');
      }    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Unknown error', ERROR_MESSAGES.REMOVE_PRODUCT);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, product, removeProductFromCart, handleError]);

  // Cálculos memorizados. `GET /cart` entrega precios netos y el catálogo los
  // muestra con IVA, así que la línea se muestra con IVA para que coincidan.
  const totalPrice = useMemo(() =>
    addVat(product.price * product.quantity, vatRate).toLocaleString(
      CART_CONFIG.LOCALE,
      {
        style: 'currency',
        currency: CART_CONFIG.CURRENCY,
      }
    ), [product.price, product.quantity, vatRate]
  );

  return {
    isLoading,
    backgroundImage,
    totalPrice,
    decreaseQuantity,
    increaseQuantity,
    deleteAllQuantity,
  };
};
