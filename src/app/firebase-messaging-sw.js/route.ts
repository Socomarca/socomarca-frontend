/**
 * Sirve el service worker de Firebase Messaging en /firebase-messaging-sw.js.
 *
 * Antes era un archivo estático en public/ con la configuración escrita a mano.
 * Los archivos de public/ se sirven crudos, sin pasar por el bundler, así que no
 * pueden leer variables de entorno: con un proyecto de Firebase por ambiente esa
 * configuración tenía que vivir en dos lugares distintos a la vez. Servirlo desde
 * una ruta lo deja leyendo las mismas envs que el resto de la app.
 *
 * El SDK de Firebase registra este archivo por su cuenta al pedir el token, así
 * que la ruta tiene que responder exactamente en esta URL.
 */

// Las envs se leen en cada request y no en el build, para que un cambio de
// configuración no dependa de cuándo se compiló la ruta.
export const dynamic = 'force-dynamic';

const FIREBASE_SDK_VERSION = '9.23.0';

const CONFIG_KEYS = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
} as const;

const javascript = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      // El navegador revisa este archivo para decidir si actualiza el service
      // worker: servirlo cacheado deja a los clientes con la configuración vieja.
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });

export async function GET() {
  const config: Record<string, string> = {};
  const missing: string[] = [];

  for (const [field, envName] of Object.entries(CONFIG_KEYS)) {
    const value = process.env[envName];

    if (!value) {
      missing.push(envName);
      continue;
    }

    config[field] = value;
  }

  // Sin configuración el service worker no puede registrarse. Falla acá, con el
  // nombre de lo que falta, en vez de dejar un push que nunca llega y sin rastro.
  if (missing.length > 0) {
    const message = `firebase-messaging-sw.js: faltan variables de entorno: ${missing.join(', ')}`;

    console.error(message);

    return javascript(`throw new Error(${JSON.stringify(message)});`, 500);
  }

  return javascript(`// Generado por src/app/firebase-messaging-sw.js/route.ts
importScripts("https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config, null, 2)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(() => {
  // Con la app en segundo plano el navegador muestra la notificación por su
  // cuenta a partir del bloque 'notification' del push. Llamar acá a
  // showNotification() la mostraría dos veces.
});
`);
}
