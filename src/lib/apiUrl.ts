// Résolution de l'URL API selon le contexte d'exécution
// - PWA / web : utilise VITE_API_URL ou l'URL de production
// - Capacitor Android/iOS : utilise toujours l'URL de production (pas de localhost)

const PRODUCTION_API = 'https://165-245-211-201.sslip.io/api';

function resolveApiUrl(): string {
  // Contexte Capacitor natif (capacitor:// ou fichier local)
  const isNative =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:' ||
      window.location.hostname === 'localhost' && !import.meta.env.DEV);

  if (isNative) return PRODUCTION_API;

  return (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:5000/api' : PRODUCTION_API)
  );
}

export const API_BASE_URL = resolveApiUrl();
