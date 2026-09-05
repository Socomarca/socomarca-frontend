/**
 * Configuración de Firebase: Cloud Messaging (FCM).
 *
 * Los valores vienen de variables de entorno para que cada ambiente apunte a su
 * propio proyecto de Firebase. Son públicas por diseño —viajan igual en el bundle
 * del cliente—, así que llevan el prefijo NEXT_PUBLIC_; lo que nunca sale del
 * backend es la service account.
 *
 * El service worker se sirve desde src/app/firebase-messaging-sw.js/route.ts y lee
 * estas mismas envs.
 */

import { initializeApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Clave pública del par VAPID (Firebase Console → Cloud Messaging → Web Push
// certificates). Sin ella getToken() no devuelve token y no hay push web.
const vapid = process.env.NEXT_PUBLIC_VAPID_KEY;

// Una env faltante daría un token que nunca llega o un error opaco del SDK bastante
// más adelante. Se avisa acá, con el nombre de la que falta.
const missingConfig = Object.entries({
  NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
  NEXT_PUBLIC_VAPID_KEY: vapid,
})
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingConfig.length > 0) {
  console.error(
    `Firebase: faltan variables de entorno: ${missingConfig.join(', ')}. Las notificaciones push no van a funcionar.`
  );
}

// Instancia principal de Firebase
const app = initializeApp(firebaseConfig);

// Cloud Messaging para notificaciones push (solo en cliente, NO en iOS Capacitor)
// NO inicializar aquí - se inicializa dinámicamente en NotificationContext cuando se necesita
let messaging: Messaging | null = null;

export { app, messaging, vapid };
