// src/theme/Config.js

// 🤖 Dirección de tu servidor Flask (El Robot Cazador y Gestión de Usuarios)
// Por ahora es local, pero la App lo usará para el Login y registro de IDs.
export const BACKEND_URL = 'http://192.168.0.128:5000';

export const JELLYFIN_CONFIG = {
    // 🌐 URL pública de tu contenido
    URL: 'https://33.ein.itsby.design/yamki07/jellyfin/web/#/home',

    // 🔑 Clave API actualizada según tu panel de administración
    API_KEY: '9cb0f14220fe41798b8077ad0ccbd10a',

    // 🛡️ PASE VIP PARA IMÁGENES: 
    // Esta URL lleva incrustado el usuario 'yamki07' y tu clave de Swizzin.
    // Es vital para que los pósters carguen sin errores 401.
    AUTH_URL: 'https://yamki07:7vly6XqZTnEKB1pP@33.ein.itsby.design/yamki07/jellyfin',

    // 🔒 PASE VIP PARA DATOS (HTTP Basic Auth):
    // Es el código 'yamki07:7vly6XqZTnEKB1pP' convertido a Base64.
    BASIC_AUTH: 'Basic eWFta2kwNzo3dmx5NlhxWlRuRUtCMXBQ',

    // 🗝️ Llave maestra administrativa para funciones críticas
    ADMIN_MASTER_KEY: 'Suri.yamki07'
};

// 🎨 Paleta de colores unificada de VERTƎX (Dorado y Negro Bóveda)
export const THEME_COLORS = {
    bgAbsolute: '#050505',
    gold: '#c1915f',
    goldLight: '#d4af37',
    textMain: '#ffffff',
    textMuted: '#888888',
    error: '#ff4444',
    glassBg: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)'
};