'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CartProductCard from './CartProductCard';
import useStore from '@/stores/base';
import { addVat } from '@/utils/vat';

export default function CartProductsContainer() {
  const [totalPrice, setTotalPrice] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const { cartProducts, vatRate, fetchVatRate } = useStore();

  // La tasa se necesita para mostrar el estimado con IVA aunque el mini carro
  // se abra antes de que cargue el catálogo.
  useEffect(() => {
    fetchVatRate();
  }, [fetchVatRate]);

  //aqui va el useEffect para obtener los productos del carro

  useEffect(() => {
    const total = cartProducts.reduce((acc, product) => {
      return acc + Number(product.subtotal);
    }, 0);

    const itemCount = cartProducts.reduce((acc, product) => {
      return acc + product.quantity;
    }, 0);

    setTotalPrice(
      addVat(total, vatRate).toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP',
      })
    );
    setTotalItems(itemCount);
  }, [cartProducts, vatRate]);

  return (
    <>
      <div className="bg-white w-full max-h-[800px] overflow-y-auto flex-col items-start p-3">
        {cartProducts.length > 0 ? (
          cartProducts.map((product, index) => (
            <CartProductCard
              key={product.id + '-' + index}
              product={product}
              index={index}
            />
          ))
        ) : (
          <div className="flex justify-center items-center h-full">
            <span className="text-[#64748B] text-[12px] font-medium">
              No hay productos en el carro
            </span>
          </div>
        )}
      </div>

      {cartProducts.length > 0 && (
        <div className="w-full bg-amber-50 h-[136px] flex flex-col justify-center items-start">
          <div className="flex w-full p-4 flex-col justify-center items-start gap-1">
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-semibold w-full">
                Total estimado - {totalItems} artículos
              </span>
              <span className="text-sm font-bold">{totalPrice}</span>
            </div>
            <span className="text-xs text-slate-500">
              IVA incluido. Envíos calculados al finalizar la compra
            </span>
          </div>
          <div className="w-full p-3">
            <Link href="/carro-de-compra">
              <button className="text-white bg-lime-500 w-full py-3 px-12 rounded-[6px] cursor-pointer">
                Finalizar compra
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
