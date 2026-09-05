import { StateCreator } from 'zustand';
import { CartSlice, StoreState, ApiResponse } from '../types';
import {
  fetchDeleteCart,
  fetchDeleteCartItem,
  fetchGetCart,
  fetchPostAddToCart,
} from '@/services/actions/cart.actions';
import { CartItem, Product } from '@/interfaces/product.interface';
import {
  createErrorHandler,
  createSuccessResponse,
  createErrorResponse,
} from '../utils/storeUtils';
import { removeVat } from '@/utils/vat';

const errorHandler = createErrorHandler('Cart');

export const createCartSlice: StateCreator<
  StoreState & CartSlice,
  [],
  [],
  CartSlice
> = (set, get) => ({
  // Estado inicial
  cartProducts: [],

  // Acciones
  addProductToCart: async (
    product_id: number,
    quantity: number,
    unit: string
  ): Promise<ApiResponse> => {
    try {
      set({ isCartLoading: true });

      const response = await fetchPostAddToCart({
        product_id,
        quantity,
        unit,
      });
      if (response.ok && response.data) {
        await get().fetchCartProducts();
        return createSuccessResponse(response.data);
      } else {
        return createErrorResponse('Error al agregar producto al carrito');
      }
    } catch (error) {
      return errorHandler(error);
    } finally {
      set({ isCartLoading: false });
    }
  },
  addProductToCartOptimistic: async (
    product_id: number,
    quantity: number,
    unit: string,
    product: Product
  ): Promise<ApiResponse> => {
    const { cartProducts } = get();
    const previousCartProducts = [...cartProducts];

    try {
      // Update optimista: agregar el producto inmediatamente al carrito
      const existingItemIndex = cartProducts.findIndex(
        (item) => item.id === product_id && item.unit === unit
      );

      let updatedCart;
      if (existingItemIndex !== -1) {
        // Si el producto ya existe, incrementar la cantidad
        updatedCart = cartProducts.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Si es un producto nuevo, agregarlo al carrito. El catálogo entrega
        // precios con IVA y `GET /cart` los devuelve netos: se guarda el neto
        // para que el ítem optimista no quede con IVA duplicado cuando la
        // vista le vuelva a sumar la tasa.
        const netPrice = removeVat(product.price, product.vat);
        const newCartItem = {
          ...product,
          price: netPrice,
          vat: 0,
          quantity,
          subtotal: netPrice * quantity,
          unit,
        };
        updatedCart = [...cartProducts, newCartItem];
      }

      // Actualizar estado optimísticamente
      set({
        cartProducts: updatedCart,
        isCartLoading: true,
      });

      // Realizar petición al servidor
      const response = await fetchPostAddToCart({
        product_id,
        quantity,
        unit,
      });

      if (response.ok && response.data) {
        // Si la petición es exitosa, sincronizar con el servidor
        await get().fetchCartProducts();
        return createSuccessResponse(response.data);
      } else {
        // Si falla, revertir al estado anterior
        set({ cartProducts: previousCartProducts });
        return createErrorResponse('Error al agregar producto al carrito');
      }
    } catch (error) {
      // En caso de error, revertir al estado anterior
      set({ cartProducts: previousCartProducts });
      return errorHandler(error);
    } finally {
      set({ isCartLoading: false });
    }
  },

  fetchCartProducts: async () => {
    set({
      isCartLoading: true,
    });
    try {
      const response = await fetchGetCart();

      if (response.ok && response.data) {
        set({
          cartProducts: response.data.items,
        });
      } else {
        set({
          cartProducts: [],
        });
      }
    } catch (error) {
      console.error('Error in getCartProducts:', error);
      set({
        cartProducts: [],
      });
    } finally {
      set({
        isCartLoading: false,
      });
    }
  },

  incrementProductInCart: (productId: number, unit: string) => {
    const { cartProducts } = get();
    const updatedCart = cartProducts.map((item) =>
      item.id === productId && item.unit === unit
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    set({ cartProducts: updatedCart });
  },

  decrementProductInCart: (productId: number, unit: string) => {
    const { cartProducts } = get();
    const updatedCart = cartProducts.map((item) =>
      item.id === productId && item.unit === unit && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    set({ cartProducts: updatedCart });
  },
  removeProductFromCart: async (
    product: CartItem,
    quantity: number
  ): Promise<ApiResponse> => {
    try {
      set({ isCartLoading: true });

      const response = await fetchDeleteCartItem(
        product.id,
        quantity,
        product.unit
      );

      if (response.ok && response.data) {
        await get().fetchCartProducts();
        return createSuccessResponse(response.data);
      } else {
        return createErrorResponse('Error al eliminar producto del carrito');
      }
    } catch (error) {
      return errorHandler(error);
    } finally {
      set({ isCartLoading: false });
    }
  },
  removeProductFromCartOptimistic: async (
    product: CartItem,
    quantity: number
  ): Promise<ApiResponse> => {
    const { cartProducts } = get();
    const previousCartProducts = [...cartProducts];

    try {
      // Update optimista: actualizar el carrito inmediatamente
      let updatedCart;
      const existingItemIndex = cartProducts.findIndex(
        (item) => item.id === product.id && item.unit === product.unit
      );

      if (existingItemIndex !== -1) {
        const currentItem = cartProducts[existingItemIndex];
        const newQuantity = currentItem.quantity - quantity;

        if (newQuantity <= 0) {
          // Eliminar el producto completamente
          updatedCart = cartProducts.filter(
            (item) => item.id !== product.id || item.unit !== product.unit
          );
        } else {
          // Reducir la cantidad
          updatedCart = cartProducts.map((item, index) =>
            index === existingItemIndex
              ? {
                  ...item,
                  quantity: newQuantity,
                  subtotal: item.price * newQuantity,
                }
              : item
          );
        }
      } else {
        // Si no encuentra el producto, no hacer nada
        updatedCart = cartProducts;
      }

      // Actualizar estado optimísticamente
      set({
        cartProducts: updatedCart,
        isCartLoading: true,
      });

      // Realizar petición al servidor
      const response = await fetchDeleteCartItem(
        product.id,
        quantity,
        product.unit
      );

      if (response.ok && response.data) {
        // Si la petición es exitosa, sincronizar con el servidor
        await get().fetchCartProducts();
        return createSuccessResponse(response.data);
      } else {
        // Si falla, revertir al estado anterior
        set({ cartProducts: previousCartProducts });
        return createErrorResponse('Error al eliminar producto del carrito');
      }
    } catch (error) {
      // En caso de error, revertir al estado anterior
      set({ cartProducts: previousCartProducts });
      return errorHandler(error);
    } finally {
      set({ isCartLoading: false });
    }
  },

  removeAllQuantityByProductId: (productId: number, unit: string) => {
    const { cartProducts } = get();
    const updatedCart = cartProducts.filter(
      (item) => item.id !== productId || item.unit !== unit
    );
    set({ cartProducts: updatedCart });
  },
  clearCart: async () => {
    try {
      set({ isCartLoading: true });
      const response = await fetchDeleteCart();

      if (response.ok) {
        set({
          cartProducts: [],
        });
      } else {
        console.error('Error clearing cart:', response.error);
      }
    } catch (error) {
      console.error('Error in clearCart:', error);
    } finally {
      set({ isCartLoading: false });
    }
  },
});
