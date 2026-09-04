"use client";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import LoadingSpinner from "@/app/components/global/LoadingSpinner";
import { useState } from "react";
import { addOrderToCart } from "@/services/actions/cart.actions";
import useStore from "@/stores/base";
import OrderStatusBadge from "./OrderStatusBadge";
import { DEFAULT_IMAGE } from "@/utils/assets";

// Tipos de datos que recibe el componente:

// Representa un producto dentro de una compra
export interface ProductoCompra {
  nombre: string;
  marca: string;
  imagen: string;
  precio: number; // Precio unitario neto
  cantidad: number;
  total: number; // Total de la línea con IVA
}

// Representa una compra completa realizada por el usuario
export interface Compra {
  fecha: string; // Fecha en que se realizó la compra
  numero: string; // ID de la compra
  referencia: string | null; // IDMAEEDO
  hora: string; // Hora en que se registró
  subtotal: number; // Suma neta de los productos
  iva: number; // Tasa de IVA aplicada, como porcentaje (0 en órdenes antiguas)
  montoIva: number; // Monto de IVA de la orden
  envio: number; // Costo de despacho
  total: number; // Monto efectivamente cobrado (productos + IVA + despacho)
  estado: string; // Estado de la compra (pending, processing, completed, etc.)
  productos: ProductoCompra[]; // Lista de productos comprados
  sucursal: Sucursal;
  notas: string | null;
}

export interface Sucursal {
  id: number | null;
  nombre: string | null;
  codigo: string | null;
}

const SORT_OPTIONS = [
  { label: "Más recientes", sort: "created_at", direction: "desc" as const },
  { label: "Más antiguos", sort: "created_at", direction: "asc" as const },
];

export default function ComprasSection({
  compras,
  busqueda,
  setBusqueda,
  setPedidoSeleccionado,
  setSelected,
  router,
  loading,
  sort,
  sortDirection,
  onSortChange,
}: {
  compras: Compra[];
  busqueda: string;
  setBusqueda: (v: string) => void;
  setPedidoSeleccionado: (c: Compra) => void;
  setSelected: (v: string) => void;
  router: any;
  loading: boolean;
  sort: string;
  sortDirection: "asc" | "desc";
  onSortChange: (sort: string, direction: "asc" | "desc") => void;
}) {
  // Filtra las compras que contienen el número buscado
  const comprasFiltradas = compras.filter((c) =>
    c.numero.includes(busqueda.trim())
  );
  const [repeatingOrderId, setRepeatingOrderId] = useState<string | null>(null);
  return (
    <div className="p-4 rounded">
      <h2 className="text-xl font-bold mb-6">Mis compras</h2>

      {/* Filtro por número de pedido */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        {/* Botón para limpiar búsqueda */}
        <div className="w-[80px]">
          {busqueda.trim() ? (
            <button
              onClick={() => setBusqueda("")}
              className="text-sm text-lime-600 hover:underline"
            >
              Ver todos
            </button>
          ) : (
            <div>&nbsp;</div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center ml-auto">
          {/* Selector de ordenamiento */}
          <select
            className="border border-slate-400 px-3 py-2 rounded text-sm text-gray-700 w-full md:w-auto"
            value={`${sort}_${sortDirection}`}
            onChange={(e) => {
              const option = SORT_OPTIONS.find(
                (o) => `${o.sort}_${o.direction}` === e.target.value
              );
              if (option) onSortChange(option.sort, option.direction);
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={`${o.sort}_${o.direction}`} value={`${o.sort}_${o.direction}`}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Input de búsqueda */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar Nº de pedido"
              className="border border-slate-400 px-4 py-2 rounded w-full pr-10"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-2.5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Contenido principal: Loader, lista o mensaje */}
      <div className="space-y-4">
        {loading ? (
          // 🔄 Se muestra mientras se cargan los datos
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner />
          </div>
        ) : comprasFiltradas.length > 0 ? (
          // ✅ Si hay compras, se muestran
          comprasFiltradas.map((c, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded border-slate-200 border"
            >
              {/* Cabecera con fecha y total */}
              <div className="flex justify-between mb-2 border-b border-b-slate-200 pb-1">
                <span className="font-semibold">{c.fecha}</span>
                <span className="font-bold">
                  ${c.total.toLocaleString("es-CL")}
                </span>
              </div>

              {/* Número de pedido, estado y hora */}
              <div className="flex justify-between items-center gap-2">
                <p className="text-slate-400 font-medium">Pedido Nº {c.numero}</p>
                <OrderStatusBadge status={c.estado} />
              </div>
              <p className="text-sm text-gray-500 mb-2">
                Creado a las {c.hora} hrs.
              </p>

              {/* Galería horizontal de productos */}
              <div className="flex gap-2 overflow-x-auto mb-4">
                {c.productos.map((producto, i) => (
                  <img
                    key={i}
                    src={producto.imagen}
                    alt={producto.nombre}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_IMAGE;
                    }}
                    className="w-12 h-16 object-contain rounded"
                  />
                ))}
              </div>

              {/* Acciones: Ver detalle o repetir pedido */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPedidoSeleccionado(c); // Guarda el pedido para detalle
                    setSelected("detalle-compra"); // Cambia la vista
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-white px-4 py-2 rounded text-sm"
                >
                  Revisar Detalle
                </button>

                <button
                  onClick={async () => {
                    setRepeatingOrderId(c.numero);

                    const result = await addOrderToCart(Number(c.numero));

                    if (result.ok) {
                      const store = useStore.getState();
                      await store.fetchCartProducts();
                      router.push("/carro-de-compra");
                    } else {
                      alert("Error al repetir pedido: " + result.error);
                    }

                    setRepeatingOrderId(null);
                  }}
                  disabled={repeatingOrderId === c.numero}
                  className={`${
                    repeatingOrderId === c.numero
                      ? "bg-lime-300"
                      : "bg-lime-500 hover:bg-lime-600"
                  } text-white px-4 py-2 rounded text-sm flex items-center justify-center`}
                >
                  {repeatingOrderId === c.numero ? (
                    <span className="text-xs">Procesando...</span>
                  ) : (
                    "Repetir Pedido"
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          // ❌ No hay resultados para mostrar
          <p className="text-center text-gray-500">
            No se encontraron pedidos.
          </p>
        )}
      </div>
    </div>
  );
}
