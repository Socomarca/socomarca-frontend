'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import FacebookIcon from '../icons/FacebookIcon';
import TwitterIcon from '../icons/TwitterIcon';
import InstagramIcon from '../icons/InstagramIcon';
import YoutubeIcon from '../icons/YoutubeIcon';
import PinterestIcon from '../icons/PinterestIcon';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Logo from './Logo';
import useStore from '@/stores/base';
import useAuthStore from '@/stores/useAuthStore';

// Icon RRSS

export default function Footer() {
  const { siteInformation, fetchSiteInformation } = useStore();

  const { user } = useAuthStore();

  // Cargar información del sitio al montar el componente
  useEffect(() => {
    fetchSiteInformation();
  }, [fetchSiteInformation]);

  // Función para verificar si el usuario es admin o superadmin
  const isAdminUser = () => {
    const userRoles = user?.roles || [];
    return userRoles.includes('admin') || userRoles.includes('superadmin');
  };

  // Función para renderizar el icono de red social según el label
  const renderSocialIcon = (label: string) => {
    if (!label || typeof label !== 'string') {
      return <FacebookIcon width={16} height={16} />; // Icono por defecto
    }

    const normalizedLabel = label.toLowerCase();

    switch (normalizedLabel) {
      case 'facebook':
        return <FacebookIcon width={16} height={16} />;
      case 'twitter':
        return <TwitterIcon width={16} height={13} />;
      case 'instagram':
        return <InstagramIcon width={13} height={13} />;
      case 'youtube':
        return <YoutubeIcon width={16} height={12} />;
      case 'pinterest':
        return <PinterestIcon width={16} height={16} />;
      default:
        return null;
    }
  };
  return (
    <footer className="bg-white text-sm text-gray-600">
      {/* Línea verde superior */}
      <div className="h-1 bg-lime-500" />

      <div className="w-full max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-12 justify-between">
        {/* Logo y descripción */}
        <div className="gap-[10px] text-start">
          <h1 className="text-lime-600 text-xl font-bold w-full flex justify-center md:justify-start">
            <Logo />
          </h1>
          <p className="text-gray-500 mb-4">
            En Socomarca ofrecemos precios mayoristas, productos seleccionados y
            despacho confiable. Para que tu energía esté donde importa: en tus
            clientes.
          </p>
          
          {/* Redes sociales */}
          {siteInformation?.social_media &&
            Array.isArray(siteInformation.social_media) &&
            siteInformation.social_media.length > 0 && (
              <div className="flex items-center justify-center md:justify-start gap-1">
                {siteInformation.social_media
                  .filter(
                    (social: any) =>
                      social &&
                      social.label &&
                      social.link &&
                      typeof social.label === 'string'
                  )
                  .map((social: any, index: number) => (
                    <a
                      key={index}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-[38px] h-[38px] flex justify-center items-center hover:bg-slate-100 rounded transition-colors"
                      title={
                        social.label && typeof social.label === 'string'
                          ? social.label.charAt(0).toUpperCase() +
                            social.label.slice(1)
                          : 'Red social'
                      }
                    >
                      {renderSocialIcon(social.label)}
                    </a>
                  ))}
              </div>
            )}
        </div>
        {/* Atención al cliente */}
        <div className="space-y-1">
          <h3 className="text-gray-500 font-bold">Atención al cliente</h3>
          <ul className="space-y-1">
            <li>
              {isAdminUser() ? (
                <span className="text-gray-400 cursor-not-allowed">
                  Preguntas frecuentes
                </span>
              ) : (
                <Link href="/preguntas-frecuentes" className="">
                  Preguntas frecuentes
                </Link>
              )}
            </li>
            <li>
              {isAdminUser() ? (
                <span className="text-gray-400 cursor-not-allowed">
                  Términos y condiciones
                </span>
              ) : (
                <Link href="/terminos-y-condiciones" className="">
                  Términos y condiciones
                </Link>
              )}
            </li>
            <li>
              {isAdminUser() ? (
                <span className="text-gray-400 cursor-not-allowed">
                  Política de privacidad
                </span>
              ) : (
                <Link href="/politica-de-privacidad" className="">
                  Política de privacidad
                </Link>
              )}
            </li>
          </ul>
        </div>
        {/* Contacto */}
        <div className="flex flex-col items-start gap-4">
          <h3 className="text-gray-500 font-bold mb-2">Contacto</h3>
          
          {siteInformation?.footer?.contact_phone &&
            siteInformation.footer.contact_phone.trim() !== '' && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <PhoneIcon className="w-5 h-5 text-lime-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lime-600 font-semibold text-sm">
                    Teléfono:
                  </span>
                  <a
                    href={`tel:${siteInformation.footer.contact_phone.replace(/\s+/g, '')}`}
                    className="text-gray-600 text-sm hover:text-lime-600 transition-colors"
                  >
                    {siteInformation.footer.contact_phone}
                  </a>
                </div>
              </div>
            )}
            
          {siteInformation?.footer?.contact_email &&
            siteInformation.footer.contact_email.trim() !== '' && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <EnvelopeIcon className="w-5 h-5 text-lime-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lime-600 font-semibold text-sm">
                    Email:
                  </span>
                  <a 
                    href={`mailto:${siteInformation.footer.contact_email}`}
                    className="text-gray-600 text-sm hover:text-lime-600 transition-colors"
                  >
                    {siteInformation.footer.contact_email}
                  </a>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Línea inferior */}
      <div className="bg-slate-100 py-4 px-6 flex flex-col md:flex-row items-center justify-between text-xs pb-22 md:pb-4 text-center md:text-left">
        <p>
          © 2025 – Todos los derechos reservados.{' '}
          <span className="text-black font-semibold">socomarca.cl</span>
        </p>
      </div>
    </footer>
  );
}
