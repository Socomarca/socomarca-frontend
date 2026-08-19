import { StateCreator } from 'zustand';
import { FavoritesSlice, FiltersSlice, StoreState } from '../types';
import {
  fetchGetFavoriteLists,
  fetchCreateFavoriteList,
  fetchAddProductToFavoriteList,
  fetchRemoveProductFromFavorites,
  deleteFavoriteList,
  changeFavoriteListName,
} from '@/services/actions/favorite.actions';

export const createFavoritesSlice: StateCreator<
  StoreState & FavoritesSlice & FiltersSlice,
  [],
  [],
  FavoritesSlice
> = (set, get) => ({
  // Estados de favoritos
  favoriteLists: [],
  selectedFavoriteList: null,
  isLoadingFavorites: false,
  showOnlyFavorites: false,
  favoritesInitialized: false,

  // Acciones
  fetchFavorites: async () => {
    // Obtener el estado actual del store para verificar el rol del usuario
    const currentState = get();
    const userRole = currentState.user?.roles?.[0];
    
    // Solo permitir fetch de favoritos si el usuario es customer
    if (userRole !== 'customer') {
      console.log('Skipping favorites fetch: user is not a customer');
      set({
        favoriteLists: [],
        isLoadingFavorites: false,
        favoritesInitialized: true,
      });
      return;
    }
    
    try {
      set({ isLoadingFavorites: true });
      const response = await fetchGetFavoriteLists();

      if (response.ok && response.data) {
        // Asegurar que response.data sea un array
        const lists = Array.isArray(response.data) ? response.data : [];
        set({
          favoriteLists: lists,
          isLoadingFavorites: false,
          favoritesInitialized: true,
        });
      } else {
        console.error('Error fetching favorite lists:', response.error);
        set({
          isLoadingFavorites: false,
          favoritesInitialized: true,
        });
      }
    } catch (error) {
      console.error('Error in fetchFavorites:', error);
      set({
        isLoadingFavorites: false,
        favoritesInitialized: true,
      });
    }
  },
  createFavoriteList: async (name: string) => {
    // Verificar que el usuario sea customer
    const currentState = get();
    console.log(currentState.user);
    const userRole = currentState.user?.roles?.[0];
    
    if (userRole !== 'customer') {
      return {
        ok: false,
        error: {
          message: 'Solo los clientes pueden crear listas de favoritos',
          status: 403,
        },
      };
    }
    
    const { favoriteLists } = get();

    const tempId = Date.now() * -1;
    const tempList = {
      id: tempId,
      name: name?.trim() || '',
      user_id: 0,
      favorites: [],
      isOptimistic: false,
    };

    try {
      set({
        favoriteLists: [...favoriteLists, tempList],
        isLoadingFavorites: false,
      });

      // Hacer la llamada al backend
      const response = await fetchCreateFavoriteList(name);

      if (response.ok && response.data) {
        // // Eliminar la lista temporal y agregar solo la lista real
        // const filteredLists = get().favoriteLists.filter(
        //   (list) => list.id !== tempId
        // );

        // // Verificar si la lista real ya existe para evitar duplicados
        // const alreadyExists = filteredLists.some(
        //   (list) => list.id === response.data.id
        // );

        // // Asegurar que la lista real tenga el nombre correcto
        // const realList = {
        //   ...response.data,
        //   name: response.data.name || name, // Usar el nombre del backend o fallback al original
        //   isOptimistic: false,
        // };

        // const finalLists = alreadyExists
        //   ? filteredLists
        //   : [...filteredLists, realList];

        // set({
        //   favoriteLists: finalLists,
        //   isLoadingFavorites: false,
        // });

        await get().fetchFavorites(); // Recargar las listas después de crear

        return { ok: true, data: response.data };
      } else {
        set({
          favoriteLists: get().favoriteLists.filter(
            (list) => list.id !== tempId
          ),
          isLoadingFavorites: false,
        });

        console.error('Error creating favorite list:', response.error);
        return {
          ok: false,
          error: {
            message: response.error || 'Error desconocido',
            status: 500,
          },
        };
      }
    } catch (error) {
      set({
        favoriteLists: get().favoriteLists.filter((list) => list.id !== tempId),
        isLoadingFavorites: false,
      });

      console.error('Error in createFavoriteList:', error);
      return {
        ok: false,
        error: {
          message: 'Error desconocido',
          status: 500,
        },
      };
    }
  },
  addProductToFavoriteList: async (
    favoriteListId: number,
    productId: number,
    unit: string
  ) => {
    // Verificar que el usuario sea customer
    const currentState = get();
    const userRole = currentState.user?.roles?.[0];
    
    if (userRole !== 'customer') {
      return {
        ok: false,
        error: {
          message: 'Solo los clientes pueden agregar productos a favoritos',
          status: 403,
        },
      };
    }
    
    try {
      set({ isLoadingFavorites: true });

      const response = await fetchAddProductToFavoriteList(
        favoriteListId,
        productId,
        unit
      );

      if (response.ok) {
        // Recargar las listas después de agregar el producto
        const { fetchFavorites } = get();
        await fetchFavorites();
        set({ isLoadingFavorites: false });
        return { ok: true };
      } else {
        console.error('Error adding product to favorite list:', response.error);
        set({ isLoadingFavorites: false });
        return {
          ok: false,
          error: {
            message: response.error || 'Error desconocido',
            status: 500,
          },
        };
      }
    } catch (error) {
      console.error('Error in addProductToFavoriteList:', error);
      set({ isLoadingFavorites: false });
      return {
        ok: false,
        error: {
          message: 'Error desconocido',
          status: 500,
        },
      };
    }
  },
  removeProductFromFavorites: async (favoriteId: number) => {
    // Verificar que el usuario sea customer
    const currentState = get();
    const userRole = currentState.user?.roles?.[0];
    
    if (userRole !== 'customer') {
      return {
        ok: false,
        error: {
          message: 'Solo los clientes pueden eliminar productos de favoritos',
          status: 403,
        },
      };
    }
    
    const { favoriteLists, selectedFavoriteList } = get();

    // Encontrar el productId basado en el favoriteId para el optimistic update
    let productId = null;
    for (const list of favoriteLists) {
      const favorite = list.favorites?.find((fav) => fav.id === favoriteId);
      if (favorite) {
        productId = favorite.product.id;
        break;
      }
    }

    if (!productId) {
      return {
        ok: false,
        error: {
          message: 'Favorito no encontrado',
          status: 404,
        },
      };
    }

    // Guardar estado anterior para posible rollback
    const previousFavoriteLists = [...favoriteLists];
    const previousSelectedList = selectedFavoriteList
      ? { ...selectedFavoriteList }
      : null;

    try {
      // Optimistic update: remover el producto inmediatamente del estado local
      const updatedLists = favoriteLists.map((list) => ({
        ...list,
        favorites: list.favorites
          ? list.favorites.filter((favorite) => favorite.id !== favoriteId)
          : [],
      }));

      // Actualizar la lista seleccionada si existe
      let updatedSelectedList = selectedFavoriteList;
      if (selectedFavoriteList) {
        updatedSelectedList = {
          ...selectedFavoriteList,
          favorites: selectedFavoriteList.favorites
            ? selectedFavoriteList.favorites.filter(
                (favorite) => favorite.id !== favoriteId
              )
            : [],
        };
      }

      set({
        favoriteLists: updatedLists,
        selectedFavoriteList: updatedSelectedList,
      });

      const response = await fetchRemoveProductFromFavorites(favoriteId);

      if (response.ok) {
        return { ok: true };
      } else {
        set({
          favoriteLists: previousFavoriteLists,
          selectedFavoriteList: previousSelectedList,
        });
        return {
          ok: false,
          error: {
            message: response.error || 'Error desconocido',
            status: 500,
          },
        };
      }
    } catch (error) {
      // Rollback en caso de error
      set({
        favoriteLists: previousFavoriteLists,
        selectedFavoriteList: previousSelectedList,
      });

      console.error('Error in removeProductFromFavorites:', error);
      return {
        ok: false,
        error: {
          message: 'Error desconocido',
          status: 500,
        },
      };
    }
  },

  removeFavoriteList: async (listId: number) => {
    // Verificar que el usuario sea customer
    const currentState = get();
    const userRole = currentState.user?.roles?.[0];
    
    if (userRole !== 'customer') {
      return {
        ok: false,
        error: {
          message: 'Solo los clientes pueden eliminar listas de favoritos',
          status: 403,
        },
      };
    }
    
    try {
      set({ isLoadingFavorites: true });
      const response = await deleteFavoriteList(listId);
      if (response.ok) {
        const { fetchFavorites } = get();
        await fetchFavorites();
        return { ok: true };
      } else {
        console.error('Error removing favorite list:', response.error);
        return {
          ok: false,
          error: {
            message: response.error || 'Error desconocido',
            status: 500,
          },
        };
      }
    } catch (error) {
      console.error('Error removing favorite list:', error);
      return {
        ok: false,
        error: {
          message: 'Error desconocido',
          status: 500,
        },
      };
    } finally {
      set({ isLoadingFavorites: false });
    }
  },

  changeListName: async (listId: number, newName: string) => {
    // Verificar que el usuario sea customer
    const currentState = get();
    const userRole = currentState.user?.roles?.[0];
    
    if (userRole !== 'customer') {
      return {
        ok: false,
        error: {
          message: 'Solo los clientes pueden cambiar nombres de listas de favoritos',
          status: 403,
        },
      };
    }
    
    try {
      set({ isLoadingFavorites: true });
      const response = await changeFavoriteListName(listId, newName);
      if (response.ok) {
        const { fetchFavorites, selectedFavoriteList } = get();
        await fetchFavorites();

        // Si la lista actualmente seleccionada es la que se editó, actualizarla también
        if (selectedFavoriteList && selectedFavoriteList.id === listId) {
          const updatedLists = get().favoriteLists;
          const updatedSelectedList = updatedLists.find(
            (list) => list.id === listId
          );
          if (updatedSelectedList) {
            set({ selectedFavoriteList: updatedSelectedList });
          }
        }

        return { ok: true };
      } else {
        console.error('Error changing favorite list name:', response.error);
        return {
          ok: false,
          error: {
            message: response.error || 'Error desconocido',
            status: 500,
          },
        };
      }
    } catch (error) {
      console.error('Error changing favorite list name:', error);
      return {
        ok: false,
        error: {
          message: 'Error desconocido',
          status: 500,
        },
      };
    } finally {
      set({ isLoadingFavorites: false });
    }
  },

  setShowOnlyFavorites: (show: boolean) => {
    set({ showOnlyFavorites: show });
    get().scheduleApplyFilters();
  },

  toggleShowOnlyFavorites: () => {
    const { showOnlyFavorites } = get();
    set({ showOnlyFavorites: !showOnlyFavorites });
    get().scheduleApplyFilters();
  },
  getFavoriteProductIds: () => {
    // Esta función se mantiene por compatibilidad pero no se usa en el filtro
    return [];
  },

  resetFavoritesState: () => {
    set({
      favoriteLists: [],
      isLoadingFavorites: false,
      showOnlyFavorites: false,
      favoritesInitialized: false,
    });
  },

  setSelectedFavoriteList: (list: any | null) => {
    set({ selectedFavoriteList: list });
  },

  // Nueva función unificada para manejar favoritos
  toggleProductFavorite: async (productId: number, product?: any) => {
    // Verificar que el usuario sea customer
    const currentState = get();
    const userRole = currentState.user?.roles?.[0];
    
    if (userRole !== 'customer') {
      return {
        ok: false,
        error: { message: 'Solo los clientes pueden usar favoritos', status: 403 },
        requiresListSelection: false,
      };
    }
    
    const { favoriteLists } = get();

    // Verificar si el producto ya está en favoritos y obtener el favoriteId
    let favoriteId = null;
    const isCurrentlyFavorite = favoriteLists.some((list) =>
      list.favorites?.some((favorite) => {
        if (favorite.product.id === productId) {
          favoriteId = favorite.id;
          return true;
        }
        return false;
      })
    );

    if (isCurrentlyFavorite && favoriteId) {
      const result = await get().removeProductFromFavorites(favoriteId);
      return {
        ...result,
        requiresListSelection: false,
      };
    } else {
      return {
        ok: false,
        error: { message: 'Requiere selección de lista', status: 200 },
        requiresListSelection: true,
        product: product,
      };
    }
  },
});
