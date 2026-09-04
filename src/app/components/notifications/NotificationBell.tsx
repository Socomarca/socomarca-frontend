'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wasOpenRef = useRef(false);
  const { 
    dropdownNotifications, 
    unreadCount, 
    markHistoricalNotificationsAsViewed,
    token, 
    tokenSentToServer, 
    tokenError,
    requestPermission 
  } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const hasNotifications = dropdownNotifications.length > 0;
  // El badge depende de las no leídas; la lista se muestra igual aunque estén todas vistas.
  const hasUnread = unreadCount > 0;



  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle del dropdown sin limpiar automáticamente
  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    // Marcar como vistas solo al cerrar el dropdown (transición abierto -> cerrado)
    if (wasOpenRef.current && !isOpen) {
      void markHistoricalNotificationsAsViewed();
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, markHistoricalNotificationsAsViewed]);

  const formatTime = (dateString?: string) => {
    if (!dateString) {
      return new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón de campana */}
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        // focus-visible en vez de focus: el anillo aparece al navegar con teclado,
        // no al hacer click con el mouse, que era lo que dibujaba el recuadro.
        className="relative text-gray-600 hover:text-gray-800 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
        aria-label={`Notificaciones${hasUnread ? ` (${unreadCount} nuevas)` : ''}`}
      >
        {/* Icono de campana */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge de contador */}
        {hasUnread && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Notificaciones
                {hasNotifications && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({dropdownNotifications.length})
                  </span>
                )}
              </h3>
              {hasUnread && (
                <button
                  onClick={async () => {
                    // Ya no se llama a clearDropdownNotifications(): vaciaba las de
                    // tiempo real, y ahora alcanza con marcarlas como vistas.
                    await markHistoricalNotificationsAsViewed();
                    setIsOpen(false);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Marcar como leidas
                </button>
              )}
            </div>
            
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-64 overflow-y-auto">
            {dropdownNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              dropdownNotifications.map((notification, index) => (
                <div
                  // El id identifica la notificación de forma estable; el índice solo
                  // se usa como último recurso para las que no lo traen.
                  key={notification.id ?? `sin-id-${index}`}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
                    notification.viewed ? 'opacity-60' : 'bg-lime-50/60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      {notification.title && (
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {notification.title}
                        </p>
                      )}
                      {notification.body && (
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.sent_at)}
                      </p>
                    </div>

                    {/* Indicador de nueva: solo mientras no se haya leído */}
                    {!notification.viewed && (
                      <div className="flex-shrink-0 mt-1.5">
                        <div className="w-2 h-2 bg-lime-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {hasNotifications && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
