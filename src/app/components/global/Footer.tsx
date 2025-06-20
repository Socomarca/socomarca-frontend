import Link from 'next/link';
import FacebookIcon from '../icons/FacebookIcon';
import TwitterIcon from '../icons/TwitterIcon';
import InstagramIcon from '../icons/InstagramIcon';
import YoutubeIcon from '../icons/YoutubeIcon';
import PinterestIcon from '../icons/PinterestIcon';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Logo from './Logo';

const masterCardImageUrl = '/assets/footer/mastercard.png';
const americanExpressImageUrl = '/assets/footer/american-express.png';
const paypalImageUrl = '/assets/footer/paypal.png';
const visaImageUrl = '/assets/footer/visa.png';

// Icon RRSS

export default function Footer() {
  return (
    <footer className="bg-white text-sm text-gray-600">
      {/* Línea verde superior */}
      <div className="h-1 bg-lime-500" />

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo y descripción */}
        <div className="flex flex-col items-start justify-center gap-[10px] text-start">
          <h1 className="text-lime-600 text-xl font-bold w-full flex justify-center md:justify-start">
            <Logo />
          </h1>
          <p className="text-gray-500">
            En Socomarca ofrecemos precios mayoristas, productos seleccionados y
            despacho confiable. Para que tu energía esté donde importa: en tus
            clientes.
          </p>
        </div>
        {/* Categoría */}
        <div className="space-y-1 hidden md:block">
          <h3 className="text-gray-500 font-bold">Categoría</h3>
          <ul className="space-y-1">
            <li>Despensa</li>
            <li>Hogar y limpieza</li>
            <li>Lácteos y fiambre</li>
            <li>Cuidado personal</li>
            <li>Bebestibles</li>
            <li>Confites</li>
          </ul>
        </div>
        {/* Atención al cliente */}
        <div className="space-y-1">
          <h3 className="text-gray-500 font-bold">Atención al cliente</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/preguntas-frecuentes" className="">
                Preguntas frecuentes
              </Link>
            </li>
            <li>
              <Link href="/terminos-y-condiciones" className="">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link href="/politica-de-privacidad" className="">
                Política de privacidad
              </Link>
            </li>
          </ul>
        </div>
        {/* Contacto */}
        <div className="flex flex-col items-start gap-[10px]">
          <h3 className="text-gray-500 font-bold">Contacto</h3>
          <div className="flex gap-1">
            <span className="text-lime-600">
              <PhoneIcon width={25} height={24} />
            </span>
            <div>
              <p className="flex flex-col gap-1">
                <span className="text-lime-600 text-[16px]">
                  <strong>Teléfono:</strong>
                </span>
                <span className="text-slate-400">+56 9 9999 9999</span>
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <span className="text-lime-600">
              <EnvelopeIcon width={25} height={24} />
            </span>
            <div>
              <p className="flex flex-col gap-1">
                <span className="text-lime-600 text-[16px]">
                  <strong>Email:</strong>
                </span>
                <span className="text-slate-400">contacto@socomarca.cl</span>
              </p>
            </div>
          </div>
        </div>{' '}
        {/* Redes sociales */}
        <div className="flex items-center justify-center md:justify-start gap-1">
          <div className="w-[38px] h-[38px] flex justify-center items-center">
            <FacebookIcon width={16} height={16} />
          </div>
          <div className="w-[38px] h-[38px] flex justify-center items-center">
            <TwitterIcon width={16} height={13} />
          </div>
          <div className="w-[38px] h-[38px] flex justify-center items-center">
            <InstagramIcon width={13} height={13} />
          </div>
          <div className="w-[38px] h-[38px] flex justify-center items-center">
            <PinterestIcon width={16} height={16} />
          </div>
          <div className="w-[38px] h-[38px] flex justify-center items-center">
            <YoutubeIcon width={16} height={12} />
          </div>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="bg-slate-100 py-4 px-6 flex flex-col md:flex-row items-center justify-between text-xs pb-22 md:pb-4 text-center md:text-left">
        <p>
          © 2025 – Todos los derechos reservados.{' '}
          <span className="text-black font-semibold">socomarca.cl</span>
        </p>
        <div className="flex-col md:flex-row items-center gap-2 mt-2 md:mt-0 opacity-50 hidden md:flex">
          <img
            src={masterCardImageUrl}
            alt="MasterCard"
            style={{ width: '37.8px', height: '23px' }}
          />
          <img
            src={paypalImageUrl}
            alt="PayPal"
            style={{ width: '65.64px', height: '16px' }}
          />
          <img
            src={visaImageUrl}
            alt="Visa"
            style={{ width: '38.47px', height: '12px' }}
          />
          <img
            src={americanExpressImageUrl}
            alt="American Express"
            style={{ width: '39.59px', height: '12px' }}
          />
        </div>
      </div>
    </footer>
  );
}
