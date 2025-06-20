import { Product } from '@/interfaces/product.interface';
import { useEffect, useState } from 'react';
import useStore from '@/stores/base';
import { ArrowPathIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useFavorites } from '@/hooks/useFavorites';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addProductToCart, isQaMode } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const { isFavorite, toggleFavorite, handleAddToList } = useFavorites();
  const [backgroundImage, setBackgroundImage] = useState(
    `url(${product.image})`
  );
  const [quantity, setQuantity] = useState(0);  const handleSetFavorite = async () => {
    if (isFavorite(product.id, product)) {
      await toggleFavorite(product.id);
    } else {
      handleAddToList(product);
    }
  };

  useEffect(() => {
    const img = new Image();
    img.src = product.image;
    img.onerror = () => {
      setBackgroundImage(`url(/assets/global/logo_plant.png)`);
    };
  }, [product.image]);

  const decreaseQuantity = () => {
    if (quantity > 0) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    const maxAllowed = Math.min(product.stock, 999);
    if (quantity >= maxAllowed) {
      return;
    }
    setQuantity(quantity + 1);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === '') {
      setQuantity(0);
      return;
    }

    const numericValue = parseInt(value, 10);

    if (isNaN(numericValue)) {
      return;
    }

    const maxAllowed = Math.min(product.stock, 999);

    if (numericValue > maxAllowed || numericValue < 0) {
      setQuantity(maxAllowed);
    } else {
      setQuantity(numericValue);
    }
  };

  const addToCart = async () => {
    setIsLoading(true);
    if (quantity > 0) {
      if (isQaMode) {
        setQuantity(0);
        setIsLoading(false);
        return;
      }

      const response = await addProductToCart(
        product.id,
        quantity,
        product.unit
      );

      if (response.ok) {
        setQuantity(0);
      }
    }
    setIsLoading(false);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const isProductFavorite = isFavorite(product.id, product);

  return (
    <div className="flex p-3 items-center gap-2 bg-white border-b border-slate-300 relative">
      <div className="flex items-center gap-[6px]">        <div className="rounded-full bg-slate-100 items-center justify-center hidden sm:flex p-[6px]">
          {!isProductFavorite ? (
            <HeartIcon
              className="cursor-pointer"
              color="#475569"
              width={16}
              height={16}
              onClick={handleSetFavorite}
            />
          ) : (
            <HeartIconSolid
              className="cursor-pointer"
              color="#ef4444"
              width={16}
              height={16}
              onClick={handleSetFavorite}
            />
          )}
        </div>
        <div
          className="w-[37px] h-[70px] py-[15px] px-[37px] bg-contain bg-no-repeat bg-center"
          style={{ backgroundImage }}
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between w-full gap-1">
        <div className="flex flex-col">
          <span className="text-[#64748B] text-[12px] font-medium text-center sm:text-left">
            {product.brand.name}
          </span>
          <span className="text-[12px] font-medium text-center sm:text-left">
            {truncateText(product.name, 30)}
          </span>
          <span className="text-lime-500 font-bold text-center sm:text-left text-lg mt-1">
            {product.price !== null && product.price !== undefined
              ? product.price.toLocaleString('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                })
              : '$0'}
          </span>
        </div>
        <div className="sm:flex sm:h-[74px] sm:flex-col sm:justify-between sm:items-end sm:gap-[6px] sm:flex-1-0-0 gap-4">
          <p className="text-[#64748B] text-[10px] font-medium my-2 text-center sm:text-left">
            <strong>Stock:</strong> {product.stock} <strong>|</strong>{' '}
            <strong>SKU:</strong> {product.sku}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <div className="flex gap-1">
              <button
                disabled={quantity === 0}
                className={`flex w-8 h-8 justify-center items-center rounded-[6px] cursor-pointer ${
                  quantity === 0
                    ? 'bg-slate-200 opacity-50 cursor-not-allowed'
                    : 'bg-slate-100'
                }`}
                onClick={decreaseQuantity}
              >
                -
              </button>

              <input
                type="number"
                min="0"
                max={Math.min(product.stock, 999)}
                value={quantity}
                onChange={handleQuantityChange}
                className="w-8 h-8 text-center border border-slate-300 rounded-[4px] focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 text-sm mx-0 p-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                placeholder="0"
              />

              <button
                disabled={quantity === Math.min(product.stock, 999)}
                className={`flex w-8 h-8 justify-center items-center rounded-[6px] cursor-pointer ${
                  quantity === Math.min(product.stock, 999)
                    ? 'bg-slate-200 opacity-50 cursor-not-allowed'
                    : 'bg-slate-100'
                }`}
                onClick={increaseQuantity}
              >
                +
              </button>
            </div>
            <button
              onClick={addToCart}
              disabled={quantity === 0}
              className="flex w-full p-2 flex-col justify-center items-center rounded-[6px] bg-[#84CC16] text-white hover:bg-[#257f00] h-[32px] text-[12px] cursor-pointer  disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
            >
              {isLoading ? (
                <span className="animate-spin">
                  <ArrowPathIcon width={16} />
                </span>
              ) : (
                'Agregar al carro'
              )}
            </button>
          </div>
        </div>
      </div>      <div className="sm:hidden rounded-full w-[30px] h-[30px] bg-slate-100 absolute right-[14px] top-[12px] flex items-center justify-center">
        {!isProductFavorite ? (
          <HeartIcon
            className="cursor-pointer"
            color="#475569"
            width={16}
            height={16}
            onClick={handleSetFavorite}
          />
        ) : (
          <HeartIconSolid
            className="cursor-pointer"
            color="#ef4444"
            width={16}
            height={16}
            onClick={handleSetFavorite}
          />
        )}
      </div>
    </div>
  );
}
