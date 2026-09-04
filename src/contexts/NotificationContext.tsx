'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { Messaging } from 'firebase/messaging';
import { app, vapid } from '../../lib/firebase';
import { sendFCMToken } from '@/services/actions/fcm.actions';
import { fetchLatestNotifications, fetchMarkNotificationsViewedBatch } from '@/services/actions/notifications.actions';

interface NotificationPayload {
  title?: string;
  body?: string;
  icon?: string;
  sent_at?: string;
  id?: string | number;
  viewed?: boolean;
}

interface NotificationContextType {
  token: string | null;
  notifications: NotificationPayload[]; // Para el banner (se auto-limpian)
  dropdownNotifications: NotificationPayload[]; // Para el dropdown (combinadas: históricas + tiempo real)
  historicalNotifications: NotificationPayload[]; // Notificaciones del backend (siempre visibles)
  realtimeNotifications: NotificationPayload[]; // Notificaciones FCM (se pueden limpiar)
  unreadCount: number; // Contador de notificaciones no leídas
  isSupported: boolean;
  tokenSentToServer: boolean; // Estado para saber si el token se envió al servidor
  tokenError: string | null; // Error al enviar token al servidor
  requestPermission: () => Promise<string | null>;
  clearNotifications: () => void;
  clearDropdownNotifications: () => void; // Nueva función para limpiar solo las de tiempo real
  markHistoricalNotificationsAsViewed: () => Promise<void>;
  addTestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]); // Para banner
  const [dropdownNotifications, setDropdownNotifications] = useState<NotificationPayload[]>([]); // Para dropdown
  const [messaging, setMessaging] = useState<Messaging | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [tokenSentToServer, setTokenSentToServer] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [historicalNotifications, setHistoricalNotifications] = useState<NotificationPayload[]>([]);
  const [realtimeNotifications, setRealtimeNotifications] = useState<NotificationPayload[]>([]);
  const isLoadingHistoricalRef = useRef(false);


  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // iOS bajo Capacitor no soporta Service Workers, así que ahí no hay FCM web.
    const Capacitor = (window as any).Capacitor;
    const isCapacitorIOS = Capacitor && Capacitor.getPlatform() === 'ios';

    if (isCapacitorIOS) {
      console.log('iOS detectado - Firebase Messaging deshabilitado (usar @capacitor/push-notifications)');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // El unsubscribe se guarda acá y no se devuelve desde el .then(): lo que el
    // efecto retorna es lo único que React ejecuta al desmontar. Devolverlo desde
    // dentro de la promesa dejaba el listener vivo para siempre, y con
    // reactStrictMode cada montaje sumaba uno más, de modo que un mismo push se
    // procesaba tantas veces como listeners hubiera acumulados.
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    import('firebase/messaging')
      .then(({ getMessaging, onMessage }) => {
        if (cancelled) {
          return;
        }

        try {
          const _messaging = getMessaging(app);
          setMessaging(_messaging);

          unsubscribe = onMessage(_messaging, (payload) => {
            // El backend manda el id de fcm_notification_histories en el data del
            // push. Sin él no hay forma de saber que esta notificación y la que
            // llega después por el histórico son la misma.
            const rawId = payload.data?.notification_id;
            const id = rawId === undefined ? undefined : Number(rawId);

            const notification: NotificationPayload = {
              id: Number.isInteger(id) && (id as number) > 0 ? id : undefined,
              viewed: false,
              title: payload.notification?.title || payload.data?.title || 'Nueva notificación',
              body: payload.notification?.body || payload.data?.body || '',
              icon: payload.notification?.icon || '/assets/global/logo.png',
            };

            setRealtimeNotifications(prev => [notification, ...prev]);
          });
        } catch (error) {
          console.log('Firebase Messaging no soportado:', error);
          setIsSupported(false);
        }
      })
      .catch((error) => {
        console.log('Error cargando Firebase Messaging:', error);
        setIsSupported(false);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const loadHistoricalNotifications = useCallback(async () => {
    if (isLoadingHistoricalRef.current) {
      return;
    }

    isLoadingHistoricalRef.current = true;

    try {
      console.log('🔔 Cargando notificaciones históricas...');
      const result = await fetchLatestNotifications();
      console.log('🔔 Resultado de fetchLatestNotifications:', result);
      
      if (result.ok && result.data) {
        // Convertir las notificaciones del backend al formato del contexto
        // Se conservan también las ya vistas: el badge se apaga con el flag `viewed`,
        // no borrando la notificación. Descartarlas acá era lo que impedía volver a
        // abrir la campana y ver las anteriores.
        const formattedNotifications: NotificationPayload[] = result.data
          .map(notification => ({
            id: notification.id,
            title: notification.title,
            body: notification.message,
            sent_at: notification.sent_at,
            viewed: notification.viewed,
            icon: '/assets/global/logo.png'
          }));
        
        console.log('🔔 Notificaciones formateadas:', formattedNotifications);
        setHistoricalNotifications(formattedNotifications);
      } else {
        console.log('🔔 No se pudieron cargar las notificaciones:', result.error);
      }
    } catch (error) {
      console.error('🔔 Error loading historical notifications:', error);
    } finally {
      isLoadingHistoricalRef.current = false;
    }
  }, []);

  // Cargar notificaciones históricas al inicializar
  useEffect(() => {
    void loadHistoricalNotifications();
  }, [loadHistoricalNotifications]);

  // Polling cada 60 segundos para refrescar notificaciones
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      void loadHistoricalNotifications();
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [loadHistoricalNotifications]);

  // Combinar notificaciones históricas y en tiempo real para el dropdown.
  //
  // Un push que llega con la app abierta entra por realtime, y el polling del
  // histórico lo trae de nuevo unos segundos después: son la misma notificación por
  // dos caminos. Se descarta la repetida por id, quedándose con la de tiempo real
  // porque es la que llegó primero y conserva el orden.
  //
  // Las que no traen id (un backend viejo que todavía no lo manda, o addTestNotification)
  // se dejan pasar: sin id no hay forma de compararlas y es preferible mostrar de más
  // que esconder una notificación real.
  useEffect(() => {
    const seenIds = new Set<number>();

    const combined = [...realtimeNotifications, ...historicalNotifications].filter(
      (notification) => {
        const id = Number(notification.id);

        if (!Number.isInteger(id) || id <= 0) {
          return true;
        }

        if (seenIds.has(id)) {
          return false;
        }

        seenIds.add(id);
        return true;
      }
    );

    setDropdownNotifications(combined);
  }, [realtimeNotifications, historicalNotifications]);

  // Función para enviar token al servidor
  const sendTokenToServer = useCallback(async (fcmToken: string) => {
    try {
      setTokenError(null);
      const result = await sendFCMToken(fcmToken);
      
      if (result.ok) {
        setTokenSentToServer(true);
        console.log('Token FCM enviado al servidor exitosamente:', result.data?.message);
      } else {
        setTokenError(result.error || 'Error al enviar token al servidor');
        console.error('Error enviando token FCM:', result.error);
      }
    } catch (error) {
      setTokenError(error instanceof Error ? error.message : 'Error inesperado');
      console.error('Error inesperado enviando token FCM:', error);
    }
  }, []);

  // Memoizada: NotificationWrapper la tiene en las dependencias de su efecto, y sin
  // esto cambiaba de identidad en cada render del provider (uno por cada tick del
  // polling), repitiendo la petición del token FCM una y otra vez.
  const requestPermission = useCallback(async (): Promise<string | null> => {
    if (!messaging || !isSupported) {
      return null;
    }

    try {
      // Importar getToken dinámicamente
      const { getToken } = await import('firebase/messaging');
      
      // Solo obtener token FCM - sin solicitar permisos de notificaciones nativas
      const fcmToken = await getToken(messaging, {
        vapidKey: vapid,
      });
      
      if (fcmToken) {
        setToken(fcmToken);
        
        // Enviar el token al backend automáticamente
        await sendTokenToServer(fcmToken);
        
        return fcmToken;
      } else {
        return null;
      }
    } catch (error) {
      setTokenError(error instanceof Error ? error.message : 'Error obteniendo token FCM');
      return null;
    }
  }, [messaging, isSupported, sendTokenToServer]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const clearDropdownNotifications = () => {
    setRealtimeNotifications([]);
  };

  // Marca como vistas las pendientes, sin quitarlas de la lista: lo único que cambia
  // es el flag, que es lo que apaga el badge. Así siguen disponibles al volver a abrir.
  const markHistoricalNotificationsAsViewed = useCallback(async () => {
    const pendingIds = [...realtimeNotifications, ...historicalNotifications]
      .filter(notification => !notification.viewed)
      .map(notification => Number(notification.id))
      .filter(id => Number.isInteger(id) && id > 0);

    const notificationIds = [...new Set(pendingIds)];

    if (notificationIds.length === 0) {
      return;
    }

    const result = await fetchMarkNotificationsViewedBatch(notificationIds);

    if (result.ok) {
      const idsSet = new Set(notificationIds);
      const markViewed = (list: NotificationPayload[]) =>
        list.map(notification =>
          idsSet.has(Number(notification.id))
            ? { ...notification, viewed: true }
            : notification
        );

      setHistoricalNotifications(markViewed);
      // La copia que llegó por push tiene que quedar en el mismo estado, o al
      // recombinarse volvería a contar como no leída.
      setRealtimeNotifications(markViewed);
      return;
    }

    console.error('🔔 No se pudieron marcar notificaciones como vistas:', result.error);
  }, [historicalNotifications, realtimeNotifications]);

  // Función para agregar notificación de prueba
  const addTestNotification = () => {
    const testNotification = {
      title: 'Notificación de prueba',
      body: 'Esta es una notificación simulada para testing',
      icon: '/assets/global/logo.png'
    };
    
    // Las notificaciones de prueba van a realtimeNotifications
    setRealtimeNotifications(prev => [testNotification, ...prev]);
  };



  // Contador de no leídas. Antes era el largo de la lista, así que el badge solo
  // se apagaba si las notificaciones desaparecían.
  const unreadCount = dropdownNotifications.filter(
    notification => !notification.viewed
  ).length;

  const value: NotificationContextType = {
    token,
    notifications,
    dropdownNotifications,
    historicalNotifications,
    realtimeNotifications,
    unreadCount,
    isSupported,
    tokenSentToServer,
    tokenError,
    requestPermission,
    clearNotifications,
    clearDropdownNotifications,
    markHistoricalNotificationsAsViewed,
    addTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
