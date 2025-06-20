'use client';

import Image from 'next/image';
import { useFavorites } from '@/hooks/useFavorites';

export interface ProductoFavorito {
  nombre: string;
  imagen: string;
  precio: number;
}

export interface ListaFavorita {
  nombre: string;
  productos: ProductoFavorito[];
}

export default function FavoritosSection({
  setNombreNuevaLista,
  setErrorNombreLista,
  setModalCrearListaVisible,
  onViewListDetail,
}: {
  setNombreNuevaLista: (v: string) => void;
  setErrorNombreLista: (v: string) => void;
  setModalCrearListaVisible: (v: boolean) => void;
  onViewListDetail: (lista: any) => void;
}) {
  const { lists, isLoadingFavorites } = useFavorites();

  // Mostrar loading si está cargando
  if (isLoadingFavorites) {
    return (
      <div className=" p-4 rounded">
        <h2 className="text-xl font-bold mb-6">Mis favoritos</h2>
        <div className="text-center py-8">
          <p>Cargando listas...</p>
        </div>
      </div>
    );
  }
  return (
    <div className=" p-4 rounded">
      <h2 className="text-xl font-bold mb-6">Mis favoritos</h2>{' '}
      <div className="space-y-4 mb-6">
        {lists.length === 0 ? (
          <div className="bg-white rounded p-6 shadow-sm border border-[#e4eaf1] text-center">
            <p className="text-gray-500">No tienes listas de favoritos aún</p>
            <p className="text-sm text-gray-400 mt-1">
              Crea tu primera lista para comenzar
            </p>
          </div>
        ) : (
          lists.map((lista, i) => (
            <div
              key={lista.id || i}
              className="bg-white rounded p-4 shadow-sm border border-[#e4eaf1] sm:flex sm:justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{lista.name}</h3>
                    <p className="text-sm text-gray-500">
                      {lista.favorites?.length || 0} Productos
                    </p>
                  </div>
                </div>{' '}
                <div className="flex gap-2 overflow-x-auto mt-2">
                  {(lista.favorites || []).slice(0, 5).map((favorite, j) => (
                    <Image
                      key={favorite.id || j}
                      src="/assets/global/logo_plant.png"
                      alt={favorite.product?.name || 'Producto'}
                      width={48}
                      height={64}
                      className="object-contain rounded"
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  onViewListDetail(lista);
                }}
                className="text-sm text-slate-500 flex items-center gap-1 hover:underline cursor-pointer justify-center"
              >
                Revisar lista <span className="text-lg">›</span>
              </button>
            </div>
          ))
        )}
      </div>
      <button
        onClick={() => {
          setNombreNuevaLista('');
          setErrorNombreLista('');
          setModalCrearListaVisible(true);
        }}
        className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-2 rounded text-sm"
      >
        Crear nueva lista
      </button>
    </div>
  );
}
