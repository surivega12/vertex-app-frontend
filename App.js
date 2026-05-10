import 'react-native-gesture-handler';
import React, { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, StatusBar, ImageBackground, Image, ScrollView, FlatList, TouchableOpacity, TextInput, Platform, useWindowDimensions, Modal, Linking, Alert, ActivityIndicator, Switch, ToastAndroid, BackHandler } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

// Navegación
import { NavigationContainer, DarkTheme, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// UI y Web Safe
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, Octicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store'; // 🔥 FIX: Bóveda de encriptación militar
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
// 🔥 NUEVO: Triada de tareas y escudo Anti-Sueño
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Video as ExpoVideo } from 'expo-av';

WebBrowser.maybeCompleteAuthSession();

// 🛑 ESCUDO ANTI-EXPO GO: Cargamos lo móvil solo si NO es web

// 🛑 ESCUDO ANTI-EXPO GO: Cargamos lo móvil solo si NO es web
let Voice, FileSystem, MediaLibrary, Notifications, Brightness, ScreenOrientation, Application, Device, Network, Video;

if (Platform.OS !== 'web') {
    Voice = require('@react-native-voice/voice').default;
    FileSystem = require('expo-file-system');
    MediaLibrary = require('expo-media-library');
    Notifications = require('expo-notifications');
    Brightness = require('expo-brightness');
    ScreenOrientation = require('expo-screen-orientation');
    Application = require('expo-application');
    Device = require('expo-device');
    Network = require('expo-network');

    // 🔥 EL MOTOR ORIGINAL: Solo se carga en celulares 🔥
    // Video = require('react-native-video').default;

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
    // 🟢 1. REPRODUCTOR WEB CORREGIDO (Permite adelantar con el Slider)
} else {
    Video = React.forwardRef(({ source, style, paused, onProgress, onLoad, resizeMode }, ref) => {
        const videoRef = useRef(null);

        React.useImperativeHandle(ref, () => ({
            seek: (time) => {
                if (videoRef.current) videoRef.current.currentTime = time;
            }
        }));

        return (
            <video
                ref={videoRef}
                src={source?.uri}
                style={{ ...style, objectFit: resizeMode === 'cover' ? 'cover' : 'contain', width: '100%', height: '100%', backgroundColor: '#000' }}
                autoPlay={!paused}
                onTimeUpdate={(e) => onProgress && onProgress({ currentTime: e.target.currentTime })}
                onLoadedMetadata={(e) => onLoad && onLoad({ duration: e.target.duration })}
            />
        );
    });
}
// 🔥 HACK PREMIUM: Forzar que el Autocompletado de Chrome sea Oscuro en Web 🔥
if (Platform.OS === 'web') {
    const style = document.createElement('style');
    style.textContent = `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #111111 inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
        }
    `;
    document.head.append(style);
}

// ==========================================
// CONSTANTES Y VARIABLES GLOBALES
// ==========================================
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const PREMIUM_GOLD = '#c1915f';
const INACTIVE_ICON = '#888888';

// Llamamos a las variables de entorno de forma segura
const BACKEND_URL = "https://vertex-backend-production-a52c.up.railway.app";
const ADMIN_MASTER_KEY = "Suri.yamki07";

const FALLBACK_HERO = [
    { id: 'h1', title: "PEAKY BLINDERS\nTHE IMMORTAL MAN", year: "2026", rating: "R", lang: "Latino", genres: "Crimen • Drama", overview: "Después de que su hijo distanciado se vea envuelto en un complot nazi, el gánster autoexiliado Tommy Shelby debe regresar a Birmingham.", bgImage: "https://image.tmdb.org/t/p/original/xxA9bE8kZl1xXG9Q8zN1bT8V8aI.jpg", thumb: "https://image.tmdb.org/t/p/w500/xxA9bE8kZl1xXG9Q8zN1bT8V8aI.jpg", studio: "Netflix", imdb: "7.4", type: "movie" },
    { id: 'h2', title: "DEADPOOL Y LOBEZNO", year: "2024", rating: "R", lang: "Latino", genres: "Acción • Comedia", overview: "Un apático Wade Wilson se afana en la vida civil tras dejar atrás sus días como el mercenario moralmente flexible.", bgImage: "https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16ZAKAW51A71.jpg", thumb: "https://image.tmdb.org/t/p/w500/yDHYTfA3R0jFYba16ZAKAW51A71.jpg", studio: "Disney+", imdb: "7.9", type: "movie" },
    { id: 'h3', title: "PROJECT HAIL MARY", year: "2026", rating: "PG-13", lang: "Latino", genres: "Ciencia ficción • Aventura", overview: "El profesor de ciencias Ryland Grace despierta en una nave espacial a años luz de casa sin recordar quién es ni cómo llegó allí.", bgImage: "https://image.tmdb.org/t/p/original/vQvjU8E0ZfGxqXQ9nCq11jXyPzY.jpg", thumb: "https://image.tmdb.org/t/p/w500/vQvjU8E0ZfGxqXQ9nCq11jXyPzY.jpg", studio: "Prime Video", imdb: "8.5", type: "movie" },
    { id: 'h4', title: "ZOOTOPIA 2", year: "2025", rating: "A", lang: "Latino", genres: "Animación • Comedia • Familia", overview: "Los detectives Judy Hopps y Nick Wilde se asocian de nuevo para resolver un nuevo caso.", bgImage: "https://image.tmdb.org/t/p/original/h3fwjQhQ7qC07QJ8YyI8R5oR8fA.jpg", thumb: "https://image.tmdb.org/t/p/w500/h3fwjQhQ7qC07QJ8YyI8R5oR8fA.jpg", studio: "Disney+", imdb: "8.0", type: "movie" },
    {
        id: 'h5', title: "DEMON SLAYER:\nINFINITY CASTLE", year: "2025", rating: "B15", lang: "Latino", genres: "Animación • Acción", overview: "La batalla final entre los cazadores de demonios y Muzan Kibutsuji comienza.", bgImage: "https://image.tmdb.org/t/p/original/x2RS3hTcsxeEQO19T2iU1wP9Iu.jpg", thumb: "https://image.tmdb.org/t/p/w500/x2RS3hTcsxeEQO19T2iU1wP9Iu.jpg", studio: "Netflix", imdb: "9.1", type: "anime",
        seasons: [
            {
                id: 's1', seasonNumber: 1, title: 'Temporada 1',
                episodes: [
                    { id: 'e1', episodeNumber: 1, title: 'El comienzo de la batalla', duration: '45m', overview: 'Tanjiro y los Pilares caen en la trampa del Castillo Infinito. La lucha desesperada ha empezado.', thumb: 'https://image.tmdb.org/t/p/w500/x2RS3hTcsxeEQO19T2iU1wP9Iu.jpg' },
                    { id: 'e2', episodeNumber: 2, title: 'Furia y Dolor', duration: '24m', overview: 'Sanemi y Gyomei se enfrentan a la Luna Superior Uno en un combate brutal que pondrá a prueba sus límites.', thumb: 'https://image.tmdb.org/t/p/w500/x2RS3hTcsxeEQO19T2iU1wP9Iu.jpg' },
                    { id: 'e3', episodeNumber: 3, title: 'Determinación', duration: '24m', overview: 'Zenitsu e Inosuke deben superar sus miedos más profundos si quieren sobrevivir a los demonios en las sombras.', thumb: 'https://image.tmdb.org/t/p/w500/x2RS3hTcsxeEQO19T2iU1wP9Iu.jpg' }
                ]
            }
        ]
    }
];

const ESTUDIOS = [
    { name: "Disney+", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg", query: "Disney+", color: '#040714' },
    { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg", query: "Netflix", color: '#1a0000' },
    { name: "Apple TV+", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Apple_TV%2B_logo.svg", query: "Apple TV+", color: '#0a0a0a' },
    { name: "Prime Video", logo: "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg", query: "Prime Video", color: '#001a33' },
    { name: "Max", logo: "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg", query: "Max", color: '#110022' },
    { name: "Paramount+", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus.svg", query: "Paramount+" },
    { name: "Universal", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Universal_Pictures_logo.svg/1200px-Universal_Pictures_logo.svg.png", query: "Universal" },
    { name: "Warner Bros", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Warner_Bros_logo.svg/1200px-Warner_Bros_logo.svg.png", query: "Warner Bros" }
];

const SIGUE_VIENDO = [
    { id: 'sv1', title: "KPop Cazadores de Demonios", bgImage: "https://image.tmdb.org/t/p/w500/qW1e2r3t4y5u6i7o8p9a0s1d2f.jpg", progress: 0.65, type: 'movie' },
    { id: 'sv2', title: "Project Hail Mary", bgImage: "https://image.tmdb.org/t/p/w500/vQvjU8E0ZfGxqXQ9nCq11jXyPzY.jpg", progress: 0.30, type: 'movie' }
];

const POPULAR_GENRES = [
    { id: 'pg1', name: "Animación", bgImage: "https://image.tmdb.org/t/p/w500/hlxOxbUEEtR6W7P9F01DhwX108H.jpg" },
    { id: 'pg2', name: "Comedia", bgImage: "https://image.tmdb.org/t/p/w500/yDHYTfA3R0jFYba16ZAKAW51A71.jpg" },
    { id: 'pg3', name: "Crimen", bgImage: "https://image.tmdb.org/t/p/w500/xxA9bE8kZl1xXG9Q8zN1bT8V8aI.jpg" },
    { id: 'pg4', name: "Acción", bgImage: "https://image.tmdb.org/t/p/w500/8rpDcsfLJypbO6vtec04H36xU2I.jpg" }
];

// 🧠 CEREBRO GLOBAL UNIFICADO (ESTADO DE LA APP)
// ==========================================
function ReproductorTV({ route, navigation }) {
    const params = route.params || {};
    const { stream_url, nombre } = params;

    // 🔥 Detectamos si estamos en Celular o en TV/PC
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [canalesLive, setCanalesLive] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!stream_url) {
            const cargarCanales = async () => {
                try {
                    // 🔥 FIX 1: Se añadió la barra "/" al final. Obligatorio para Django.
                    const response = await fetch(`${BACKEND_URL}/api/canales_tv`);
                    if (response.ok) {
                        const data = await response.json();
                        setCanalesLive(data);
                    }
                } catch (error) {
                    console.log("No se pudieron cargar los canales", error);
                } finally {
                    setCargando(false);
                }
            };
            cargarCanales();
        }
    }, [stream_url]);

    // 🛑 SI NO HAY CANAL SELECCIONADO -> MOSTRAR LA PARRILLA
    if (!stream_url) {
        return (
            <View style={{ flex: 1, backgroundColor: '#050505', paddingTop: isMobile ? (Platform.OS === 'ios' ? 60 : 40) : 40, paddingHorizontal: 20 }}>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingLeft: isMobile ? 0 : 50 }}>
                    {isMobile && (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, marginRight: 15 }}>
                            <Ionicons name="arrow-back" size={24} color="#ffffff" />
                        </TouchableOpacity>
                    )}
                    <Text style={{ color: '#c1915f', fontSize: 26, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', letterSpacing: 1 }}>
                        TELEVISIÓN EN VIVO
                    </Text>
                </View>

                <View style={{ flex: 1, paddingLeft: isMobile ? 0 : 50 }}>
                    {cargando ? (
                        <ActivityIndicator size="large" color="#c1915f" style={{ marginTop: 50 }} />
                    ) : canalesLive.length === 0 ? (
                        <Text style={{ color: '#888', textAlign: 'center', marginTop: 50 }}>No hay canales disponibles en este momento.</Text>
                    ) : (
                        <FlatList
                            data={canalesLive}
                            keyExtractor={item => item.id.toString()}
                            numColumns={isMobile ? 2 : 4}
                            columnWrapperStyle={{ justifyContent: 'flex-start', gap: 15 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={{ width: isMobile ? '48%' : 200, backgroundColor: '#111', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(193, 145, 95, 0.3)' }}
                                    onPress={() => {
                                        if (item.stream_url) {
                                            navigation.navigate('TV en Vivo', { stream_url: item.stream_url, nombre: item.nombre });
                                        } else {
                                            Alert.alert("Aviso", "Canal fuera del aire temporalmente.");
                                        }
                                    }}
                                >
                                    <Image source={{ uri: item.logo || 'https://placehold.co/100x100/111/c1915f/png?text=TV' }} style={{ width: 70, height: 70, resizeMode: 'contain', marginBottom: 15 }} />
                                    <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 13 }}>{item.nombre}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        );
    }

    // 🟢 SI YA SELECCIONÓ UN CANAL -> MOSTRAR EL REPRODUCTOR DE VIDEO A PANTALLA COMPLETA
    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 20, zIndex: 100 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
                {Platform.OS === 'web' ? (
                    <video
                        src={stream_url}
                        style={{ width: '100%', height: '100%', backgroundColor: '#000', outline: 'none' }}
                        controls
                        autoPlay
                    />
                ) : (
                    <ExpoVideo
                        source={{ uri: stream_url }}
                        useNativeControls
                        resizeMode="contain"
                        shouldPlay
                        style={{ width: '100%', height: '100%' }}
                    />
                )}
            </View>
        </View>
    );
}

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [continueWatching, setContinueWatching] = useState([]);

    // 🔥 FIX 1: isLoggedIn empieza en FALSE para obligar al login
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [watchlist, setWatchlist] = useState([]);
    const [history, setHistory] = useState([]);
    const [completedDownloads, setCompletedDownloads] = useState([]);
    // FIX 2: Dejamos un usuario vacío por defecto hasta que Django nos diga quién es
    const [user, setUser] = useState({ name: "", photo: "", status: "Usuario Gratuito", vipDays: 0, downloadLimit: 1 });
    const [jellyfinMovies, setJellyfinMovies] = useState([]);
    const [offset, setOffset] = useState(0);

    const [isAppReady, setIsAppReady] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // 🔥 AÑADE ESTA LÍNEA AQUÍ 🔥
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    const [dailyHistory, setDailyHistory] = useState({ date: new Date().toDateString(), watched: [] });

    // 🔥 EL ARRANQUE SINCRONIZADO Y VALIDACIÓN DE SESIÓN (JWT) 🔥
    useEffect(() => {
        const initApp = async () => {
            try {
                // 1. VERIFICACIÓN DE RED HÍBRIDA (Móvil y Web)
                let hasInternet = true;
                if (Platform.OS !== 'web' && Network) {
                    const networkState = await Network.getNetworkStateAsync();
                    hasInternet = networkState.isConnected && networkState.isInternetReachable;
                } else if (Platform.OS === 'web') {
                    hasInternet = navigator.onLine; // Usamos el motor nativo del navegador
                }

                // 2. Leer la Bóveda Local (Caché)
                const cw = await AsyncStorage.getItem('vertex_cw');
                const wl = await AsyncStorage.getItem('vertex_wl');
                const dl = await AsyncStorage.getItem('vertex_dl');
                if (cw) setContinueWatching(JSON.parse(cw));
                if (wl) setWatchlist(JSON.parse(wl));
                if (dl) setCompletedDownloads(JSON.parse(dl));

                // 🔥 NUEVO: Leer el historial diario (FREEMIUM) 🔥
                const dh = await AsyncStorage.getItem('vertex_daily');
                if (dh) {
                    const parsedDh = JSON.parse(dh);
                    if (parsedDh.date === new Date().toDateString()) setDailyHistory(parsedDh);
                    else setDailyHistory({ date: new Date().toDateString(), watched: [] }); // Resetea si es un nuevo día
                }

                // 🔥 MAGIA DE SEGURIDAD: VERIFICAMOS SI YA HABÍA INICIADO SESIÓN ANTES 🔥
                if (hasInternet) {
                    const savedToken = Platform.OS === 'web'
                        ? await AsyncStorage.getItem('vertex_access')
                        : await SecureStore.getItemAsync('vertex_access');
                    if (savedToken) {
                        try {
                            const profileRes = await fetch(`${BACKEND_URL}/api/perfil/`, {
                                headers: { 'Authorization': `Bearer ${savedToken}` }
                            });
                            if (profileRes.ok) {
                                const profileData = await profileRes.json();
                                setUser(prev => ({
                                    ...prev,
                                    id: profileData.id,
                                    name: profileData.username,
                                    email: profileData.email,
                                    vipDays: profileData.vip_days_left,
                                    isVip: profileData.is_vip
                                }));
                                setIsLoggedIn(true); // Token válido: ¡Pasa directo sin pedir clave!
                            } else {
                                // El token expiró o es inválido, limpiamos y lo mandamos a login
                                if (Platform.OS === 'web') {
                                    await AsyncStorage.removeItem('vertex_access');
                                    await AsyncStorage.removeItem('vertex_refresh');
                                } else {
                                    if (Platform.OS === 'web') {
                                        await AsyncStorage.removeItem('vertex_access');
                                        await AsyncStorage.removeItem('vertex_refresh');
                                    } else {
                                        await SecureStore.deleteItemAsync('vertex_access');
                                        await SecureStore.deleteItemAsync('vertex_refresh');
                                    }
                                }
                                setIsLoggedIn(false);
                            }
                        } catch (e) {
                            console.log("El servidor Django está apagado. No se pudo verificar la sesión.");
                        }
                    } else {
                        setIsLoggedIn(false); // No hay token guardado
                    }
                }

                if (!hasInternet) {
                    console.log("✈️ MODO OFFLINE DETECTADO");
                    setIsOfflineMode(true);
                    if (Platform.OS !== 'web') {
                        Alert.alert("Modo Sin Conexión", "No hay internet. Has entrado a tu Bóveda Local.");
                    }
                } else {
                    setIsOfflineMode(false);
                    await fetchJellyfinData(false);
                }
            } catch (e) {
                console.log("Error inicializando app", e);
            } finally {
                // 3. ¡TODO LISTO! Quitamos la pantalla de carga
                setIsAppReady(true);
                await SplashScreen.hideAsync();
            }
        };
        initApp();
    }, []);

    useEffect(() => { if (isAppReady) AsyncStorage.setItem('vertex_cw', JSON.stringify(continueWatching)); }, [continueWatching, isAppReady]);
    useEffect(() => { if (isAppReady) AsyncStorage.setItem('vertex_wl', JSON.stringify(watchlist)); }, [watchlist, isAppReady]);
    useEffect(() => { if (isAppReady) AsyncStorage.setItem('vertex_dl', JSON.stringify(completedDownloads)); }, [completedDownloads, isAppReady]);

    const attemptPlay = async (movie, proceedToPlay) => {
        // REGLA 1: Si no hay cuenta, no hay video. Mandamos a Login.
        if (!isLoggedIn) {
            Alert.alert("Acceso Restringido", "Debes iniciar sesión para acceder a los 5 videos gratuitos diarios.");
            navigation.navigate('Auth');
            return;
        }

        // REGLA 2: Los VIP no tienen límites
        if (user.isVip || user.vipDays > 0) {
            proceedToPlay();
            return;
        }

        const today = new Date().toDateString();
        let currentHistory = { ...dailyHistory };

        if (currentHistory.date !== today) {
            currentHistory = { date: today, watched: [] };
        }

        const finalId = movie.jellyfin_id || movie.id;

        // Si ya vio este video hoy, no consume crédito
        if (currentHistory.watched.includes(finalId)) {
            proceedToPlay();
            return;
        }
        // Nota: El historial ya está vinculado al dispositivo mediante AsyncStorage
        if (currentHistory.watched.length >= 5) {
            setShowVipModal(true);
            return;
        }

        const newWatched = [...currentHistory.watched, finalId];
        const updatedHistory = { date: today, watched: newWatched };
        setDailyHistory(updatedHistory);
        await AsyncStorage.setItem('vertex_daily', JSON.stringify(updatedHistory));

        proceedToPlay();
    };

    // 2. EXTRACCIÓN AVANZADA DE DATOS (JELLYFIN PREMIUM)
    const fetchJellyfinData = async (isLoadMore = false) => {
        try {
            const token = Platform.OS === 'web' ? await AsyncStorage.getItem('vertex_access') : await SecureStore.getItemAsync('vertex_access');
            const currentOffset = isLoadMore ? offset + 40 : 0;

            const response = await fetch(`${BACKEND_URL}/api/catalogo/?offset=${currentOffset}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const moviesData = await response.json();

            // 🛡️ ESCUDO ANTI-CRASH: Si Django devuelve error o no hay 'Items', detenemos la ejecución silenciosamente
            if (!response.ok || !moviesData || !moviesData.Items) {
                console.log("Esperando autorización o el catálogo está vacío...");
                setIsLoadingMore(false);
                return;
            }

            // 🔥 FIX: Usamos un placeholder más estable y con diseño acorde a VERTƎX
            const fallbackBg = "https://placehold.co/500x750/111111/c1915f/png?text=VERT%C6%8EX";

            const formattedMovies = moviesData.Items.map(item => {

                // 1. PREPARAMOS LOS ENLACES DE JELLYFIN (🔥 OPTIMIZADOS 🔥)
                const hasPrimary = item.ImageTags && item.ImageTags.Primary;
                const hasBackdrop = item.BackdropImageTags && item.BackdropImageTags.length > 0;

                // Ahora las imágenes pasan por nuestro Proxy en Django
                const jellyfinPrimary = hasPrimary ? `${BACKEND_URL}/api/imagen/${item.Id}/Primary/` : null;
                const jellyfinBackdrop = hasBackdrop ? `${BACKEND_URL}/api/imagen/${item.Id}/Backdrop/` : null;

                // 2. PREPARAMOS EL ESCUDO ANTI-404 (THE MOVIE DB)
                const tmdbId = item.ProviderIds?.Tmdb || item.ProviderIds?.TmdbMovie || item.ProviderIds?.TmdbSeries || item.ProviderIds?.TmdbEpisode;

                const tmdbPoster = tmdbId ? `https://image.tmdb.org/t/p/w500/${tmdbId}.jpg` : null;
                // 🔥 FIX: Cambiamos 'original' por 'w1280' para que no descargue fondos gigantes de 5MB si falla Jellyfin
                const tmdbBg = tmdbId ? `https://image.tmdb.org/t/p/w1280/${tmdbId}.jpg` : null;

                const director = item.People?.find(p => p.Type === 'Director')?.Name || 'Desconocido';
                const studio = item.Studios?.length > 0 ? item.Studios[0].Name : 'Desconocido';

                let videoQualities = []; let audioTracks = []; let subtitles = [];
                let videoCodec = 'H.264'; let audioCodec = 'AAC';
                let sourcesMap = {}; // 🔥 NUEVO: El cerebro que guarda los IDs de los archivos

                if (item.MediaSources && item.MediaSources.length > 0) {
                    item.MediaSources.forEach(source => {
                        const streams = source.MediaStreams || [];
                        const videoStream = streams.find(s => s.Type === 'Video');
                        if (videoStream) {
                            let qualityName = '1080p';
                            if (videoStream.Width >= 3800) qualityName = '4K UHD';
                            else if (videoStream.Width >= 1900) qualityName = '1080p';
                            else qualityName = '720p';

                            if (!videoQualities.includes(qualityName)) {
                                videoQualities.push(qualityName);
                            }

                            // 🔥 MAGIA: Guardamos el ID del archivo asignado a su calidad
                            sourcesMap[qualityName] = source.Id;

                            if (videoStream.Codec) videoCodec = videoStream.Codec.toUpperCase();
                        }
                    });

                    const firstStreams = item.MediaSources[0].MediaStreams || [];
                    const aStream = firstStreams.find(s => s.Type === 'Audio');
                    if (aStream && aStream.Codec) audioCodec = aStream.Codec.toUpperCase();

                    audioTracks = firstStreams.filter(s => s.Type === 'Audio').map(s => ({ index: s.Index, language: s.Language ? s.Language.toUpperCase() : 'UND', title: s.Title || s.DisplayTitle || `Audio ${s.Index}`, isDefault: s.IsDefault }));
                    subtitles = firstStreams.filter(s => s.Type === 'Subtitle').map(s => ({ index: s.Index, language: s.Language ? s.Language.toUpperCase() : 'UND', title: s.Title || s.DisplayTitle || `Subtítulo ${s.Index}`, isDefault: s.IsDefault }));
                }

                // 🔥 PUNTO 1: LIMPIADOR INTELIGENTE DE TÍTULOS 🔥
                const cleanTitle = (rawTitle) => {
                    if (!rawTitle) return "Desconocido";
                    return rawTitle
                        .replace(/(\(|\[).*?(1080p|4k|720p|x264|x265|hevc|bluray|web-dl|dual|latino|aac|ac3|hd).*?(\)|\])/gi, '')
                        .replace(/1080p|4K|720p|x264|x265|HEVC|BluRay|WEB-DL|Dual Audio|Latino|Sub|HD/gi, '')
                        .replace(/\.(mkv|mp4|avi|mov)$/i, '')
                        .replace(/[\._]/g, ' ')
                        .trim();
                };

                const finalCleanTitle = cleanTitle(item.Name); // Aquí aplicamos la limpieza

                // 🔥 FIX 2: CEREBRO DE CATEGORIZACIÓN INTELIGENTE
                const tagsString = item.Tags ? item.Tags.join(" ").toLowerCase() : "";
                const genresString = item.Genres ? item.Genres.join(" ").toLowerCase() : "";
                const pathString = item.Path ? item.Path.toLowerCase() : "";
                const titleString = finalCleanTitle.toLowerCase();

                // 🔥 BÚSQUEDA MÁS AGRESIVA: Ignora las barras (/) o (\) de Windows/Linux
                const isAnime = pathString.includes("anime") || genresString.includes("anime") || tagsString.includes("anime");
                const isNovel = pathString.includes("novela") || genresString.includes("novela") || tagsString.includes("novela") || pathString.includes("dorama");

                const isAnimacion = genresString.includes("animación") || genresString.includes("animacion") || genresString.includes("family") || genresString.includes("kids") || isAnime || genresString.includes("animation");

                // Lógica de Series
                const isEpisodePattern = item.Type?.toLowerCase() === 'episode' || /s\d{2}e\d{2}/i.test(titleString) || /temporada/i.test(titleString) || /capítulo/i.test(titleString);
                const isSeriesOrEpisode = item.Type?.toLowerCase() === 'series' || item.Type?.toLowerCase() === 'season' || item.Type?.toLowerCase() === 'episode' || isEpisodePattern || pathString.includes("/series/");

                const finalType = isSeriesOrEpisode ? 'series' : 'movie';

                // Extraemos temporadas si existen, o creamos la "Virtual" para capítulos sueltos
                let seasonsDataFormated = [];
                if (item.Seasons && item.Seasons.length > 0) {
                    seasonsDataFormated = item.Seasons;
                } else if (finalType === 'series') {
                    seasonsDataFormated = [{
                        id: 'virtual_season',
                        seasonNumber: 1,
                        title: 'Episodios',
                        episodes: [{
                            id: item.Id,
                            episodeNumber: 1,
                            title: item.Name,
                            duration: 'Desconocida',
                            overview: item.Overview || 'Sin descripción',
                            thumb: jellyfinPrimary || fallbackBg
                        }]
                    }];
                }

                return {
                    id: item.Id, jellyfin_id: item.Id, title: finalCleanTitle,
                    year: item.ProductionYear || '2024', rating: item.OfficialRating || 'VIP',
                    lang: audioTracks.length > 1 ? 'Multi' : (audioTracks[0]?.language || 'Latino'),
                    genres: item.Genres && item.Genres.length > 0 ? item.Genres.slice(0, 2).join(' • ') : 'Premium',
                    overview: item.Overview && item.Overview !== "" ? item.Overview : 'Sin sinopsis disponible desde el servidor.',
                    thumb: jellyfinPrimary,
                    bgImage: jellyfinBackdrop || jellyfinPrimary,
                    tmdbThumb: tmdbPoster || fallbackBg,
                    tmdbBg: tmdbBg || tmdbPoster || fallbackBg,
                    type: finalType,
                    isAnime, isNovel, isAnimacion,
                    imdb: item.CommunityRating ? item.CommunityRating.toFixed(1) : '5.0',
                    director, studio,
                    qualities: videoQualities.length > 0 ? videoQualities : ['1080p (Original)'],
                    audioTracks, subtitles,
                    seasonsData: seasonsDataFormated,
                    videoCodec, audioCodec,
                    sourcesMap // 🔥 Agregamos el mapa a la base de datos de la app
                };
            });

            // 🔥 FASE 3: PRECARGA MÁGICA DE IMÁGENES 🔥
            if (!isLoadMore && formattedMovies.length > 0) {
                try {
                    // Tomamos las 5 primeras películas del Hero
                    const top5 = formattedMovies.slice(0, 5);
                    const urlsToPrefetch = [];

                    top5.forEach(m => {
                        if (m.bgImage) urlsToPrefetch.push(m.bgImage);
                        if (m.thumb) urlsToPrefetch.push(m.thumb);
                    });

                    // Le ordenamos a expo-image que descargue todo a la RAM en silencio
                    await ExpoImage.prefetch(urlsToPrefetch);
                    console.log("✅ Precarga de imágenes del Hero completada");
                } catch (prefetchError) {
                    console.log("⚠️ Error precargando imágenes, pero continuamos...", prefetchError);
                }
            }

            if (isLoadMore) {
                setJellyfinMovies(prev => [...prev, ...formattedMovies]);
                setOffset(currentOffset);
            } else {
                setJellyfinMovies(formattedMovies);
            }
        } catch (error) { console.log("Error cargando Jellyfin:", error); }
    };
    useEffect(() => {
        fetchJellyfinData();
    }, []);

    // 3. ESTADOS DE DESCARGA
    const [activeDownloads, setActiveDownloads] = useState({});
    const [downloadQueue, setDownloadQueue] = useState([]);
    const downloadResumables = useRef({});

    // 4. ESTADOS DE VERTƎX CONNECT
    const [isCasting, setIsCasting] = useState(false);
    const [connectedTV, setConnectedTV] = useState(null);
    const [showCastModal, setShowCastModal] = useState(false);

    // 5. ESTADOS DE MODALES
    const [showDataModal, setShowDataModal] = useState(false);
    const [showStorageModal, setShowStorageModal] = useState(false);
    const [pendingDownloadData, setPendingDownloadData] = useState(null);
    const [showVipModal, setShowVipModal] = useState(false);

    useEffect(() => {
        const setupPermissions = async () => {
            if (Platform.OS !== 'web') {
                await Notifications.requestPermissionsAsync();
                await MediaLibrary.requestPermissionsAsync();
            }
        };
        setupPermissions();
    }, []);

    // 6. GESTOR DE COLA E INMORTALIDAD DE DESCARGAS 🔥
    useEffect(() => {
        const activeCount = Object.keys(activeDownloads).length;

        // 🛡️ ESCUDO ANTI-SUEÑO: Mientras haya descargas, la app se mantiene viva y despierta
        if (Platform.OS !== 'web') {
            if (activeCount > 0) {
                activateKeepAwakeAsync();
            } else {
                deactivateKeepAwake();
            }
        }

        // Lógica de avance de cola
        if (activeCount < user.downloadLimit && downloadQueue.length > 0) {
            const nextItem = downloadQueue[0];
            setDownloadQueue(prev => prev.slice(1));
            startDownloadProcess(nextItem, nextItem.qualityStr, Platform.OS === 'web');
        }
    }, [activeDownloads, downloadQueue, user.downloadLimit]);

    // 7. EL MOTOR REAL DE DESCARGAS Y BÓVEDA OFFLINE
    const startDownloadProcess = async (movie, qualityStr, isWeb = false) => {
        setShowDataModal(false);
        const downloadId = movie.id.toString();

        if (activeDownloads[downloadId]) return;

        setActiveDownloads(prev => ({
            ...prev,
            [downloadId]: { movie, qualityStr, progress: 0 }
        }));

        if (isWeb) return;

        const finalJellyfinId = movie.jellyfin_id || (String(movie.id).startsWith('jf_') ? String(movie.id).replace('jf_', '') : null);
        const downloadUrl = finalJellyfinId
            ? `${BACKEND_URL}/api/video/${finalJellyfinId}/?audio=0&sub=-1`
            : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";

        const safeTitle = movie.title.replace(/[^a-zA-Z0-9]/g, '_');
        const fileUri = `${FileSystem.documentDirectory}${safeTitle}_${qualityStr}.mp4`;

        const callback = downloadProgress => {
            const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
            setActiveDownloads(prev => ({
                ...prev,
                [downloadId]: { ...prev[downloadId], progress: progress }
            }));
        };

        const downloadResumable = FileSystem.createDownloadResumable(downloadUrl, fileUri, {}, callback);
        downloadResumables.current[downloadId] = downloadResumable;

        try {
            const result = await downloadResumable.downloadAsync();
            if (result && result.uri) {
                // 🔥 DESCARGA COMPLETADA: GUARDAR EN MEMORIA PERMANENTE
                // 🔥 DESCARGA COMPLETADA: GUARDAR EN MEMORIA PERMANENTE
                const newCompleted = { id: movie.id, movie: movie, uri: result.uri, qualityStr, date: new Date().toISOString() };
                setCompletedDownloads(prev => [newCompleted, ...prev]);

                // 🔥 NOTIFICACIÓN DE DESCARGA LISTA
                if (Platform.OS !== 'web') {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: "✅ Descarga Completada",
                            body: `"${movie.title}" ya está lista en tu Bóveda Offline.`,
                            sound: 'default',
                        },
                        trigger: null, // Se muestra inmediatamente
                    });
                }

                setActiveDownloads(prev => {
                    const newDownloads = { ...prev };
                    delete newDownloads[downloadId];
                    return newDownloads;
                });
            }
        } catch (e) {
            console.log("Descarga cancelada", e);
        }
    };

    // 8. CANCELAR Y ELIMINAR DESCARGAS
    const cancelDownload = async (downloadId, isQueued = false) => {
        if (isQueued) {
            setDownloadQueue(prev => prev.filter(item => item.id !== downloadId));
            return;
        }

        const resumable = downloadResumables.current[downloadId];
        if (resumable) {
            try {
                await resumable.cancelAsync();
                delete downloadResumables.current[downloadId];
                setActiveDownloads(prev => {
                    const newDownloads = { ...prev };
                    delete newDownloads[downloadId];
                    return newDownloads;
                });
            } catch (e) { console.log("Error al cancelar", e); }
        }
    };

    const deleteCompletedDownload = async (id) => {
        const item = completedDownloads.find(d => d.id === id);
        if (item) {
            try { await FileSystem.deleteAsync(item.uri, { idempotent: true }); }
            catch (e) { console.log("Error borrando archivo local", e); }
        }
        setCompletedDownloads(prev => prev.filter(d => d.id !== id));
    };

    // 9. FUNCIONES DE LISTAS
    const toggleWatchlist = (movie) => { setWatchlist(prev => { const exists = prev.find(m => m.id === movie.id); if (exists) return prev.filter(m => m.id !== movie.id); return [movie, ...prev]; }); };
    const updateContinueWatching = (movie, progressValue) => { setContinueWatching(prev => { const filtered = prev.filter(m => m.id !== movie.id); return [{ ...movie, progress: progressValue }, ...filtered]; }); };
    const removeFromContinueWatching = (movieId) => { setContinueWatching(prev => prev.filter(m => m.id !== movieId)); };
    const removeFromHistory = (movieToRemove) => { setHistory(prev => prev.filter(movie => movie.id !== movieToRemove.id)); };
    const updateUserData = (newData) => { setUser(prev => ({ ...prev, ...newData })); };

    // 10. EXPORTACIÓN DEL CEREBRO
    return (
        <AppContext.Provider value={{
            isLoggedIn, setIsLoggedIn,
            isOfflineMode, // 🔥 NUEVO
            watchlist, toggleWatchlist,
            continueWatching, setContinueWatching,
            updateContinueWatching, removeFromContinueWatching,
            history, setHistory, removeFromHistory,
            user, updateUserData,
            completedDownloads, deleteCompletedDownload,
            startDownloadProcess, cancelDownload,
            attemptPlay, // 👈 ¡AQUÍ ESTÁ LA NUEVA FUNCIÓN AÑADIDA!
            activeDownloads, setActiveDownloads,
            downloadQueue, setDownloadQueue,
            jellyfinMovies, fetchJellyfinData,
            isCasting, setIsCasting,
            connectedTV, setConnectedTV,
            showCastModal, setShowCastModal,
            showVipModal, setShowVipModal
        }}>
            {children}
            <Modal visible={showDataModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { borderColor: PREMIUM_GOLD, borderWidth: 1 }]}>
                        <Ionicons name="cellular-outline" size={45} color={PREMIUM_GOLD} style={{ marginBottom: 15 }} />
                        <Text style={styles.modalTitle}>Estás usando Datos Móviles</Text>
                        <Text style={styles.modalText}>
                            La descarga del archivo consume gran cantidad de datos. Te recomendamos conectarte a Wi-Fi.
                        </Text>
                        <View style={styles.modalButtonsRow}>
                            <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => { setShowDataModal(false); Linking.openSettings(); }}>
                                <Text style={styles.modalBtnSecondaryText}>Abrir Wi-Fi</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => startDownloadProcess(pendingDownloadData.movie, pendingDownloadData.qualityStr, Platform.OS === 'web')}>
                                <Text style={styles.modalBtnPrimaryText}>Descargar igual</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showStorageModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { borderColor: '#ff4444', borderWidth: 1 }]}>
                        <Ionicons name="warning-outline" size={45} color="#ff4444" style={{ marginBottom: 15 }} />
                        <Text style={[styles.modalTitle, { color: '#ff4444' }]}>Espacio Insuficiente</Text>
                        <Text style={styles.modalText}>No tienes suficiente memoria para descargar este archivo. Libera espacio.</Text>
                        <TouchableOpacity style={[styles.modalBtnPrimary, { width: '100%', backgroundColor: '#ff4444' }]} onPress={() => setShowStorageModal(false)}>
                            <Text style={[styles.modalBtnPrimaryText, { color: '#fff' }]}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </AppContext.Provider>
    );
};

// ==========================================
// 2. COMPONENTES REUTILIZABLES
// ==========================================
const MobileHeader = ({ scrollY, heroHeight = 0 }) => {
    const { width } = useWindowDimensions();
    const { isCasting, setShowCastModal } = useContext(AppContext);
    if (width >= 768) return null;

    const backgroundOpacity = scrollY ? scrollY.interpolate({
        inputRange: [0, Math.max(1, heroHeight - 60)],
        outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,1)'],
        extrapolate: 'clamp',
    }) : 'rgba(0,0,0,1)';

    return (
        <Animated.View style={[styles.mobileHeaderInline, {
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
            backgroundColor: backgroundOpacity, paddingHorizontal: 20
        }]}>
            <View style={{ flex: 1 }} />
            <View style={{ flex: 2, alignItems: 'center' }}>
                <Text style={styles.mobileHeaderTitle}>VERTƎX</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <TouchableOpacity onPress={() => setShowCastModal(true)}>
                    <Ionicons
                        name={isCasting ? "tv" : "tv-outline"}
                        size={24}
                        color={isCasting ? PREMIUM_GOLD : "#fff"}
                    />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};



const BottomTab = ({ icon, label, active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.bottomTabItem}>
        <MaterialCommunityIcons name={icon} size={24} color={active ? '#fff' : "#777"} />
        <Text style={[styles.bottomTabText, { color: active ? '#fff' : "#777" }]}>{label}</Text>
    </TouchableOpacity>
);

// 🔥 COMPONENTE: ESQUELETO DE CARGA (SKELETON) 🔥
const SkeletonPoster = ({ isMobile }) => {
    const shimmerValue = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerValue, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
                Animated.timing(shimmerValue, { toValue: 0.3, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={[styles.posterCard, isMobile && { width: 110, height: 165 }, { backgroundColor: '#1a1a1a', opacity: shimmerValue }]} />
    );
};



const MovieList = ({ title, data, onMoviePress, isMobile, onFocusChange }) => {
    const isReady = data && data.length > 0;
    const renderData = isReady ? data : [1, 2, 3, 4, 5];

    return (
        <View style={styles.carouselContainer}>
            <Text style={[styles.sectionTitle, isMobile && { marginLeft: 15 }]}>{title}</Text>
            <FlatList
                horizontal
                data={renderData}
                keyExtractor={(item, index) => isReady ? `${item.id}-${index}` : `skel-${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.flatListContent, isMobile && { paddingLeft: 15, paddingRight: 15 }]}
                initialNumToRender={isMobile ? 4 : 7}
                maxToRenderPerBatch={isMobile ? 4 : 7}
                windowSize={3}
                removeClippedSubviews={true}
                updateCellsBatchingPeriod={50}
                renderItem={({ item }) => (
                    isReady ? <FocusableMovieCard movie={item} isMobile={isMobile} onPress={onMoviePress} onFocusChange={onFocusChange} /> : <SkeletonPoster isMobile={isMobile} />
                )}
            />
        </View>
    );
};





const GenreList = ({ title, data, isMobile, onGenrePress }) => (
    <View style={styles.carouselContainer}>
        <Text style={[styles.sectionTitle, isMobile && { marginLeft: 15 }]}>{title}</Text>
        <FlatList horizontal data={data} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.flatListContent, isMobile && { paddingLeft: 15, paddingRight: 15 }]}
            renderItem={({ item }) => (
                <TouchableOpacity style={[styles.genreCard, isMobile && { width: 160, height: 90 }]} onPress={() => onGenrePress(item.name)}>
                    <ImageBackground source={{ uri: item.bgImage }} style={styles.genreImage}>
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.genreGradient}>
                            <Text style={styles.genreTitleText}>{item.name}</Text>
                        </LinearGradient>
                    </ImageBackground>
                </TouchableOpacity>
            )}
        />
    </View>
);

const FilterPill = ({ label, active, onPress }) => (
    <TouchableOpacity style={[styles.filterPill, active && styles.filterPillActive]} onPress={onPress}>
        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
    </TouchableOpacity>
);

const MobileBottomBar = ({ currentRoute }) => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    if (width >= 768) return null;

    return (
        <View style={styles.mobileBarPinned}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />

            <View style={styles.mobileBarItems}>
                <BottomTab icon="home-variant" label="Inicio" active={currentRoute === 'Inicio'} onPress={() => navigation.navigate('Inicio')} />
                <BottomTab icon="play-box-outline" label="Bóveda" active={currentRoute === 'Mi Espacio'} onPress={() => navigation.navigate('Mi Espacio')} />

                {/* La TV en el centro */}
                <BottomTab icon="television-play" label="TV" active={currentRoute === 'TV en Vivo'} onPress={() => navigation.navigate('TV en Vivo')} />

                {/* 🔥 ¡AQUÍ REGRESA LA LUPA! 🔥 */}
                <BottomTab icon="compass-outline" label="Descubrir" active={currentRoute === 'Buscar'} onPress={() => navigation.navigate('Buscar')} />

                <BottomTab icon="account-circle-outline" label="Usuario" active={currentRoute === 'Usuario'} onPress={() => navigation.navigate('Usuario')} />
            </View>
        </View>
    );
};
// 🔥 NUEVO COMPONENTE: ESTADO VACÍO INMERSIVO (CERO BORDES) 🔥
const EmptyState = ({ icon, title, message, buttonText, onAction }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 20 }}>
        {/* Ícono gigante difuminado en el fondo */}
        <View style={{ position: 'absolute', opacity: 0.03, transform: [{ scale: 2.5 }] }}>
            <Ionicons name={icon} size={150} color="#fff" />
        </View>
        <Ionicons name={icon} size={50} color="#333" style={{ marginBottom: 15 }} />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>{title}</Text>
        <Text style={{ color: '#666', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 25 }}>{message}</Text>
        {buttonText && onAction && (
            <TouchableOpacity style={{ backgroundColor: 'rgba(193, 145, 95, 0.1)', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30 }} onPress={onAction}>
                <Text style={{ color: PREMIUM_GOLD, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }}>{buttonText}</Text>
            </TouchableOpacity>
        )}
    </View>
);

const FocusableMovieCard = ({ movie, isMobile, onPress, onFocusChange, customStyle, forceWidth, forceHeight }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [imgError, setImgError] = useState(false);
    const { width } = useWindowDimensions();

    const handleFocus = () => {
        setIsFocused(true);
        if (onFocusChange && !isMobile) onFocusChange(movie);
    };
    const handleBlur = () => setIsFocused(false);

    const dynamicWidth = isMobile ? (width - 50) / 3 : 130;
    const dynamicHeight = dynamicWidth * 1.5;

    return (
        <View style={[{ width: forceWidth || dynamicWidth, marginRight: 10, marginBottom: 15 }, customStyle]}>
            <Pressable
                // 🔥 CONFIGURACIÓN NATIVA PARA TV 🔥
                focusable={true}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onPress={() => onPress && onPress(movie)}

                // Animación de hundimiento al presionar (Feedback táctil y de control)
                style={({ pressed }) => [
                    styles.posterCard,
                    { width: '100%', height: forceHeight || dynamicHeight, backgroundColor: 'transparent' },
                    isFocused && {
                        borderColor: PREMIUM_GOLD,
                        borderWidth: 3,
                        transform: [{ scale: 1.1 }], // El póster crece más en TV al enfocarlo
                        zIndex: 50,
                        elevation: 20, // Sombra profunda en Android TV
                    },
                    pressed && { transform: [{ scale: 0.95 }] }
                ]}
            >
                <ExpoImage
                    source={{ uri: imgError || !movie.thumb ? movie.tmdbThumb : movie.thumb }}
                    style={styles.posterImage}
                    contentFit="cover"
                    transition={300}
                    onError={() => setImgError(true)}
                />

                {/* Resplandor dorado interno solo cuando está enfocado */}
                {isFocused && (
                    <LinearGradient
                        colors={['rgba(193, 145, 95, 0.4)', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                    />
                )}
            </Pressable>
            <Text style={{ color: isFocused ? '#fff' : '#aaa', fontSize: 11, marginTop: 6, textAlign: 'center', fontWeight: isFocused ? 'bold' : '500' }} numberOfLines={1}>
                {movie.title}
            </Text>
        </View>
    );
};

const FilteredGridView = ({ movies, onMoviePress, isMobile }) => {
    const { width } = useWindowDimensions();
    if (!movies || !Array.isArray(movies) || movies.length === 0) {
        return <EmptyState icon="film-outline" title="BÓVEDA VACÍA" message="No se encontraron títulos con estos filtros. Intenta explorar otras categorías." />;
    }

    // Forzamos el ancho para que la cuadrícula siempre tenga 3 perfectos
    const itemWidth = isMobile ? (width - 50) / 3 : 140;

    return (
        <View style={[styles.gridContainer, isMobile && { justifyContent: 'flex-start', gap: 10 }]}>
            {movies.map((movie, index) => (
                <FocusableMovieCard
                    key={`grid-${movie.id}-${index}`}
                    movie={movie}
                    isMobile={isMobile}
                    onPress={onMoviePress}
                    forceWidth={itemWidth}
                    forceHeight={itemWidth * 1.5}
                    customStyle={{ marginRight: 0, marginBottom: 20 }}
                />
            ))}
        </View>
    );
};

const ContinueWatchingCard = ({ item, onMoviePress, isMobile, onRemove }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [imgError, setImgError] = useState(false);

    return (
        <Pressable
            style={[styles.cwCard, isMobile && { width: 220, height: 124 }, isFocused && { borderColor: PREMIUM_GOLD, borderWidth: 3, transform: [{ scale: 1.05 }], zIndex: 10 }]}
            onPress={() => onMoviePress && onMoviePress(item)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        >
            <ExpoImage
                source={{ uri: imgError || !item.bgImage ? item.tmdbBg : item.bgImage }}
                style={styles.cwImage}
                contentFit="cover"
                transition={300}
                onError={() => setImgError(true)}
            />
            {isFocused && <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(193,145,95,0.2)' }} pointerEvents="none" />}

            {isMobile && (
                <TouchableOpacity style={styles.closeCwBtn} onPress={() => onRemove(item.id)}>
                    <Ionicons name="close" size={18} color="#fff" />
                </TouchableOpacity>
            )}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${item.progress * 100}%` }]} />
            </View>
        </Pressable>
    );
};

const ExpandingPoster = ({ movie, isActive, onPress, isMobile }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{ width: isActive ? 280 : 80, height: isActive ? 400 : 300, marginHorizontal: 8, borderRadius: 12, overflow: 'hidden', borderWidth: isActive ? 2 : 0, borderColor: '#c1915f', transition: 'all 0.3s ease' }}
        >
            <ExpoImage
                source={{ uri: imgError || !movie.thumb ? movie.tmdbThumb : movie.thumb }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={300}
                onError={() => setImgError(true)}
            />
            {!isActive && <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' }} />}
        </TouchableOpacity>
    );
};

const MobileCategoryButtons = ({ navigation }) => {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 15, marginBottom: 25, flexWrap: 'wrap', gap: 10 }}>
            {[
                { title: 'Pelis', icon: 'film-outline', route: 'Películas' },
                { title: 'Series', icon: 'tv-outline', route: 'Serie' },
                { title: 'Novelas', icon: 'heart-outline', route: 'Novelas' },
                { title: 'Anime', icon: 'color-palette-outline', route: 'Animes' }
            ].map((item) => (
                <TouchableOpacity
                    key={item.title}
                    style={{
                        width: '22%', alignItems: 'center', backgroundColor: '#111', borderRadius: 8,
                        paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(193, 145, 95, 0.3)'
                    }}
                    onPress={() => navigation.navigate(item.route)}
                >
                    <Ionicons name={item.icon} size={22} color="#c1915f" />
                    <Text style={{ color: '#fff', fontSize: 10, marginTop: 5, fontWeight: 'bold' }}>{item.title}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const ContinueWatchingList = ({ title, data, onMoviePress, isMobile, onRemoveItem, onViewAll }) => (
    <View style={styles.carouselContainer}>
        <View style={[styles.titleRow, isMobile && { paddingHorizontal: 15 }]}>
            <TouchableOpacity onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.sectionTitle, isMobile && { marginLeft: 0 }]}>{title}</Text>
                <Ionicons name="chevron-forward" size={22} color={PREMIUM_GOLD} style={{ marginLeft: 10 }} />
            </TouchableOpacity>
        </View>
        <FlatList
            horizontal
            data={data}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.flatListContent, isMobile && { paddingLeft: 15, paddingRight: 15 }]}

            // 🔥 FRENOS DE MEMORIA RAM (VIRTUALIZACIÓN EXTREMA) 🔥
            initialNumToRender={isMobile ? 3 : 5}
            maxToRenderPerBatch={isMobile ? 3 : 5}
            windowSize={3}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}

            renderItem={({ item }) => (
                <ContinueWatchingCard
                    item={item}
                    onMoviePress={onMoviePress}
                    isMobile={isMobile}
                    onRemove={onRemoveItem}
                />
            )}
        />
    </View>
);

const BatteryOptimizationModal = ({ visible, onClose }) => (
    <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <Ionicons name="battery-charging-outline" size={40} color={PREMIUM_GOLD} style={{ marginBottom: 15 }} />
                <Text style={styles.modalTitle}>Aviso de Rendimiento</Text>
                <Text style={styles.modalText}>Para garantizar que tus descargas en segundo plano no sean interrumpidas, te recomendamos desactivar la optimización de batería para VERTƎX.</Text>
                <View style={styles.modalButtonsRow}>
                    <TouchableOpacity style={styles.modalBtnSecondary} onPress={onClose}><Text style={styles.modalBtnSecondaryText}>Más tarde</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => { onClose(); if (Platform.OS !== 'web') Linking.openSettings(); }}>
                        <Text style={styles.modalBtnPrimaryText}>Optimizar ahora</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

const QualitySelectorModal = ({ visible, onClose, onSelect, actionType, movie }) => {
    let availableQualities = [];
    if (movie?.qualities && Array.isArray(movie.qualities)) availableQualities = movie.qualities;
    else if (movie?.quality) availableQualities = [movie.quality];
    else availableQualities = ['1080p (Original)'];

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={styles.qualityModalOverlay}>
                <View style={styles.qualityModalBox}>
                    <Text style={styles.qualityModalTitle}>
                        {actionType === 'download' ? 'DESCARGAR' : 'SELECCIONAR CALIDAD'}
                    </Text>
                    <Text style={styles.qualityModalText}>
                        {actionType === 'download'
                            ? 'Selecciona la versión original para descargar al dispositivo.'
                            : 'Disponible para reproducción directa.'}
                    </Text>

                    {availableQualities.map((qualityStr, index) => {
                        const is4K = qualityStr.toUpperCase().includes('4K');
                        return (
                            <TouchableOpacity key={index} style={styles.qualityBtnPrimary} onPress={() => onSelect(qualityStr)}>
                                <Ionicons name={is4K ? 'flash' : 'tv-outline'} size={20} color="#000" style={{ marginRight: 10 }} />
                                <Text style={styles.qualityBtnPrimaryText}>{qualityStr}</Text>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity style={{ marginTop: 20 }} onPress={onClose}>
                        <Text style={{ color: PREMIUM_GOLD, fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>CANCELAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
// 🔥 MODAL: REANUDAR REPRODUCCIÓN (SOPORTE TV, WEB Y MÓVIL) 🔥
const ResumeModal = ({ visible, onClose, onResume, onRestart, onChangeQuality, progress }) => (
    <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.qualityModalOverlay}>
            <View style={styles.qualityModalBox}>
                <Ionicons name="play-circle-outline" size={45} color={PREMIUM_GOLD} style={{ alignSelf: 'center', marginBottom: 15 }} />
                <Text style={styles.qualityModalTitle}>CONTINUAR VIENDO</Text>
                <Text style={styles.qualityModalText}>Te quedaste en el {Math.round(progress * 100)}%. ¿Qué deseas hacer?</Text>

                <TouchableOpacity style={styles.qualityBtnPrimary} onPress={onResume}>
                    <Ionicons name="play" size={19} color="#000" style={{ marginRight: 10 }} />
                    <Text style={styles.qualityBtnPrimaryText}>Reanudar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.qualityBtnSecondary, { marginTop: 10 }]} onPress={onRestart}>
                    <Ionicons name="refresh" size={19} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.qualityBtnSecondaryText}>Empezar de cero</Text>
                </TouchableOpacity>

                {/* 🔥 AHORA ES EL BOTÓN DE CAMBIAR CALIDAD 🔥 */}
                {onChangeQuality && (
                    <TouchableOpacity style={[styles.qualityBtnSecondary, { marginTop: 10, borderColor: 'transparent' }]} onPress={onChangeQuality}>
                        <Ionicons name="options-outline" size={19} color="#888" style={{ marginRight: 10 }} />
                        <Text style={[styles.qualityBtnSecondaryText, { color: '#888' }]}>Cambiar Calidad</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={{ marginTop: 25 }} onPress={onClose}>
                    <Text style={{ color: PREMIUM_GOLD, fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>CANCELAR</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

// 🔥 MODAL: EL MURO DE PAGO VIP (DISEÑO FREEMIUM ELEGANTE) 🔥
const VipLockModal = () => {
    const { showVipModal, setShowVipModal, updateUserData } = useContext(AppContext);
    const [pinInput, setPinInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPinBox, setShowPinBox] = useState(false); // 👈 Controla si mostramos botones o el input

    if (!showVipModal) return null;

    const handleRedeem = async () => {
        if (pinInput.trim().length < 6) { Alert.alert("Aviso", "El código debe tener al menos 6 caracteres."); return; }
        setIsLoading(true);
        try {
            // Extraemos la Huella del Dispositivo
            let hwId = 'web-visitor';
            if (Platform.OS === 'android') hwId = Application.androidId;
            else if (Platform.OS === 'ios') hwId = await Application.getIosIdForVendorAsync();
            else hwId = await AsyncStorage.getItem('vertex_web_id') || 'web-visitor';

            const token = Platform.OS === 'web' ? await AsyncStorage.getItem('vertex_access') : await SecureStore.getItemAsync('vertex_access');
            const response = await fetch(`${BACKEND_URL}/api/canjear-pin/`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ pin: pinInput, device_id: hwId }) // 🔥 AQUÍ ENVIAMOS LA HUELLA
            });
            const data = await response.json();

            if (response.ok && data.status === "success") {
                Alert.alert("¡Bienvenido a VERTƎX VIP!", data.message);
                updateUserData({ vipDays: data.vip_days_left, isVip: true });
                setShowVipModal(false); setPinInput(''); setShowPinBox(false);
            } else {
                Alert.alert("Error de Código", data.message || "Este código no existe o ya fue usado por alguien más.");
            }
        } catch (e) { Alert.alert("Error", "Servidor no responde. Revisa tu conexión."); }
        finally { setIsLoading(false); }
    };

    return (
        <Modal visible={showVipModal} transparent={true} animationType="slide">
            {/* Efecto de cristal ultra oscuro para sumergir al usuario */}
            <BlurView intensity={90} tint="dark" style={styles.qualityModalOverlay}>
                <View style={[styles.qualityModalBox, { padding: 35, width: '90%', maxWidth: 420, backgroundColor: '#050505', borderColor: 'rgba(193, 145, 95, 0.4)', borderWidth: 1 }]}>

                    <Ionicons name="diamond" size={60} color={PREMIUM_GOLD} style={{ alignSelf: 'center', marginBottom: 15 }} />
                    <Text style={[styles.qualityModalTitle, { fontSize: 26, fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', letterSpacing: 1 }]}>LÍMITE DIARIO ALCANZADO</Text>
                    <Text style={[styles.qualityModalText, { fontSize: 14, lineHeight: 22, color: '#ccc', marginBottom: 30 }]}>
                        Has disfrutado tus 2 contenidos gratuitos de hoy. Pásate a VIP para obtener acceso ilimitado, descargas offline y máxima calidad.
                    </Text>

                    {!showPinBox ? (
                        <View style={{ width: '100%' }}>
                            <TouchableOpacity style={[styles.authBtnPrimary, { height: 60, marginBottom: 15 }]} onPress={() => Linking.openURL("https://vertex-vex.netlify.app/checkout.html")}>
                                <Text style={[styles.authBtnPrimaryText, { fontSize: 16 }]}>DESBLOQUEAR ACCESO VIP</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.qualityBtnSecondary, { height: 50, borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setShowPinBox(true)}>
                                <Ionicons name="gift-outline" size={18} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.qualityBtnSecondaryText}>Tengo un código de regalo</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ width: '100%', animation: 'fade' }}>
                            <View style={[styles.authInputWrapper, { backgroundColor: '#111' }]}>
                                <Ionicons name="keypad-outline" size={20} color={PREMIUM_GOLD} style={styles.authInputIcon} />
                                <TextInput
                                    style={[styles.authInput, { textTransform: 'uppercase', color: PREMIUM_GOLD, fontWeight: 'bold' }]}
                                    placeholder="INGRESA TU CÓDIGO" placeholderTextColor="#666"
                                    value={pinInput} onChangeText={setPinInput} autoCapitalize="characters"
                                />
                            </View>
                            <TouchableOpacity style={[styles.authBtnPrimary, isLoading && { opacity: 0.7 }]} onPress={handleRedeem} disabled={isLoading}>
                                {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.authBtnPrimaryText}>CANJEAR AHORA</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={{ marginTop: 20, alignSelf: 'center' }} onPress={() => setShowPinBox(false)}>
                                <Text style={{ color: '#888', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Volver atrás</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity style={{ marginTop: 40 }} onPress={() => { setShowVipModal(false); setShowPinBox(false); }}>
                        <Text style={{ color: '#555', fontSize: 11, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 }}>CERRAR Y VOLVER AL CATÁLOGO</Text>
                    </TouchableOpacity>
                </View>
            </BlurView>
        </Modal>
    );
};

const LegalModal = ({ visible, onClose }) => (
    <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={[styles.qualityModalBox, { height: '85%', padding: 20, width: '90%' }]}>
                <Ionicons name="shield-checkmark" size={40} color={PREMIUM_GOLD} style={{ alignSelf: 'center', marginBottom: 10 }} />
                <Text style={styles.qualityModalTitle}>TÉRMINOS DE SERVICIO (EULA) Y AVISO DMCA</Text>
                <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1, marginVertical: 15, paddingRight: 10 }}>

                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>1. NATURALEZA DEL SERVICIO Y HERRAMIENTA NEUTRAL</Text>
                    <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15, lineHeight: 18, textAlign: 'justify' }}>
                        VERTƎX es estrictamente una "Herramienta de Búsqueda Neutral" y un reproductor multimedia. La aplicación funciona de manera idéntica a un navegador web estándar, limitándose a leer, interpretar e indexar metadatos y enlaces proporcionados por los propios usuarios o extraídos de servidores públicos o privados de terceros (ej. Google Drive, MEGA, servidores personales Jellyfin/Emby). VERTƎX NO aloja, copia, distribuye, almacena ni transmite ningún archivo multimedia protegido por derechos de autor en sus propios servidores. La aplicación se distribuye "vacía" de contenido.
                    </Text>

                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>2. EXENCIÓN DE RESPONSABILIDAD DE API Y MARCAS REGISTRADAS</Text>
                    <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15, lineHeight: 18, textAlign: 'justify' }}>
                        Esta aplicación utiliza la API de TMDB (The Movie Database) para mostrar carátulas y metadatos visuales, pero no está avalada ni certificada por TMDB. Asimismo, los logotipos de plataformas de streaming (ej. Netflix, Disney+, Prime Video) mostrados en la interfaz se utilizan exclusivamente bajo el principio de "Uso Justo" (Fair Use) para la categorización del contenido por parte del usuario. VERTƎX no tiene afiliación, patrocinio, ni acuerdos comerciales con dichas entidades.
                    </Text>

                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>3. POLÍTICA DMCA Y REPORTE DE ABUSOS (SAFE HARBOR)</Text>
                    <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15, lineHeight: 18, textAlign: 'justify' }}>
                        En cumplimiento con la Digital Millennium Copyright Act (17 U.S.C. § 512), VERTƎX opera como un "Online Service Provider". Si usted es titular de derechos de autor, envíe una Notificación DMCA a legal@vertex.app incluyendo: firma, URL exacta del material dentro del sistema, información de contacto, y declaración bajo pena de perjurio. Eliminaremos el acceso a los enlaces indexados infractores. Nos reservamos el derecho de cancelar cuentas de infractores recurrentes.
                    </Text>

                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>4. RESPONSABILIDAD GEOGRÁFICA Y CONTROL PARENTAL</Text>
                    <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15, lineHeight: 18, textAlign: 'justify' }}>
                        El usuario es el único responsable de conocer y acatar las leyes de telecomunicaciones y derechos de autor de su país de residencia. VERTƎX se deslinda de cualquier uso de la herramienta en territorios donde el streaming de ciertos orígenes esté penado. La app es para mayores de 18 años; los menores requieren supervisión estricta. VERTƎX no clasifica el contenido externo y no se hace responsable por la visualización de material explícito o no apto.
                    </Text>

                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>5. CLÁUSULA DE INDEMNIDAD (ACUERDO DE USUARIO FINAL)</Text>
                    <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15, lineHeight: 18, textAlign: 'justify' }}>
                        Al utilizar VERTƎX, el usuario acepta de manera irrevocable proteger, indemnizar y liberar a los desarrolladores, creadores y asociados de VERTƎX de toda responsabilidad frente a cualquier demanda, pérdida, costo, daño o gasto legal derivado del contenido que el usuario decida indexar, reproducir o descargar a través de la aplicación.
                    </Text>
                </ScrollView>
                <TouchableOpacity style={styles.qualityBtnPrimary} onPress={onClose}>
                    <Text style={styles.qualityBtnPrimaryText}>ENTIENDO MI RESPONSABILIDAD Y ACEPTO</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

const PrivacyModal = ({ visible, onClose }) => (
    <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={[styles.qualityModalBox, { height: '80%', padding: 20, width: '90%' }]}>
                <Ionicons name="lock-closed" size={40} color={PREMIUM_GOLD} style={{ alignSelf: 'center', marginBottom: 10 }} />
                <Text style={styles.qualityModalTitle}>POLÍTICA DE PRIVACIDAD</Text>
                <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1, marginVertical: 15, paddingRight: 10 }}>
                    <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15, lineHeight: 18, textAlign: 'justify' }}>
                        Esta Política de Privacidad describe exhaustivamente cómo VERTƎX recopila, procesa y protege la información de los usuarios, cumpliendo con los estándares de protección de datos aplicables.
                    </Text>

                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>1. Recolección de Datos Técnicos y UUID</Text>
                    <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15, lineHeight: 18, textAlign: 'justify' }}>
                        VERTƎX recopila información técnica estrictamente necesaria para el funcionamiento del servicio. Esto incluye identificadores únicos de dispositivo (UUID / Vendor ID), modelo del dispositivo, y sistema operativo. Esta información se utiliza de forma algorítmica para el Control de Acceso, evitando el uso compartido no autorizado de cuentas y limitando el ecosistema a los dispositivos contratados.
                    </Text>

                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>2. No Comercialización de Datos (Zero-Sell Policy)</Text>
                    <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15, lineHeight: 18, textAlign: 'justify' }}>
                        Garantizamos enfáticamente que VERTƎX no vende, alquila, transfiere ni distribuye su información personal, historial de visualización, o identificadores de hardware a terceros para fines publicitarios, de marketing o minería de datos.
                    </Text>

                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>3. Enlaces y Servidores de Terceros</Text>
                    <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15, lineHeight: 18, textAlign: 'justify' }}>
                        Dado que la aplicación extrae datos multimedia de servidores de terceros, la conexión a dichos servidores expondrá su dirección IP a esas entidades. VERTƎX no tiene control sobre las políticas de retención de IP de estos proveedores externos. Recomendamos el uso de redes seguras.
                    </Text>

                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>4. Eliminación y Derechos del Usuario</Text>
                    <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15, lineHeight: 18, textAlign: 'justify' }}>
                        El usuario tiene el derecho inalienable de solicitar la eliminación permanente de su cuenta y de todos los registros técnicos (UUID) asociados a la misma de nuestros sistemas de autenticación en cualquier momento.
                    </Text>
                </ScrollView>
                <TouchableOpacity style={styles.qualityBtnPrimary} onPress={onClose}>
                    <Text style={styles.qualityBtnPrimaryText}>ACEPTAR POLÍTICAS</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

const LicensesModal = ({ visible, onClose }) => (
    <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={[styles.qualityModalBox, { height: '70%', padding: 20, width: '90%' }]}>
                <Ionicons name="document-text" size={40} color={PREMIUM_GOLD} style={{ alignSelf: 'center', marginBottom: 10 }} />
                <Text style={styles.qualityModalTitle}>LICENCIAS DE CÓDIGO ABIERTO</Text>
                <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1, marginVertical: 15, paddingRight: 10 }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>VideoLAN: LibVLC Android</Text>
                    <Text style={{ color: '#888', fontSize: 11, marginBottom: 15 }}>Copyright (C) 2016 VideoLAN. Licensed under LGPL v2.1. Apache commons Library (Apache-2.0).</Text>

                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>ExoPlayer / AndroidX Media3</Text>
                    <Text style={{ color: '#888', fontSize: 11, marginBottom: 15 }}>Copyright (c) 2014-present Google LLC. Apache License Version 2.0.</Text>

                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>React Native Framework</Text>
                    <Text style={{ color: '#888', fontSize: 11, marginBottom: 15 }}>MIT License. Copyright (c) Meta Platforms, Inc. and affiliates.</Text>

                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Expo SDK & Modules</Text>
                    <Text style={{ color: '#888', fontSize: 11, marginBottom: 15 }}>MIT License. Standard Apache 2.0. Copyright (c) 650 Industries, Inc.</Text>
                </ScrollView>
                <TouchableOpacity style={styles.qualityBtnPrimary} onPress={onClose}>
                    <Text style={styles.qualityBtnPrimaryText}>CERRAR</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);
// ==========================================
// 3. REPRODUCTOR DE VIDEO (MOTOR HÍBRIDO PREMIUM)
// ==========================================
function VideoPlayerScreen({ route, navigation }) {
    const { updateContinueWatching, setShowCastModal, removeFromContinueWatching } = useContext(AppContext);
    // 🔥 Recibimos seriesData
    const { movie, seriesData, startAt = 0, selectedQuality } = route.params;

    const finalJellyfinId = movie?.jellyfin_id || (String(movie?.id).startsWith('jf_') ? String(movie.id).replace('jf_', '') : movie?.id);

    // Leemos qué idioma y subtítulo quiere el usuario
    const audioIndex = selectedAudio.value !== undefined ? selectedAudio.value : (movie.audioTracks?.find(a => a.isDefault)?.index ?? 0);
    const subIndex = selectedSub.type === 'disabled' ? -1 : selectedSub.value;

    // Pasamos por el Proxy de Django
    const streamUrl = `${BACKEND_URL}/api/video/${finalJellyfinId}/?audio=${audioIndex}&sub=${subIndex}`;
    const { width, height } = useWindowDimensions();
    const isMobile = width < 768;

    const videoRef = useRef(null);
    const timeoutRef = useRef(null);
    const hideGestureTimer = useRef(null);
    const lastUIUpdateTime = useRef(0);

    // 🔥 FIX 1: LIMPIEZA Y ROTACIÓN AUTOMÁTICA DE PANTALLA
    useEffect(() => {
        // 1. Acostar la pantalla al entrar al reproductor
        if (Platform.OS !== 'web') {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }

        return () => {
            // 2. Volver a vertical al salir
            if (Platform.OS !== 'web') {
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            }
            // 3. Limpieza de memoria (tu código actual)
            if (videoRef.current) {
                if (Platform.OS === 'web') {
                    videoRef.current.pause();
                    videoRef.current.removeAttribute('src');
                    videoRef.current.load();
                } else {
                    videoRef.current.pauseAsync && videoRef.current.pauseAsync();
                }
            }
            setStatus(prev => ({ ...prev, isPlaying: false }));
        };
    }, []);

    const [showControls, setShowControls] = useState(true);
    const [status, setStatus] = useState({ isPlaying: true, isBuffering: true, duration: 0, currentTime: 0 });
    const [isLocked, setIsLocked] = useState(false);

    // 🔥 NUEVO: Estados para UX de TV y Arrastre 🔥
    const [scrubbingTime, setScrubbingTime] = useState(null);
    const statusRef = useRef(status);
    useEffect(() => { statusRef.current = status; }, [status]);

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const fadeVolumeAnim = useRef(new Animated.Value(0)).current;
    const fadeBrightnessAnim = useRef(new Animated.Value(0)).current;

    const resizeModes = ['contain', 'cover', 'stretch', 'none'];
    const [resizeModeIndex, setResizeModeIndex] = useState(0);
    const [isPip, setIsPip] = useState(false);
    const [showNextEpisodeBtn, setShowNextEpisodeBtn] = useState(false);

    const defaultAudio = movie.audioTracks?.find(a => a.isDefault)?.index ?? 0;
    const defaultSub = -1;
    const [availableAudioTracks, setAvailableAudioTracks] = useState([]);
    const [availableTextTracks, setAvailableTextTracks] = useState([]);
    const [selectedAudio, setSelectedAudio] = useState({ type: 'index', value: defaultAudio });
    const [selectedSub, setSelectedSub] = useState({ type: 'disabled' });
    const [menuAudioTrack, setMenuAudioTrack] = useState(defaultAudio);
    const [menuSubTrack, setMenuSubTrack] = useState(defaultSub);
    const [showTracksModal, setShowTracksModal] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState('audio');

    const [volumeLevel, setVolumeLevel] = useState(1);
    const [brightnessLevel, setBrightnessLevel] = useState(1);
    const [showVolumeUI, setShowVolumeUI] = useState(false);
    const [showBrightnessUI, setShowBrightnessUI] = useState(false);
    const initialVolume = useRef(1);
    const initialBrightness = useRef(1);
    const lastTapRef = useRef({ time: 0, side: null });

    // 🔥 FIX 2: SE ELIMINÓ EL REQUIRE DE PANRESPONDER QUE DESTRUÍA LA RAM AQUÍ

    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key || '';
            const code = e.keyCode || 0;

            if (key === 'ArrowRight' || code === 22) { skip(10); setShowControls(true); }
            else if (key === 'ArrowLeft' || code === 21) { skip(-10); setShowControls(true); }
            else if (key === ' ' || key === 'Enter' || code === 23 || code === 66) {
                togglePlayPause();
                setShowControls(true);
            }
            else if (key === 'Escape' || code === 4) { navigation.goBack(); }
        };

        // Le quitamos el "|| Platform.OS === 'android'" porque Android no usa 'window'
        if (Platform.OS === 'web') {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [status]);

    const resetControlsTimer = () => {
        if (isLocked) return;
        setShowControls(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setShowControls(false));
        }, 5000);
    };

    const handleScreenTouch = () => {
        if (isLocked) return;
        if (showControls) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShowControls(false));
        } else { resetControlsTimer(); }
    };

    const handleTap = (side) => {
        const now = Date.now();
        if (now - lastTapRef.current.time < 300 && lastTapRef.current.side === side) {
            if (side === 'left') skip(-10);
            else if (side === 'right') skip(10);
            else togglePlayPause();
            lastTapRef.current.time = 0;
        } else {
            handleScreenTouch();
            lastTapRef.current = { time: now, side };
        }
    };

    // 🔥 FIX 3: COMANDO DE ADELANTO SEGURO (Reemplaza el .seek que rompía la app)
    const skip = async (secs) => {
        if (videoRef.current) {
            const newTime = Math.max(0, Math.min(statusRef.current.duration, statusRef.current.currentTime + secs));
            setStatus(p => ({ ...p, currentTime: newTime, isBuffering: true }));

            if (Platform.OS === 'web') {
                videoRef.current.currentTime = newTime;
            } else {
                await videoRef.current.setPositionAsync(newTime * 1000);
            }
        }
        resetControlsTimer();
    };

    const togglePlayPause = () => { setStatus(p => ({ ...p, isPlaying: !p.isPlaying })); resetControlsTimer(); };
    const toggleCrop = () => { resetControlsTimer(); setResizeModeIndex((prev) => (prev + 1) % resizeModes.length); };

    const handlePiP = () => {
        resetControlsTimer();
        setIsPip(true);
        if (Platform.OS === 'android') ToastAndroid.show("Pantalla flotante lista. Desliza al inicio.", ToastAndroid.LONG);
    };

    const openAudioTracks = () => {
        resetControlsTimer();
        setMenuAudioTrack(selectedAudio.value || 0);
        setActiveModalTab('audio');
        setShowTracksModal(true);
    };

    const openSubTracks = () => {
        resetControlsTimer();
        setMenuSubTrack(selectedSub.type === 'disabled' ? -1 : (selectedSub.value || -1));
        setActiveModalTab('subtitles');
        setShowTracksModal(true);
    };

    const aplicarCambios = () => {
        // Guardamos el tiempo exacto para que el video retome donde se quedó al recargar
        if (statusRef.current.duration > 0) {
            movie.progress = statusRef.current.currentTime / statusRef.current.duration;
        }

        if (activeModalTab === 'audio') setSelectedAudio({ type: 'index', value: menuAudioTrack });
        else setSelectedSub(menuSubTrack === -1 ? { type: 'disabled' } : { type: 'index', value: menuSubTrack });

        setShowTracksModal(false);
        resetControlsTimer();
    };

    const startHideGestureUITimer = () => {
        if (hideGestureTimer.current) clearTimeout(hideGestureTimer.current);
        hideGestureTimer.current = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeVolumeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
                Animated.timing(fadeBrightnessAnim, { toValue: 0, duration: 400, useNativeDriver: true })
            ]).start(() => {
                setShowVolumeUI(false);
                setShowBrightnessUI(false);
            });
            resetControlsTimer();
        }, 1500);
    };

    const onLoad = (data) => {
        // 🔥 FIX 4: AJUSTE DE TIEMPO MILISEGUNDOS VS SEGUNDOS
        const durationSecs = Platform.OS === 'web' ? data.duration : data.durationMillis / 1000;
        if (data.audioTracks && data.audioTracks.length > 0) setAvailableAudioTracks(data.audioTracks);
        if (data.textTracks && data.textTracks.length > 0) setAvailableTextTracks(data.textTracks);
        setStatus(p => ({ ...p, duration: durationSecs, isBuffering: false }));

        if (movie.progress && movie.progress > 0) {
            const startPos = durationSecs * movie.progress;
            if (Platform.OS === 'web') videoRef.current.currentTime = startPos;
            else videoRef.current.setPositionAsync(startPos * 1000);
        } else if (startAt > 0) {
            if (Platform.OS === 'web') videoRef.current.currentTime = startAt;
            else videoRef.current.setPositionAsync(startAt * 1000);
        }
    };

    const onProgress = (data) => {
        const now = Date.now();
        if (now - lastUIUpdateTime.current > 1000) {
            const currentSecs = Platform.OS === 'web' ? data.currentTime : data.positionMillis / 1000;
            setStatus(p => ({ ...p, currentTime: currentSecs }));
            lastUIUpdateTime.current = now;
            const progressVal = currentSecs / status.duration;

            if (progressVal > 0.02 && progressVal < 0.95) {
                updateContinueWatching(movie, progressVal);
            }

            if (progressVal > 0.90 && (movie.type === 'series' || movie.isAnime || movie.isNovel || movie.type === 'episode')) {
                setShowNextEpisodeBtn(true);
            } else {
                setShowNextEpisodeBtn(false);
            }

            if (progressVal > 0.98) {
                handleVideoEnd();
            }
        }
    };

    const handleVideoEnd = () => {
        const finalId = movie?.jellyfin_id || movie?.id;

        if (movie.type === 'movie' && !movie.isAnime && !movie.isNovel) {
            if (Platform.OS === 'android') ToastAndroid.show("Película terminada.", ToastAndroid.SHORT);
            navigation.goBack();
            return;
        }

        if (movie.type === 'episode' && seriesData && seriesData.seasonsData) {
            let nextEp = null;
            let foundCurrent = false;

            for (const season of seriesData.seasonsData) {
                for (const ep of season.episodes) {
                    if (foundCurrent) {
                        nextEp = ep;
                        break;
                    }
                    if (ep.id === movie.id) foundCurrent = true;
                }
                if (nextEp) break;
            }

            if (nextEp) {
                if (Platform.OS === 'android') ToastAndroid.show("Reproduciendo siguiente episodio...", ToastAndroid.SHORT);
                navigation.replace('VideoPlayer', { movie: nextEp, seriesData: seriesData, selectedQuality });
            } else {
                if (Platform.OS === 'android') ToastAndroid.show("Has terminado la serie.", ToastAndroid.SHORT);
                navigation.goBack();
            }
        } else {
            navigation.goBack();
        }
    };

    const formatTime = (secs) => {
        if (!secs || isNaN(secs)) return "00:00";
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <View style={[styles.playerContainer, Platform.OS === 'web' && { height: '100vh', overflow: 'hidden' }]}>
            <StatusBar hidden />

            <Modal visible={showTracksModal} transparent={true} animationType="fade">
                <View style={styles.tracksModalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTracksModal(false)}>
                        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    </Pressable>
                    <Pressable style={[styles.tracksModalContainer, { width: 320, padding: 0, overflow: 'hidden' }]}>
                        {activeModalTab === 'audio' ? (
                            <View style={{ width: '100%', padding: 25 }}>
                                <Text style={[styles.tracksModalTitle, { color: PREMIUM_GOLD, textAlign: 'center' }]}>Idioma de Audio</Text>
                                <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                                    {availableAudioTracks.map((audio, index) => (
                                        <TouchableOpacity activeOpacity={0.6} key={`aud-${index}`} style={{ marginBottom: 15, paddingVertical: 5 }} onPress={() => setMenuAudioTrack(index)}>
                                            <Text style={{ color: menuAudioTrack === index ? PREMIUM_GOLD : '#fff', fontWeight: menuAudioTrack === index ? 'bold' : 'normal', textAlign: 'center', fontSize: 16 }}>
                                                {menuAudioTrack === index ? '✓ ' : ''}{audio.title || audio.language || `Pista ${index + 1}`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity activeOpacity={0.8} style={[styles.tracksModalBtn, { marginTop: 20, alignSelf: 'center', width: '100%', alignItems: 'center' }]} onPress={aplicarCambios}>
                                    <Text style={styles.tracksModalBtnText}>Aplicar Cambios</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ width: '100%', padding: 25 }}>
                                <Text style={[styles.tracksModalTitle, { color: PREMIUM_GOLD, textAlign: 'center' }]}>Subtítulos</Text>
                                <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                                    <TouchableOpacity activeOpacity={0.6} style={{ marginBottom: 15, paddingVertical: 5 }} onPress={() => setMenuSubTrack(-1)}>
                                        <Text style={{ color: menuSubTrack === -1 ? PREMIUM_GOLD : '#fff', fontWeight: menuSubTrack === -1 ? 'bold' : 'normal', textAlign: 'center', fontSize: 16 }}>
                                            {menuSubTrack === -1 ? '✓ ' : ''}Desactivado
                                        </Text>
                                    </TouchableOpacity>
                                    {availableTextTracks.map((sub, index) => (
                                        <TouchableOpacity activeOpacity={0.6} key={`sub-${index}`} style={{ marginBottom: 15, paddingVertical: 5 }} onPress={() => setMenuSubTrack(index)}>
                                            <Text style={{ color: menuSubTrack === index ? PREMIUM_GOLD : '#888', fontWeight: menuSubTrack === index ? 'bold' : 'normal', textAlign: 'center', fontSize: 16 }}>
                                                {menuSubTrack === index ? '✓ ' : ''}{sub.title || sub.language || `Sub ${index + 1}`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity activeOpacity={0.8} style={[styles.tracksModalBtn, { marginTop: 20, alignSelf: 'center', width: '100%', alignItems: 'center' }]} onPress={aplicarCambios}>
                                    <Text style={styles.tracksModalBtnText}>Aplicar Cambios</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Pressable>
                </View>
            </Modal>

            <View style={styles.videoWrapper}>
                {/* 🔥 FIX 5: MOTOR CONDICIONAL SEGURO (HTML5 PARA WEB / EXPOVIDEO PARA APP) 🔥 */}
                {Platform.OS === 'web' ? (
                    <video
                        ref={videoRef}
                        src={streamUrl}
                        style={{ width: '100%', height: '100%', objectFit: resizeModes[resizeModeIndex] === 'contain' ? 'contain' : 'cover', backgroundColor: '#000', outline: 'none' }}
                        autoPlay={status.isPlaying}
                        onTimeUpdate={(e) => onProgress({ currentTime: e.target.currentTime })}
                        onLoadedMetadata={(e) => onLoad({ duration: e.target.duration })}
                    />
                ) : (
                    <ExpoVideo
                        ref={videoRef}
                        source={{ uri: streamUrl }}
                        style={StyleSheet.absoluteFill}
                        shouldPlay={status.isPlaying}
                        resizeMode={resizeModes[resizeModeIndex]}
                        volume={volumeLevel}
                        onLoad={onLoad}
                        onPlaybackStatusUpdate={(s) => {
                            if (s.isLoaded) {
                                setStatus(p => ({ ...p, isBuffering: s.isBuffering }));
                                onProgress(s);
                            }
                        }}
                    />
                )}

                {isMobile && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: 1 - brightnessLevel, zIndex: 2, elevation: 2, pointerEvents: 'none' }]} />}

                {showNextEpisodeBtn && !isLocked && showControls && (
                    <Animated.View style={{ position: 'absolute', bottom: 120, right: 40, zIndex: 10, opacity: fadeAnim }}>
                        <TouchableOpacity activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(193, 145, 95, 0.9)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, elevation: 5 }} onPress={() => { navigation.goBack(); if (Platform.OS === 'android') ToastAndroid.show("Prepara el siguiente episodio.", ToastAndroid.SHORT); }}>
                            <Text style={{ color: '#000', fontWeight: 'bold', marginRight: 8, fontSize: 16 }}>Siguiente Episodio</Text>
                            <Ionicons name="play-skip-forward" size={20} color="#000" />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {status.isBuffering && (
                    <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', zIndex: 3 }]} pointerEvents="none">
                        <ActivityIndicator size="large" color={PREMIUM_GOLD} />
                    </View>
                )}

                <View style={[StyleSheet.absoluteFillObject, { flexDirection: 'row', zIndex: 4 }]}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => handleTap('left')} activeOpacity={1} />
                    <TouchableOpacity style={{ flex: 1.5 }} onPress={() => handleTap('center')} activeOpacity={1} />
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => handleTap('right')} activeOpacity={1} />
                </View>
            </View>

            {isMobile && showVolumeUI && !isLocked && (
                <Animated.View style={[styles.gestureUIIndicatorRight, { zIndex: 100, elevation: 100, opacity: fadeVolumeAnim }]}>
                    <Ionicons name={volumeLevel === 0 ? "volume-mute" : "volume-high"} size={30} color="#fff" />
                    <Text style={styles.gestureUIText}>{Math.round(volumeLevel * 100)}%</Text>
                </Animated.View>
            )}
            {isMobile && showBrightnessUI && !isLocked && (
                <Animated.View style={[styles.gestureUIIndicatorLeft, { zIndex: 100, elevation: 100, opacity: fadeBrightnessAnim }]}>
                    <Ionicons name="sunny" size={30} color="#fff" />
                    <Text style={styles.gestureUIText}>{Math.round(brightnessLevel * 100)}%</Text>
                </Animated.View>
            )}

            {!isLocked && showControls && (
                <Animated.View style={[styles.customControlsOverlay, { opacity: fadeAnim, pointerEvents: 'box-none', zIndex: 5 }]}>
                    <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.playerTopBar}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.playerTopTitle} numberOfLines={1}>{movie.title}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity activeOpacity={0.6} onPress={() => setShowCastModal(true)} style={[styles.playerCloseBtn, { marginRight: 15 }]}>
                                <Ionicons name="tv-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                            {Platform.OS === 'ios' || Platform.OS === 'android' ? (
                                <TouchableOpacity activeOpacity={0.6} onPress={handlePiP} style={[styles.playerCloseBtn, { marginRight: 15 }]}>
                                    <Ionicons name="browsers-outline" size={24} color="#fff" />
                                </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity activeOpacity={0.6} onPress={() => navigation.goBack()} style={styles.playerCloseBtn}>
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.playerBottomBar}>
                        <View style={styles.timeAndBarRow}>
                            <Text style={styles.playerTimeText}>{formatTime(scrubbingTime !== null ? scrubbingTime : status.currentTime)}</Text>

                            <View style={[styles.customSliderContainer, { height: 50, justifyContent: 'center' }]}>
                                <Slider
                                    style={{ flex: 1, height: 40 }}
                                    minimumValue={0}
                                    maximumValue={status.duration > 0 ? status.duration : 1}
                                    value={scrubbingTime !== null ? scrubbingTime : status.currentTime}
                                    minimumTrackTintColor={PREMIUM_GOLD}
                                    maximumTrackTintColor="#333333"
                                    thumbTintColor="#ffffff"
                                    onSlidingStart={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
                                    onValueChange={(val) => { setScrubbingTime(val); }}
                                    onSlidingComplete={async (val) => {
                                        setScrubbingTime(null);
                                        // 🔥 FIX 6: USO SEGURO DEL EVENTO SEEK (Punto 2 de los errores)
                                        if (videoRef.current) {
                                            if (Platform.OS === 'web') {
                                                videoRef.current.currentTime = val;
                                            } else {
                                                await videoRef.current.setPositionAsync(val * 1000);
                                            }
                                        }
                                        resetControlsTimer();
                                    }}
                                />
                            </View>
                            <Text style={styles.playerTimeText}>{formatTime(status.duration)}</Text>
                        </View>

                        <View style={styles.bottomIconsRow}>
                            <Pressable
                                focusable={true}
                                onPress={togglePlayPause}
                                style={({ focused }) => [
                                    styles.playerControlBtn,
                                    focused && styles.playerControlBtnFocused
                                ]}
                            >
                                <Ionicons name={status.isPlaying ? "pause" : "play"} size={32} color="#fff" />
                            </Pressable>

                            <Pressable
                                focusable={true}
                                onPress={openAudioTracks}
                                style={({ focused }) => [
                                    styles.playerControlBtn,
                                    focused && styles.playerControlBtnFocused
                                ]}
                            >
                                <Ionicons name="musical-note" size={26} color="#fff" />
                            </Pressable>

                            <Pressable
                                focusable={true}
                                onPress={openSubTracks}
                                style={({ focused }) => [
                                    styles.playerControlBtn,
                                    focused && styles.playerControlBtnFocused
                                ]}
                            >
                                <Ionicons name="chatbox-ellipses-outline" size={26} color="#fff" />
                            </Pressable>

                            <Pressable
                                focusable={true}
                                onPress={toggleCrop}
                                style={({ focused }) => [
                                    styles.playerControlBtn,
                                    focused && styles.playerControlBtnFocused
                                ]}
                            >
                                <Ionicons name="crop" size={26} color="#fff" />
                            </Pressable>
                        </View>
                    </LinearGradient>
                </Animated.View>
            )}
        </View>
    );
}
// ==========================================
// 4. PANTALLAS (SCREENS) - HOME REDISEÑADO (NUVIO TV)
// ==========================================
function HomeScreen({ route, navigation }) {
    const {
        user, setShowVipModal,
        watchlist, toggleWatchlist, continueWatching,
        removeFromContinueWatching, jellyfinMovies,
        isOfflineMode,
        isCasting, connectedTV
    } = useContext(AppContext);

    const { width, height } = useWindowDimensions();
    const isMobile = width < 768;
    const scrollViewRef = useRef(null);
    const [heroIndex, setHeroIndex] = useState(0);
    const [selectedStudio, setSelectedStudio] = useState(null);
    const [showBatteryModal, setShowBatteryModal] = useState(false);
    const [showQuality, setShowQuality] = useState(false);

    // 🔥 NUEVOS ESTADOS PARA REANUDAR Y CALIDAD 🔥
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [itemToResume, setItemToResume] = useState(null);
    const [itemToProcessLocal, setItemToProcessLocal] = useState(null);

    // 🔥 Este valor rastrea la posición exacta del scroll para los degradados
    const scrollY = useRef(new Animated.Value(0)).current;
    const HERO_HEIGHT = isMobile ? height * 0.88 : height * 0.85;

    // 🔥 ESTADO DE TV: Guarda qué película está enfocada actualmente con el control remoto
    const [tvFocusedMovie, setTvFocusedMovie] = useState(null);

    // Atrapa el botón "Atrás" físico para salir de los Estudios
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (selectedStudio) {
                    setSelectedStudio(null);
                    return true;
                }
                return false;
            };
            BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, [selectedStudio])
    );

    useEffect(() => {
        if (route.params?.reset) {
            setSelectedStudio(null);
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
        if (!isOfflineMode && isMobile) {
            // Solo rotamos automáticamente el hero en versión móvil
            const timer = setInterval(() => { setHeroIndex((prev) => (prev + 1) % 5); }, 7000);
            return () => clearInterval(timer);
        }
    }, [route.params?.reset, isOfflineMode, isMobile]);

    const displayData = jellyfinMovies && jellyfinMovies.length > 0 ? jellyfinMovies : FALLBACK_HERO;
    const topHeroMovies = displayData.slice(0, 5);

    // 🔥 CEREBRO VISUAL: En TV muestra lo que enfocas, en móvil el carrusel normal
    const activeHero = (!isMobile && tvFocusedMovie) ? tvFocusedMovie : (topHeroMovies[heroIndex] || topHeroMovies[0]);

    const moviesOnly = displayData.filter(m => m.type === 'movie');
    const seriesOnly = displayData.filter(m => m.type === 'series');
    const novelsOnly = displayData.filter(m => m.type === 'novel');
    const animesOnly = displayData.filter(m => m.type === 'anime');
    const recomendados = displayData.filter(m => parseFloat(m.imdb) >= 7.5);

    const openMovieDetails = (movieData) => { navigation.navigate('MovieDetails', { movie: movieData }); };

    const handlePlayPress = (movie) => {
        const currentMovie = movie || activeHero;

        // 🔥 PASAMOS POR EL ESCUDO FREEMIUM PRIMERO 🔥
        attemptPlay(currentMovie, () => {
            if (isMobile) {
                navigation.navigate('MovieDetails', { movie: currentMovie });
                return;
            }
            if (isCasting) {
                Alert.alert("VERTƎX Connect", `Mandando "${currentMovie.title}" a tu ${connectedTV}.`);
                return;
            }
            const cwItem = continueWatching.find(m => m.id === currentMovie.id);
            if (cwItem && cwItem.progress > 0.02) {
                setItemToResume(cwItem);
                setShowResumeModal(true);
            } else if (currentMovie.qualities && currentMovie.qualities.length > 1) {
                setItemToProcessLocal(currentMovie);
                setShowQuality(true);
            } else {
                navigation.navigate('VideoPlayer', { movie: currentMovie });
            }
        });
    };

    // Ahora el reproductor sabe exactamente qué película arrancar
    const startPlayback = (quality) => {
        setShowQuality(false);
        navigation.navigate('VideoPlayer', { movie: itemToProcessLocal || activeHero, selectedQuality: quality });
    };

    // 🔥 MAGIA DE ANIMACIÓN: Calculamos la opacidad del fondo basada en el scroll
    const backgroundOpacity = scrollY.interpolate({
        inputRange: [0, HERO_HEIGHT * 0.8],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <QualitySelectorModal visible={showQuality} onClose={() => setShowQuality(false)} onSelect={startPlayback} actionType="play" movie={itemToProcessLocal || activeHero} />
            <BatteryOptimizationModal visible={showBatteryModal} onClose={() => setShowBatteryModal(false)} />

            {/* MODAL DE REANUDACIÓN CON CAMBIO DE CALIDAD */}
            <ResumeModal
                visible={showResumeModal}
                onClose={() => setShowResumeModal(false)}
                progress={itemToResume?.progress || 0}
                onResume={() => {
                    setShowResumeModal(false);
                    navigation.navigate('VideoPlayer', { movie: { ...itemToResume, progress: itemToResume.progress } });
                }}
                onRestart={() => {
                    setShowResumeModal(false);
                    navigation.navigate('VideoPlayer', { movie: { ...itemToResume, progress: 0 } });
                }}
                onChangeQuality={() => {
                    setShowResumeModal(false);
                    setItemToProcessLocal(itemToResume);
                    setShowQuality(true);
                }}
            />

            {isMobile && <MobileHeader scrollY={scrollY} heroHeight={HERO_HEIGHT} />}

            {/* 📺 ========================================================
                CAPA 1: EL FONDO FIJO Y DINÁMICO (AHORA RESPONDE AL SCROLL)
               ======================================================== */}
            {!isMobile && !selectedStudio && activeHero && (
                <Animated.View style={[StyleSheet.absoluteFillObject, { zIndex: 0, opacity: backgroundOpacity }]}>
                    <ExpoImage
                        key={`bg-${activeHero.id}`}
                        source={{ uri: activeHero.bgImage || activeHero.tmdbBg || activeHero.thumb }}
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                        transition={300}
                    />
                    {/* Degradados agresivos para asegurar legibilidad del texto */}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']} start={{ x: 0, y: 0.3 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />
                    <LinearGradient colors={['#000000', 'rgba(0,0,0,0.6)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 0 }} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
            )}

            {/* 📺 ========================================================
                CAPA 2: SCROLL COMPLETO (EFECTO NUVIO TV)
               ======================================================== */}
            <View style={{ flex: 1, zIndex: 10 }}>
                <Animated.ScrollView
                    ref={scrollViewRef}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: isMobile ? 100 : 80 }}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                >
                    {/* INFO DEL HERO (TV) - AHORA SE MUEVE CON EL SCROLL */}
                    {!isMobile && !selectedStudio && activeHero && (
                        <View style={{ width: '100%', height: HERO_HEIGHT, justifyContent: 'center', paddingLeft: 80, paddingTop: 40 }}>
                            <View style={{ width: '55%' }}>
                                <Text style={[styles.heroTitle, { fontSize: 55, color: '#fff', textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 10, textTransform: 'uppercase', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', marginBottom: 10 }]} numberOfLines={2}>
                                    {activeHero.title}
                                </Text>

                                <View style={[styles.heroTags, { marginBottom: 20 }]}>
                                    <Text style={[styles.tagText, { fontSize: 16, fontWeight: 'bold', color: '#fff' }]}>{activeHero.year}</Text><Text style={styles.tagDot}> • </Text>
                                    <View style={[styles.tagBox, { borderColor: '#fff', borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.5)' }]}><Text style={[styles.tagText, { color: '#fff', fontSize: 14 }]}>{activeHero.rating || 'VIP'}</Text></View><Text style={styles.tagDot}> • </Text>
                                    <Text style={[styles.tagText, { fontSize: 16, fontWeight: 'bold', color: '#fff' }]}>{activeHero.lang || 'Latino'}</Text>
                                </View>

                                <Text style={{ fontSize: 16, lineHeight: 26, color: '#e0e0e0', textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 6, marginBottom: 30 }} numberOfLines={4}>
                                    {activeHero.overview}
                                </Text>

                                <View style={[styles.detailsActionRow, { maxWidth: 450 }]}>
                                    <TouchableOpacity style={[styles.btnPlayFlexible, { backgroundColor: '#fff', height: 50 }]} onPress={() => handlePlayPress(activeHero)}>
                                        <Ionicons name="play" size={22} color="#000" />
                                        <Text style={[styles.btnPlayGoldenText, { color: '#000' }]}>Reproducir</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.btnIconDark, { height: 50, width: 60 }]} onPress={() => toggleWatchlist(activeHero)}>
                                        <Ionicons name={watchlist.some(m => m.id === activeHero.id) ? "checkmark" : "add"} size={26} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Hero Móvil Clásico (Se renderiza SOLO si es móvil) */}
                    {isMobile && !selectedStudio && activeHero && (
                        <View style={{ width: width, height: HERO_HEIGHT, backgroundColor: '#000', overflow: 'hidden' }}>
                            <View style={StyleSheet.absoluteFillObject}>
                                <Image
                                    key={`bg-${activeHero.id}`}
                                    source={{ uri: activeHero.bgImage || activeHero.thumb }}
                                    style={StyleSheet.absoluteFillObject}
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
                                    start={{ x: 0, y: 0.2 }}
                                    end={{ x: 0, y: 1 }}
                                    style={StyleSheet.absoluteFillObject}
                                />
                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', paddingBottom: 25, paddingHorizontal: 20, alignItems: 'center' }]}>
                                    <Text style={[styles.heroTitle, { fontSize: 34, textAlign: 'center', color: '#ebd197', textTransform: 'uppercase', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', letterSpacing: 1, marginBottom: 15 }]}>{activeHero.title}</Text>

                                    <View style={[styles.heroTags, { marginBottom: 15 }]}>
                                        <Text style={[styles.tagText, { fontSize: 13, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 }]}>{activeHero.year}</Text><Text style={styles.tagDot}> • </Text>
                                        <View style={[styles.tagBox, { borderColor: '#fff', borderWidth: 1, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: 'rgba(0,0,0,0.5)' }]}><Text style={[styles.tagText, { color: '#fff', fontSize: 11 }]}>{activeHero.rating || 'VIP'}</Text></View><Text style={styles.tagDot}> • </Text>
                                        <Text style={[styles.tagText, { fontSize: 13, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 }]}>{activeHero.lang || 'Latino'}</Text>
                                    </View>

                                    <Text style={[styles.heroGenres, { textAlign: 'center', marginBottom: 20, color: '#e0e0e0', fontWeight: 'bold', fontSize: 12 }]} numberOfLines={1}>
                                        {activeHero.genres}
                                    </Text>

                                    <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 15, alignItems: 'center' }}>
                                        <TouchableOpacity style={[styles.btnPlayHeroMobile, { flex: undefined, width: 220, height: 50, borderRadius: 8, marginRight: 0 }]} onPress={() => handlePlayPress(activeHero)}>
                                            <Ionicons name="play" size={24} color="#000" />
                                            <Text style={[styles.btnPlayTextMobile, { fontSize: 18 }]}>Mira ahora</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.btnAddHeroMobile, { backgroundColor: 'rgba(255,255,255,0.15)', height: 50, width: 50, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]} onPress={() => toggleWatchlist(activeHero)}>
                                            <Ionicons name={watchlist.some(m => m.id === activeHero.id) ? "checkmark" : "add"} size={28} color="#fff" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={[styles.paginationDots, { marginTop: 15 }]}>
                                        {topHeroMovies.map((_, i) => (
                                            <View key={i} style={[styles.dot, { backgroundColor: heroIndex === i ? '#fff' : 'rgba(255,255,255,0.3)', width: heroIndex === i ? 6 : 5, height: heroIndex === i ? 6 : 5 }]} />
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* 📚 FILAS DE CONTENIDO (MÓVIL Y TV) */}
                    {/* En TV las listas ahora quedan montadas de forma natural sobre el fondo oscurecido */}
                    <View style={{ marginTop: isMobile ? 25 : -80, zIndex: 10 }}>
                        {!selectedStudio && continueWatching.length > 0 && (
                            <ContinueWatchingList
                                title="Sigue viendo"
                                data={continueWatching}
                                onMoviePress={(movie) => {
                                    setItemToResume(movie);
                                    setShowResumeModal(true);
                                }}
                                isMobile={isMobile}
                                onRemoveItem={removeFromContinueWatching}
                                onViewAll={() => navigation.navigate('History')}
                            />
                        )}

                        {!selectedStudio && <MovieList title="Agregados Recientemente" data={displayData} onMoviePress={openMovieDetails} isMobile={isMobile} onFocusChange={setTvFocusedMovie} />}
                        {!selectedStudio && recomendados.length > 0 && <MovieList title="Recomendados para ti" data={recomendados} onMoviePress={openMovieDetails} isMobile={isMobile} onFocusChange={setTvFocusedMovie} />}
                        {!selectedStudio && moviesOnly.length > 0 && <MovieList title="Películas Destacadas" data={moviesOnly} onMoviePress={openMovieDetails} isMobile={isMobile} onFocusChange={setTvFocusedMovie} />}
                        {!selectedStudio && seriesOnly.length > 0 && <MovieList title="Series VIP" data={seriesOnly} onMoviePress={openMovieDetails} isMobile={isMobile} onFocusChange={setTvFocusedMovie} />}
                        {!selectedStudio && novelsOnly.length > 0 && <MovieList title="Telenovelas" data={novelsOnly} onMoviePress={openMovieDetails} isMobile={isMobile} onFocusChange={setTvFocusedMovie} />}
                        {!selectedStudio && animesOnly.length > 0 && <MovieList title="Animes" data={animesOnly} onMoviePress={openMovieDetails} isMobile={isMobile} onFocusChange={setTvFocusedMovie} />}

                        {!selectedStudio && <GenreList title="Explorar Géneros" data={POPULAR_GENRES} isMobile={isMobile} onGenrePress={(genreName) => navigation.navigate('Buscar', { initialQuery: genreName })} />}

                        <View style={[styles.carouselContainer, { marginTop: 10, marginBottom: 20 }]}>
                            <Text style={[styles.sectionTitle, isMobile && { marginLeft: 15 }, { marginBottom: 15 }]}>Servicios de Streaming</Text>
                            <FlatList horizontal data={ESTUDIOS} keyExtractor={(item) => item.name} showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.flatListContent, isMobile && { paddingLeft: 15, paddingRight: 15 }]}
                                renderItem={({ item }) => {
                                    const isActive = selectedStudio === item.query;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                isMobile ? { width: 140, height: 80 } : { width: 220, height: 120 },
                                                { borderRadius: 12, marginRight: 15, backgroundColor: item.color, justifyContent: 'center', alignItems: 'center', borderWidth: isActive ? 2 : 1, borderColor: isActive ? PREMIUM_GOLD : 'rgba(255,255,255,0.1)' }
                                            ]}
                                            onPress={() => setSelectedStudio(isActive ? null : item.query)}
                                        >
                                            <Image source={{ uri: item.logo }} style={{ width: '60%', height: '60%', opacity: isActive ? 1 : 0.7 }} resizeMode="contain" />
                                        </TouchableOpacity>
                                    )
                                }}
                            />
                        </View>

                        {selectedStudio && (
                            <View style={[styles.catalogWrapper, isMobile && { paddingLeft: 15, paddingRight: 15 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <Text style={[styles.catalogHeaderTitle, { marginBottom: 0 }, isMobile && { fontSize: 20, color: PREMIUM_GOLD }]}>Catálogo de {selectedStudio}</Text>
                                    <TouchableOpacity onPress={() => setSelectedStudio(null)} style={{ padding: 8, backgroundColor: '#222', borderRadius: 20 }}>
                                        <Ionicons name="close" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                                <FilteredGridView
                                    movies={displayData.filter(m => m.studio && m.studio.toLowerCase().includes(selectedStudio.toLowerCase()))}
                                    onMoviePress={openMovieDetails}
                                    isMobile={isMobile}
                                />
                            </View>
                        )}
                    </View>
                </Animated.ScrollView>
            </View>
            {isMobile && <MobileBottomBar currentRoute="Inicio" />}
        </View>
    );
}
// 🔥 MEGA-BUSCADOR: BÚSQUEDA DIRECTA EN EL SERVIDOR (64TB READY) 🔥
function SearchScreen({ route, navigation }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const { initialQuery } = route.params || {};
    const [searchQuery, setSearchQuery] = useState(initialQuery || "");
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery || "");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const { jellyfinMovies } = useContext(AppContext);

    // 🔥 FIX 1: Memoria RAM local para guardar el ID Maestro
    const jfUserIdRef = useRef(null);

    const sugerenciasVIP = jellyfinMovies ? jellyfinMovies.filter(m => parseFloat(m.imdb) >= 7.5).slice(0, 12) : [];

    // 1. CEREBRO DE BÚSQUEDA REMOTA OPTIMIZADO
    const searchJellyfin = async (query) => {
        if (query.length < 2) { setSearchResults([]); return; }
        setIsSearching(true);
        try {
            // 🔥 FIX 2: Solo le preguntamos a Jellyfin quién es el usuario UNA VEZ en la vida de la app
            if (!jfUserIdRef.current) {
                const userRes = await fetch(`${JELLYFIN_URL}/Users?api_key=${JELLYFIN_API_KEY}`);
                const users = await userRes.json();
                jfUserIdRef.current = users[0].Id;
            }

            // Usamos la memoria para hacer la búsqueda directa
            const url = `${JELLYFIN_URL}/Users/${jfUserIdRef.current}/Items?searchTerm=${encodeURIComponent(query)}&IncludeItemTypes=Movie,Series&Recursive=true&Fields=Overview,MediaSources,ImageTags&Limit=30&api_key=${JELLYFIN_API_KEY}`;

            const response = await fetch(url);
            const data = await response.json();

            const formattedResults = data.Items.map(item => {
                const hasPrimary = item.ImageTags && item.ImageTags.Primary;
                const hasBackdrop = item.BackdropImageTags && item.BackdropImageTags.length > 0;

                const thumbUrl = hasPrimary ? `${JELLYFIN_URL}/Items/${item.Id}/Images/Primary?api_key=${JELLYFIN_API_KEY}&maxWidth=400` : null;
                const bgUrl = hasBackdrop ? `${JELLYFIN_URL}/Items/${item.Id}/Images/Backdrop?api_key=${JELLYFIN_API_KEY}&maxWidth=1080` : thumbUrl;

                return {
                    id: item.Id, jellyfin_id: item.Id, title: item.Name,
                    year: item.ProductionYear || 'N/A', overview: item.Overview || 'Sin sinopsis.',
                    thumb: thumbUrl, bgImage: bgUrl,
                    type: item.Type?.toLowerCase() === 'series' ? 'series' : 'movie',
                    imdb: item.CommunityRating ? item.CommunityRating.toFixed(1) : '5.0',
                    genres: item.Genres?.join(' • ') || 'Premium',
                    qualities: ['1080p (Original)'], videoCodec: 'H.264',
                    director: 'Desconocido', studio: 'VERTƎX Server'
                };
            });

            setSearchResults(formattedResults);
        } catch (error) {
            console.log("Error en búsqueda:", error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const timerId = setTimeout(() => {
            if (searchQuery.length > 1) searchJellyfin(searchQuery);
            else setSearchResults([]);
        }, 600);
        return () => clearTimeout(timerId);
    }, [searchQuery]);

    useEffect(() => {
        if (debouncedQuery.length > 1) searchJellyfin(debouncedQuery);
        else setSearchResults([]);
    }, [debouncedQuery]);

    const handleVoiceSearch = async () => {
        if (Platform.OS === 'web') return;
        if (isListening) { await Voice.stop(); setIsListening(false); }
        else { setSearchQuery(""); await Voice.start('es-ES'); }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* Header Fijo con Blur - Ajustado el padding vertical para acercar la barra */}
            <BlurView intensity={80} tint="dark" style={[styles.searchHeaderPinned, { position: 'absolute', top: 0, width: '100%', zIndex: 100, paddingTop: isMobile ? (Platform.OS === 'ios' ? 50 : 30) : 30, paddingBottom: 15, paddingHorizontal: isMobile ? 15 : 80 }]}>
                <View style={[styles.searchBarWrapper, isInputFocused && { borderColor: PREMIUM_GOLD, backgroundColor: '#111' }]}>
                    <Ionicons name="search" size={20} color={isInputFocused ? PREMIUM_GOLD : "#888"} style={{ marginLeft: 15 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={isListening ? "Escuchando..." : "Películas, series, actores..."}
                        placeholderTextColor="#666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                    />
                    {isSearching && <ActivityIndicator color={PREMIUM_GOLD} style={{ marginRight: 10 }} />}
                    <TouchableOpacity onPress={handleVoiceSearch} style={{ paddingHorizontal: 15, borderLeftWidth: 1, borderLeftColor: '#333' }}>
                        <Ionicons name={isListening ? "mic" : "mic-outline"} size={22} color={isListening ? "#ff4444" : PREMIUM_GOLD} />
                    </TouchableOpacity>
                </View>
            </BlurView>

            {/* 🔥 FIX DEL ESPACIADO: Redujimos dramáticamente el paddingTop de 130 a 90 */}
            <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: isMobile ? 90 : 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {searchQuery.length === 0 && (
                    <View style={{ paddingHorizontal: isMobile ? 15 : 80, marginTop: 5 }}>

                        {/* 1. MÓVIL SOLAMENTE: Botones de categorías */}
                        {isMobile && (
                            <MobileCategoryButtons navigation={navigation} />
                        )}

                        {/* 2. TV Y MÓVIL: Sugerencias para llenar el vacío */}
                        {sugerenciasVIP.length > 0 && (
                            <View style={{ marginTop: isMobile ? 5 : 20 }}>
                                <Text style={{ color: PREMIUM_GOLD, fontSize: 13, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 }}>
                                    SUGERENCIAS PARA TI
                                </Text>
                                <FilteredGridView movies={sugerenciasVIP} onMoviePress={(m) => navigation.navigate('MovieDetails', { movie: m })} isMobile={isMobile} />
                            </View>
                        )}
                    </View>
                )}

                {searchResults.length > 0 && (
                    <View style={{ paddingHorizontal: isMobile ? 15 : 80 }}>
                        <Text style={{ color: PREMIUM_GOLD, fontSize: 13, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 }}>
                            RESULTADOS DEL SERVIDOR
                        </Text>
                        <FilteredGridView movies={searchResults} onMoviePress={(m) => navigation.navigate('MovieDetails', { movie: m })} isMobile={isMobile} />
                    </View>
                )}

                {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
                    <EmptyState
                        icon="search-outline"
                        title="SIN COINCIDENCIAS"
                        message={`No encontramos nada relacionado con "${searchQuery}" en el servidor.`}
                    />
                )}
            </ScrollView>

            {isMobile && <MobileBottomBar currentRoute="Buscar" />}
        </View>
    );
}

// 🔥 BÓVEDA PERSONALIZADA (MI ESPACIO)
function MySpaceScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const { watchlist, continueWatching, setContinueWatching, removeFromContinueWatching } = useContext(AppContext);

    const openMovieDetails = (movieData) => { navigation.navigate('MovieDetails', { movie: movieData }); };

    // 🔥 BORRADOR DE HISTORIAL DE VIDEOS LOCAL 🔥
    const clearWatchHistory = () => {
        Alert.alert("Borrar Historial de Reproducción", "¿Deseas borrar todo tu progreso de películas y series en ESTE dispositivo?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Borrar",
                style: "destructive",
                onPress: () => {
                    setContinueWatching([]);
                    AsyncStorage.removeItem('vertex_cw');
                    if (Platform.OS === 'android') ToastAndroid.show("Historial local eliminado.", ToastAndroid.SHORT);
                }
            }
        ]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            {isMobile && <MobileHeader />}

            <ScrollView style={styles.mainScreen} contentContainerStyle={{ paddingBottom: isMobile ? 100 : 60, paddingTop: isMobile ? 20 : 50 }} showsVerticalScrollIndicator={false}>

                <View style={[styles.mySpaceHeader, isMobile && { paddingLeft: 15, paddingRight: 15, marginBottom: 20 }]}>
                    <View>
                        <Text style={[styles.mySpaceTitle, isMobile && { fontSize: 32 }, { fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', letterSpacing: 1 }]}>MI BÓVEDA</Text>
                        <Text style={{ color: PREMIUM_GOLD, fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginTop: 5 }}>CENTRO PERSONAL</Text>
                    </View>
                </View>

                {continueWatching.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                        <ContinueWatchingList
                            title="Sigue viendo"
                            data={continueWatching}
                            onMoviePress={openMovieDetails}
                            isMobile={isMobile}
                            onRemoveItem={removeFromContinueWatching}
                            onViewAll={() => navigation.navigate('History')}
                        />
                        <TouchableOpacity style={{ alignSelf: 'center', marginTop: 5, paddingVertical: 8, paddingHorizontal: 15 }} onPress={clearWatchHistory}>
                            <Text style={{ color: '#444', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>BORRAR HISTORIAL</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={[styles.catalogWrapper, isMobile && { paddingLeft: 15, paddingRight: 15, marginTop: continueWatching.length > 0 ? 10 : 0 }]}>
                    <Text style={[styles.sectionTitle, { marginLeft: 0, marginBottom: 15 }]}>Mi Lista de Seguimiento</Text>
                    {watchlist.length > 0 ? (
                        <FilteredGridView movies={watchlist} onMoviePress={openMovieDetails} isMobile={isMobile} />
                    ) : (
                        // 🔥 APLICAMOS EL ESTADO VACÍO ELEGANTE AQUÍ 🔥
                        <EmptyState
                            icon="bookmark"
                            title="TU LISTA ESTÁ VACÍA"
                            message="Aún no has guardado ninguna película o serie. Explora el catálogo y añade tus favoritas."
                            buttonText="EXPLORAR CATÁLOGO"
                            onAction={() => navigation.navigate('Buscar')}
                        />
                    )}
                </View>
            </ScrollView>
            {isMobile && <MobileBottomBar currentRoute="Mi Espacio" />}
        </View>
    );
}
function UserScreen({ navigation }) {
    const { user, updateUserData, isLoggedIn, setIsLoggedIn } = useContext(AppContext);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    // Estados de modales
    const [showLegal, setShowLegal] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showLicenses, setShowLicenses] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showBuffer, setShowBuffer] = useState(false);

    // 🔥 NUEVOS ESTADOS: CENTRO DE RECOMPENSAS 🔥
    const [showRewardsModal, setShowRewardsModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    // Estados de configuración
    const [batteryOpt, setBatteryOpt] = useState(false);
    const [bufferSize, setBufferSize] = useState(15000);
    const [networkStatus, setNetworkStatus] = useState("ÓPTIMO");

    const [editName, setEditName] = useState(user.name);
    const [editPhoto, setEditPhoto] = useState(user.photo);

    const AVATARES_LOCALES = [
        "https://ui-avatars.com/api/?name=V&background=c1915f&color=000&bold=true",
        "https://ui-avatars.com/api/?name=M&background=111&color=c1915f&bold=true",
        "https://ui-avatars.com/api/?name=K&background=ff4444&color=fff&bold=true",
        "https://ui-avatars.com/api/?name=J&background=003366&color=fff&bold=true",
        "https://ui-avatars.com/api/?name=S&background=10b981&color=000&bold=true"
    ];

    // 🔥 GENERADOR VISUAL DEL CÓDIGO PROPIO (Ej: SURI-007) 🔥
    const myReferralCode = user.name ? `${user.name.substring(0, 4).toUpperCase()}VIP-${user.id || '101'}` : 'CARGANDO...';

    const handleLogout = () => {
        Alert.alert("Cerrar Sesión", "¿Seguro que deseas salir de tu cuenta?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Cerrar Sesión",
                style: "destructive",
                onPress: async () => {
                    await SecureStore.deleteItemAsync('vertex_access');
                    await SecureStore.deleteItemAsync('vertex_refresh');
                    updateUserData({ name: "", vipDays: 0, isVip: false });
                    setIsLoggedIn(false);
                    if (Platform.OS === 'android') ToastAndroid.show("Sesión cerrada correctamente.", ToastAndroid.SHORT);
                }
            }
        ]);
    };

    const handleSaveProfile = () => {
        updateUserData({ name: editName, photo: editPhoto });
        setShowEditProfile(false);
    };

    const scanNetwork = async () => {
        setNetworkStatus("ESCANEANDO...");
        setTimeout(() => setNetworkStatus(Math.random() > 0.5 ? "ÓPTIMO" : "REGULAR"), 1500);
    };

    // 🔥 LÓGICA: CANJEAR CÓDIGO DE INVITACIÓN 🔥
    const handleRedeemInvite = async () => {
        if (inviteCode.trim().length < 4) { Alert.alert("Aviso", "El código ingresado es muy corto."); return; }
        setIsRedeeming(true);
        try {
            // Extraemos la Huella del Dispositivo
            let hwId = 'web-visitor';
            if (Platform.OS === 'android') hwId = Application.androidId;
            else if (Platform.OS === 'ios') hwId = await Application.getIosIdForVendorAsync();
            else hwId = await AsyncStorage.getItem('vertex_web_id') || 'web-visitor';

            const token = await AsyncStorage.getItem('vertex_access');
            const response = await fetch(`${BACKEND_URL}/api/canjear-pin/`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ pin: inviteCode, device_id: hwId })
            });
            const data = await response.json();

            if (response.ok && data.status === "success") {
                Alert.alert("¡Código Canjeado!", data.message);
                updateUserData({ vipDays: data.vip_days_left, isVip: true });
                setInviteCode('');
                setShowRewardsModal(false);
            } else {
                Alert.alert("Aviso", data.message || "El código es inválido o ya fue utilizado.");
            }
        } catch (e) { Alert.alert("Error", "Servidor no responde. Revisa tu conexión a internet."); }
        finally { setIsRedeeming(false); }
    };

    const SettingRow = ({ icon, title, subtitle, subtitleColor = '#888', rightIcon = 'chevron-forward', onPress, isSwitch, switchValue, onSwitchChange }) => (
        <TouchableOpacity style={styles.vipSettingRow} onPress={onPress} disabled={isSwitch} activeOpacity={0.7}>
            <View style={styles.vipSettingLeft}>
                <View style={styles.vipSettingIconBox}><Ionicons name={icon} size={22} color={PREMIUM_GOLD} /></View>
                <View style={styles.vipSettingTexts}>
                    <Text style={styles.vipSettingTitle}>{title}</Text>
                    <Text style={[styles.vipSettingSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
                </View>
            </View>
            {isSwitch ? <Switch trackColor={{ false: '#333', true: 'rgba(193, 145, 95, 0.5)' }} thumbColor={switchValue ? PREMIUM_GOLD : '#888'} onValueChange={onSwitchChange} value={switchValue} /> : rightIcon ? <Ionicons name={rightIcon} size={20} color="#555" /> : null}
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#050505' }}>
            {isMobile && <MobileHeader />}

            <LegalModal visible={showLegal} onClose={() => setShowLegal(false)} />
            <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
            <LicensesModal visible={showLicenses} onClose={() => setShowLicenses(false)} />
            <Modal visible={showRewardsModal} transparent={true} animationType="fade">
                <View style={styles.qualityModalOverlay}>
                    <View style={[styles.qualityModalBox, { padding: 25 }]}>
                        <Ionicons name="gift" size={50} color={PREMIUM_GOLD} style={{ alignSelf: 'center', marginBottom: 10 }} />
                        <Text style={styles.qualityModalTitle}>INVITA Y GANA</Text>
                        <Text style={styles.qualityModalText}>
                            Comparte tu código de socio con un amigo. Si él lo usa en esta misma pantalla, ¡ambos ganan 3 días VIP gratis!
                        </Text>

                        <View style={{ backgroundColor: '#111', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: PREMIUM_GOLD, marginBottom: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#888', fontSize: 10, marginBottom: 5 }}>TU CÓDIGO ÚNICO</Text>
                            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 2 }}>{myReferralCode}</Text>
                        </View>

                        <Text style={{ color: '#888', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>¿Tienes el código de un amigo?</Text>
                        <View style={[styles.authInputWrapper, { backgroundColor: '#111', height: 45, marginBottom: 15 }]}>
                            <Ionicons name="keypad" size={18} color={PREMIUM_GOLD} style={styles.authInputIcon} />
                            <TextInput
                                style={[styles.authInput, { textTransform: 'uppercase', color: '#fff' }]}
                                placeholder="Ingresa un código"
                                placeholderTextColor="#666"
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                autoCapitalize="characters"
                            />
                        </View>

                        <TouchableOpacity style={styles.qualityBtnPrimary} onPress={handleRedeemInvite} disabled={isRedeeming}>
                            {isRedeeming ? <ActivityIndicator color="#000" /> : <Text style={styles.qualityBtnPrimaryText}>CANJEAR CÓDIGO</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setShowRewardsModal(false)}>
                            <Text style={{ color: PREMIUM_GOLD, fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>CERRAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView style={styles.mainScreen} contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }} showsVerticalScrollIndicator={false}>

                {/* 1. CABECERA: Si está logueado ve su perfil, si no, botón Google */}
                {isLoggedIn ? (
                    <View style={styles.vipProfileHeader}>
                        <TouchableOpacity style={styles.vipAvatarContainer} onPress={() => setShowEditProfile(true)}>
                            <View style={styles.vipAvatarGlow}>
                                <Image source={{ uri: user.photo || 'https://ui-avatars.com/api/?name=Ǝ&background=c1915f&color=000&bold=true' }} style={styles.vipAvatarImage} />
                            </View>
                            <View style={styles.vipBadgeContainer}><Text style={styles.vipBadgeText}>Socio VIP</Text></View>
                        </TouchableOpacity>
                        <Text style={styles.vipProfileName}>{user.name}</Text>
                        <Text style={styles.vipProfileDays}>{user.vipDays} DÍAS VIP RESTANTES</Text>
                    </View>
                ) : (
                    <View style={styles.authInvitationCard}>
                        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 }}>Bienvenido a VERTƎX</Text>
                        <Text style={{ color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>Inicia sesión para guardar favoritos y sincronizar dispositivos.</Text>

                        <TouchableOpacity style={styles.googleBtn} onPress={() => navigation.navigate('Auth')}>
                            <Ionicons name="logo-google" size={20} color="#fff" />
                            <Text style={styles.googleBtnText}>Continuar con Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate('Auth')}>
                            <Text style={{ color: PREMIUM_GOLD, fontSize: 13, fontWeight: 'bold' }}>O usa tu correo electrónico</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* 2. AJUSTES: Siempre visibles para todos */}
                <View style={[styles.settingsContainer, !isMobile && { width: '60%', alignSelf: 'center' }]}>
                    {isLoggedIn && (
                        <TouchableOpacity style={styles.vipActionButton} onPress={() => setShowRewardsModal(true)}>
                            <Ionicons name="gift" size={26} color={PREMIUM_GOLD} style={{ marginRight: 15 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: PREMIUM_GOLD, fontWeight: 'bold' }}>INVITA Y GANA DÍAS VIP</Text>
                                <Text style={{ color: '#888', fontSize: 11 }}>Comparte tu código y obtén 3 días gratis.</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.vipSectionTitle}>GESTIÓN DE APLICACIÓN</Text>
                    <View style={styles.vipSectionGroup}>
                        <SettingRow icon="download-outline" title="Descargas" subtitle="Gestiona tu Bóveda offline" onPress={() => navigation.navigate('Downloads')} />
                        <SettingRow icon="people-outline" title="Mi Cuenta" subtitle="Gestión de pantallas permitidas" onPress={() => navigation.navigate('LinkedAccounts')} />
                    </View>

                    <Text style={styles.vipSectionTitle}>REPRODUCCIÓN Y RENDIMIENTO</Text>
                    <View style={styles.vipSectionGroup}>
                        <SettingRow icon="speedometer-outline" title="Buffer (Precarga)" subtitle={`${bufferSize / 1000}s Configurado`} onPress={() => setShowBuffer(true)} />
                        <SettingRow icon="wifi-outline" title="Escáner Wi-Fi" subtitle={networkStatus} onPress={scanNetwork} />
                        <SettingRow icon="battery-charging-outline" title="Optimización de Batería" isSwitch={true} switchValue={batteryOpt} onSwitchChange={setBatteryOpt} />
                    </View>

                    <Text style={styles.vipSectionTitle}>ACERCA DE VERTƎX</Text>
                    <View style={styles.vipSectionGroup}>
                        <SettingRow icon="shield-checkmark-outline" title="Términos y DMCA" onPress={() => setShowLegal(true)} />
                        <SettingRow icon="lock-closed-outline" title="Privacidad" onPress={() => setShowPrivacy(true)} />
                    </View>

                    {isLoggedIn && (
                        <TouchableOpacity style={styles.vipLogoutBtn} onPress={handleLogout}>
                            <Text style={styles.vipLogoutBtnText}>CERRAR SESIÓN</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {isMobile && <MobileBottomBar currentRoute="Usuario" />}
        </View>
    );
}
// 🔥 PANTALLA: GESTIÓN DE ACCESOS REAL 🔥
function LinkedDevicesScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [devices, setDevices] = useState([]);
    const [maxDevices, setMaxDevices] = useState(5);
    const [isLoading, setIsLoading] = useState(true);

    // Modales de Edición
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editDeviceId, setEditDeviceId] = useState(null);
    const [newDeviceName, setNewDeviceName] = useState("");

    const fetchDevices = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('vertex_access');
            const response = await fetch(`${BACKEND_URL}/api/dispositivos/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setDevices(data.devices);
                setMaxDevices(data.max_devices);
            }
        } catch (e) { } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchDevices(); }, []);

    const handleUnlink = (deviceId, deviceName) => {
        Alert.alert("Expulsar Pantalla", `¿Seguro que deseas sacar a "${deviceName}"?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Expulsar", style: "destructive",
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('vertex_access');
                        await fetch(`${BACKEND_URL}/api/dispositivos/`, {
                            method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ device_id: deviceId })
                        });
                        fetchDevices();
                    } catch (e) { }
                }
            }
        ]);
    };

    const openEditModal = (id, currentName) => {
        setEditDeviceId(id);
        setNewDeviceName(currentName);
        setEditModalVisible(true);
    };

    const saveNewDeviceName = async () => {
        if (!newDeviceName.trim()) return;
        try {
            const token = await AsyncStorage.getItem('vertex_access');
            await fetch(`${BACKEND_URL}/api/dispositivos/`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ device_id: editDeviceId, new_name: newDeviceName })
            });
            setEditModalVisible(false);
            fetchDevices(); // Recarga la lista para mostrar el nuevo nombre
        } catch (e) { Alert.alert("Error", "No se pudo actualizar el nombre."); }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#050505' }}>

            {/* Modal flotante para editar nombre */}
            <Modal visible={editModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Cambiar Nombre</Text>
                        <Text style={styles.modalText}>Asigna un nombre a este dispositivo para reconocerlo fácilmente.</Text>
                        <TextInput
                            style={[styles.authInput, { backgroundColor: '#111', borderRadius: 8, width: '100%', marginBottom: 20, paddingLeft: 10 }]}
                            value={newDeviceName} onChangeText={setNewDeviceName}
                        />
                        <View style={styles.modalButtonsRow}>
                            <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setEditModalVisible(false)}><Text style={styles.modalBtnSecondaryText}>Cancelar</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnPrimary} onPress={saveNewDeviceName}><Text style={styles.modalBtnPrimaryText}>Guardar</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 🔥 FIX 1: Cabecera responsiva que no choca 🔥 */}
            <View style={styles.downloadsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 15 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
                        <Ionicons name="arrow-back" size={24} color={PREMIUM_GOLD} />
                    </TouchableOpacity>
                    <Text style={[styles.downloadsHeaderTitle, { flex: 1 }]} numberOfLines={1}>Pantallas Conectadas</Text>
                </View>
                <Text style={styles.downloadsHeaderBrand}>VERTƎX</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: 140, paddingHorizontal: 25 }} showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 40 }}>
                    <Text style={{ color: '#888', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 5 }}>CENTRO DE SEGURIDAD</Text>
                    <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed' }}>Mis Dispositivos</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 5 }}>
                        <Text style={{ color: '#aaa', fontSize: 12, fontWeight: 'bold' }}>Pantallas en uso:</Text>
                        <Text style={{ color: PREMIUM_GOLD, fontSize: 12, fontWeight: 'bold' }}>{devices.length} / {maxDevices}</Text>
                    </View>
                    <View style={{ width: '100%', height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ width: `${(devices.length / maxDevices) * 100}%`, height: '100%', backgroundColor: PREMIUM_GOLD }} />
                    </View>
                </View>

                {isLoading ? <ActivityIndicator size="large" color={PREMIUM_GOLD} style={{ marginTop: 50 }} /> : (
                    <View style={{ gap: 20 }}>
                        {devices.map((dev) => {
                            // 🔥 MAGIA: Creamos un avatar visual basado en la primera letra del nombre 🔥
                            const dynamicAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(dev.name)}&background=c1915f&color=000&bold=true`;

                            return (
                                <View key={dev.device_id} style={styles.linkedDeviceCard}>
                                    <View style={styles.linkedDeviceLeft}>
                                        <View style={{ position: 'relative' }}>
                                            <Image source={{ uri: dynamicAvatar }} style={styles.linkedDeviceAvatar} />
                                            <View style={[styles.linkedDeviceStatusDot, { backgroundColor: '#10b981' }]} />
                                        </View>
                                        <View style={{ marginLeft: 15, justifyContent: 'center' }}>
                                            <Text style={[styles.linkedDeviceName, { maxWidth: 160 }]} numberOfLines={1}>{dev.name}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                                <Ionicons name="calendar-outline" size={12} color="#888" style={{ marginRight: 5 }} />
                                                <Text style={styles.linkedDeviceRole}>{dev.last_login}</Text>
                                            </View>
                                            <View style={styles.linkedDeviceBadge}><Text style={styles.linkedDeviceBadgeText}>{dev.type.toUpperCase()}</Text></View>
                                        </View>
                                    </View>
                                    <View style={styles.linkedDeviceRight}>
                                        <TouchableOpacity style={styles.linkedDeviceBtnEdit} onPress={() => openEditModal(dev.device_id, dev.name)}>
                                            <Text style={styles.linkedDeviceBtnEditText}>Editar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.linkedDeviceBtnUnlink} onPress={() => handleUnlink(dev.device_id, dev.name)}>
                                            <Text style={styles.linkedDeviceBtnUnlinkText}>Expulsar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* 🔥 BOTÓN VIP CAMUFLADO (AQUÍ LO PEGAS) 🔥 */}
                <View style={{ marginTop: 50, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 30 }}>
                    <Text style={{ color: '#888', fontSize: 13, marginBottom: 15 }}>¿Necesitas extender el acceso a tus pantallas?</Text>

                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(193, 145, 95, 0.1)', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30, borderWidth: 1, borderColor: PREMIUM_GOLD }}
                        onPress={() => {
                            // Este es el enlace que sacará al usuario a tu web de pago
                            const paymentUrl = "https://vertex-vex.netlify.app/checkout.html";
                            Linking.openURL(paymentUrl);
                        }}
                    >
                        <Ionicons name="diamond-outline" size={20} color={PREMIUM_GOLD} style={{ marginRight: 10 }} />
                        <Text style={{ color: PREMIUM_GOLD, fontWeight: 'bold', fontSize: 14, letterSpacing: 1 }}>GESTIONAR VIP</Text>
                    </TouchableOpacity>
                </View>

                {/* El texto pequeñito que ya tenías queda debajo del botón */}
                <Text style={{ color: '#444', fontSize: 9, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', marginTop: 50 }}>LA DIRECCIÓN MAC E IP NO SON REGISTRADAS POR PRIVACIDAD.</Text>
            </ScrollView>
        </View>
    );
}

// 🔥 MODAL DE OPCIONES DE SERIE REESTILIZADO (TIPO IMAGEN F5633A.PNG) 🔥
const SeriesDownloadModal = ({ visible, onClose, onSelect, seasonNumber = 1 }) => (
    <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.qualityModalOverlay}>
            <View style={styles.qualityModalBox}>
                <Text style={styles.qualityModalTitle}>OPCIONES DE SERIE</Text>
                <Text style={styles.qualityModalText}>¿Qué deseas hacer con esta serie?</Text>

                <TouchableOpacity style={styles.qualityBtnSecondary} onPress={() => onSelect('episode')}>
                    <Ionicons name="play-circle-outline" size={19} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.qualityBtnSecondaryText}>Ver / Bajar Capítulo Actual</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.qualityBtnSecondary, { marginTop: 10 }]} onPress={() => onSelect('season')}>
                    <Ionicons name="albums-outline" size={19} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.qualityBtnSecondaryText}>Descargar Toda la Temporada {seasonNumber}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 25 }} onPress={onClose}>
                    <Text style={{ color: PREMIUM_GOLD, fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>CANCELAR</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

// 🔥 MODAL: GENERAR ENLACE PARA VLC (CORREGIDO) 🔥
const VLCStreamLinkModal = ({ visible, onClose, movie }) => {
    // Prevenimos el "undefined" buscando el ID correcto
    const finalId = movie.jellyfin_id || (movie.id?.startsWith('jf_') ? movie.id.replace('jf_', '') : movie.id);
    const streamUrl = `${BACKEND_URL}/api/video/${finalId}/?audio=0&sub=-1`;

    const copyToClipboard = () => {
        if (Platform.OS === 'web') {
            window.alert("Enlace copiado (Simulado):\n" + streamUrl);
        } else {
            Alert.alert("Enlace", "Enlace copiado al portapapeles. Pégalo en tu PC/VLC.");
        }
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={styles.qualityModalOverlay}>
                <View style={styles.qualityModalBox}>
                    <Ionicons name="desktop-outline" size={40} color={PREMIUM_GOLD} style={{ alignSelf: 'center', marginBottom: 15 }} />
                    <Text style={styles.qualityModalTitle}>TRANSMITIR A PC (VLC)</Text>
                    <Text style={styles.qualityModalText}>Utiliza este enlace directo en tu PC para ver la película en una pantalla grande.</Text>

                    <View style={{ backgroundColor: '#111', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333', marginBottom: 20 }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center' }} numberOfLines={3}>{streamUrl}</Text>
                    </View>

                    <TouchableOpacity style={styles.qualityBtnPrimary} onPress={copyToClipboard}>
                        <Ionicons name="copy-outline" size={19} color="#000" style={{ marginRight: 10 }} />
                        <Text style={styles.qualityBtnPrimaryText}>Copiar Enlace</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ marginTop: 20 }} onPress={onClose}>
                        <Text style={{ color: PREMIUM_GOLD, fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>CERRAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
// 🔥 COMPONENTE: ACORDEÓN DE CAPÍTULOS (ESTABLE Y MINIMALISTA) 🔥
// 🔥 COMPONENTE: ACORDEÓN DE CAPÍTULOS CON SUBMENÚ 🔥
const SeasonAccordion = ({ season, seriesMovie, onSelectEpisode, onDownloadEpisode, onDownloadSeason }) => {
    const [expanded, setExpanded] = useState(false);
    const [expandedEpisodeId, setExpandedEpisodeId] = useState(null);

    if (!season || !season.episodes) return null;

    return (
        <View style={styles.seasonContainer}>
            <TouchableOpacity style={styles.seasonHeader} onPress={() => setExpanded(!expanded)}>
                <Text style={styles.seasonTitle}>{season.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: PREMIUM_GOLD, fontSize: 13, marginRight: 10, fontWeight: 'bold' }}>{season.episodes.length} Caps</Text>
                    <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={PREMIUM_GOLD} />
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.episodesList}>
                    {season.episodes.map(ep => (
                        <TouchableOpacity key={ep.id} style={styles.episodeCardDark} onPress={() => setExpandedEpisodeId(expandedEpisodeId === ep.id ? null : ep.id)}>
                            <View style={styles.episodeMainRow}>
                                <Image source={{ uri: ep.thumb }} style={styles.episodeThumb} />
                                <View style={styles.episodeInfo}>
                                    <Text style={styles.episodeTitle}>{ep.episodeNumber}. {ep.title}</Text>
                                    <Text style={styles.episodeDuration}>{ep.duration}</Text>
                                </View>
                                <Ionicons name={expandedEpisodeId === ep.id ? "chevron-up" : "chevron-down"} size={18} color="#888" />
                            </View>
                            <Text style={styles.episodeOverview} numberOfLines={expandedEpisodeId === ep.id ? undefined : 2}>{ep.overview}</Text>

                            {/* 🔥 SUBMENÚ DE ACCIONES AL TOCAR EL CAPÍTULO 🔥 */}
                            {expandedEpisodeId === ep.id && (
                                <View style={{ flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', justifyContent: 'space-around', backgroundColor: '#0a0a0a' }}>
                                    <TouchableOpacity onPress={() => onSelectEpisode(ep)} style={{ alignItems: 'center' }}>
                                        <Ionicons name="play-circle" size={32} color={PREMIUM_GOLD} />
                                        <Text style={{ color: '#fff', fontSize: 10, marginTop: 6, fontWeight: 'bold' }}>REPRODUCIR</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => onDownloadEpisode && onDownloadEpisode(ep)} style={{ alignItems: 'center' }}>
                                        <Ionicons name="download" size={28} color="#fff" />
                                        <Text style={{ color: '#ccc', fontSize: 10, marginTop: 8 }}>Bajar Capítulo</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => onDownloadSeason && onDownloadSeason(season)} style={{ alignItems: 'center' }}>
                                        <Ionicons name="albums" size={28} color="#fff" />
                                        <Text style={{ color: '#ccc', fontSize: 10, marginTop: 8 }}>Bajar Temporada</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

// 🔥 PANTALLA PRINCIPAL DE DETALLES (DISEÑO PREMIUM VERTƎX) 🔥
function MovieDetailsScreen({ route, navigation }) {
    const { width, height } = useWindowDimensions();
    const isMobile = width < 768;
    const { movie } = route.params;
    // 🔥 FIX: Traemos attemptPlay para que no dé error
    const { user, attemptPlay, setShowVipModal, watchlist, toggleWatchlist, continueWatching, isCasting, connectedTV, setItemToProcess, setModalActionType } = useContext(AppContext);
    const isFavorite = watchlist.some(m => m.id === movie.id);

    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleFavoritePress = () => {
        toggleWatchlist(movie);
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 4, useNativeDriver: true })
        ]).start();
    };

    const [showQualityModal, setShowQualityModal] = useState(false);
    const [showSeriesModal, setShowSeriesModal] = useState(false);
    const [modalActionTypeLocal, setModalActionTypeLocal] = useState('play');
    const [itemToProcessLocal, setItemToProcessLocal] = useState(movie);

    const [posterError, setPosterError] = useState(false);
    const isSeries = movie.type === 'series' || movie.type === 'anime' || movie.type === 'novel';

    const [seasons, setSeasons] = useState(movie.seasonsData || []);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(isSeries && seasons.length === 0);
    const [themeColor, setThemeColor] = useState(PREMIUM_GOLD);

    const [showResumeModal, setShowResumeModal] = useState(false);
    const [resumeItemProgress, setResumeItemProgress] = useState(0);

    // Altura calculada para el modo Inmersivo Móvil
    const INMERSIVE_HEADER_HEIGHT = isMobile ? height * 0.40 : height * 0.55;

    useEffect(() => {
        if (isSeries) {
            setIsLoadingEpisodes(true);
            fetchRealEpisodes();
        }
    }, []);

    const fetchRealEpisodes = async () => {
        try {
            const token = await AsyncStorage.getItem('vertex_access');
            const res = await fetch(`${BACKEND_URL}/api/episodios/${movie.jellyfin_id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.Items && data.Items.length > 0) {
                const grouped = {};
                data.Items.forEach(ep => {
                    const sNum = ep.ParentIndexNumber || 1;
                    if (!grouped[sNum]) grouped[sNum] = { title: `Temporada ${sNum}`, episodes: [] };
                    grouped[sNum].episodes.push({
                        id: ep.Id, jellyfin_id: ep.Id, episodeNumber: ep.IndexNumber, title: ep.Name,
                        duration: ep.RunTimeTicks ? Math.round(ep.RunTimeTicks / 600000000) + 'm' : '45m',
                        overview: ep.Overview || 'Sin sinopsis disponible.',
                        // 🔥 Imagen del episodio también pasa por el proxy 🔥
                        thumb: ep.ImageTags && ep.ImageTags.Primary ? `${BACKEND_URL}/api/imagen/${ep.Id}/Primary/` : (movie.bgImage || movie.tmdbBg),
                        qualities: ['1080p (Original)'], type: 'episode', audioTracks: movie.audioTracks, videoCodec: movie.videoCodec
                    });
                });
                setSeasons(Object.values(grouped));
            }
            setIsLoadingEpisodes(false);
        } catch (error) { setIsLoadingEpisodes(false); }
    };

    const handlePlayPress = () => {
        attemptPlay(movie, () => {
            if (isCasting) { Alert.alert("VERTƎX Connect", `Mandando a tu ${connectedTV}.`); return; }
            const cwItem = continueWatching.find(m => m.id === movie.id);
            if (cwItem && cwItem.progress > 0.02) {
                setResumeItemProgress(cwItem.progress);
                setShowResumeModal(true);
            } else if (movie.qualities && movie.qualities.length > 1) {
                setItemToProcessLocal(movie); setModalActionTypeLocal('play'); setShowQualityModal(true);
            } else {
                navigation.navigate('VideoPlayer', { movie });
            }
        });
    };

    const handleEpisodePlay = (episode) => {
        attemptPlay(episode, () => {
            if (isCasting) Alert.alert("VERTƎX Connect", `Mandando episodio a tu ${connectedTV}.`);
            else {
                setItemToProcessLocal(episode);
                setModalActionTypeLocal('play');
                setShowQualityModal(true);
            }
        });
    };

    // Un poco más arriba, modifica la función startPlayback también:
    const startPlayback = (quality) => {
        setShowQuality(false);
        // 🔥 MAGIA: Enviamos "movie" (toda la serie) como 'seriesData' para que el reproductor la lea
        navigation.navigate('VideoPlayer', { movie: itemToProcessLocal || activeHero, seriesData: isSeries ? movie : null, selectedQuality: quality });
    };
    const handleEpisodeDownload = (episode) => { setItemToProcessLocal(episode); setModalActionTypeLocal('download'); setShowQualityModal(true); };
    const handleSeasonDownload = (season) => { Alert.alert("Próximamente", "La descarga por lotes estará activa en la próxima versión."); };

    return (
        <View style={[styles.mainScreen, { backgroundColor: '#050505' }]}>
            <QualitySelectorModal visible={showQualityModal} onClose={() => setShowQualityModal(false)} onSelect={(q) => { setShowQualityModal(false); navigation.navigate('VideoPlayer', { movie: itemToProcessLocal, selectedQuality: q }); }} actionType={modalActionTypeLocal} movie={itemToProcessLocal} />

            <ResumeModal
                visible={showResumeModal}
                onClose={() => setShowResumeModal(false)}
                progress={resumeItemProgress}
                onResume={() => { setShowResumeModal(false); navigation.navigate('VideoPlayer', { movie: { ...movie, progress: resumeItemProgress } }); }}
                onRestart={() => { setShowResumeModal(false); navigation.navigate('VideoPlayer', { movie: { ...movie, progress: 0 } }); }}
                onChangeQuality={() => { setShowResumeModal(false); setItemToProcessLocal(movie); setModalActionTypeLocal('play'); setShowQualityModal(true); }}
            />

            <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 20, zIndex: 100 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonGlass}><Ionicons name="arrow-back" size={24} color="#ffffff" /></TouchableOpacity>
            </View>

            {isMobile ? (
                // 🟢 MÓVIL: DISEÑO INMERSIVO (SCROLL SOBRE IMAGEN)
                <View style={{ flex: 1 }}>
                    <View style={{ position: 'absolute', top: 0, width: '100%', height: INMERSIVE_HEADER_HEIGHT, zIndex: 0 }}>
                        <ExpoImage source={[movie.bgImage ? { uri: movie.bgImage } : null, { uri: movie.tmdbBg }].filter(Boolean)} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={500} />
                        <LinearGradient colors={['transparent', 'rgba(5,5,5,0.6)', '#050505']} start={{ x: 0, y: 0.1 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />
                    </View>

                    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: INMERSIVE_HEADER_HEIGHT - 120 }} bounces={false} showsVerticalScrollIndicator={false} style={{ zIndex: 10 }}>
                        <View style={{ paddingHorizontal: 25 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 25 }}>
                                <ExpoImage source={[movie.thumb ? { uri: movie.thumb } : null, { uri: movie.tmdbThumb }].filter(Boolean)} style={[styles.detailsMainPoster, { elevation: 15, shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 10 }]} contentFit="cover" onError={() => setPosterError(true)} />
                                <View style={{ flex: 1, marginLeft: 15, justifyContent: 'flex-end' }}>
                                    <View style={styles.heroTopTags}>
                                        <View style={styles.vipPremiumBadge}><Text style={styles.vipPremiumText}>VIP</Text></View>
                                    </View>
                                    <Text style={[styles.movieDetailsTitle, { height: 'auto', minHeight: 60, marginTop: 5 }]} adjustsFontSizeToFit={true} numberOfLines={3} minimumFontScale={0.5}>{movie.title.toUpperCase()}</Text>
                                    <Text style={[styles.genreSubtitleText, { marginTop: 5, color: '#ccc' }]} numberOfLines={1}>{movie.genres}</Text>
                                </View>
                            </View>

                            <View style={[styles.techTagsRow, { justifyContent: 'center' }]}>
                                <View style={styles.techTagBox}><Text style={styles.techTagText}>{movie.year}</Text></View>
                                <View style={styles.techTagBox}><Text style={styles.techTagText}>{movie.rating}</Text></View>
                                <View style={styles.techTagBox}><Text style={styles.techTagText}>{movie.lang}</Text></View>
                                <View style={[styles.starRatingBox, { backgroundColor: 'rgba(193, 145, 95, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }]}>
                                    <Ionicons name="star" size={14} color={PREMIUM_GOLD} />
                                    <Text style={[styles.starRatingText, { marginLeft: 4 }]}>{movie.imdb}</Text>
                                </View>
                            </View>

                            {/* NUEVA JERARQUÍA DE BOTONES MÓVIL */}
                            {/* NUEVA JERARQUÍA DE BOTONES MÓVIL */}
                            <View style={{ marginBottom: 30 }}>
                                {/* 🔥 FIX: Botón "Fat-Finger" Premium */}
                                <TouchableOpacity style={[styles.btnPlayFlexible, { backgroundColor: themeColor, width: '100%', height: 65, borderRadius: 16, marginBottom: 15, shadowColor: themeColor, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }]} onPress={handlePlayPress}>
                                    <Ionicons name="play" size={28} color="#1a1005" />
                                    <Text style={[styles.btnPlayGoldenText, { fontSize: 18, letterSpacing: 1.5 }]}>REPRODUCIR CONTENIDO</Text>
                                </TouchableOpacity>
                                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
                                    <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => { if (isSeries) setShowSeriesModal(true); else { setItemToProcessLocal(movie); setModalActionTypeLocal('download'); setShowQualityModal(true); } }}>
                                        <View style={[styles.btnIconDark, { backgroundColor: 'transparent', borderWidth: 0 }]}><Ionicons name="download-outline" size={28} color="#e0e0e0" /></View>
                                        <Text style={{ color: '#888', fontSize: 11, fontWeight: 'bold' }}>Bóveda</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ alignItems: 'center' }} onPress={handleFavoritePress}>
                                        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.btnIconDark, { backgroundColor: 'transparent', borderWidth: 0 }]}><Ionicons name={isFavorite ? "checkmark" : "add"} size={32} color={isFavorite ? PREMIUM_GOLD : "#e0e0e0"} /></Animated.View>
                                        <Text style={{ color: '#888', fontSize: 11, fontWeight: 'bold' }}>Mi Lista</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text style={styles.sectionHeaderOrange}>SINOPSIS</Text>
                            <Text style={styles.synopsisText}>{movie.overview}</Text>

                            {isSeries && (
                                <View style={{ marginTop: 30 }}>
                                    <Text style={[styles.sectionHeaderOrange, { marginBottom: 15 }]}>TEMPORADAS Y EPISODIOS</Text>
                                    {isLoadingEpisodes ? <ActivityIndicator size="large" color={PREMIUM_GOLD} style={{ marginTop: 20 }} /> : seasons.length > 0 ? (
                                        <View style={{ gap: 10 }}>
                                            {seasons.map((season, index) => (
                                                <SeasonAccordion key={`season-${index}`} season={season} seriesMovie={movie} onSelectEpisode={handleEpisodePlay} onDownloadEpisode={handleEpisodeDownload} onDownloadSeason={handleSeasonDownload} />
                                            ))}
                                        </View>
                                    ) : (
                                        <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#111', borderRadius: 12 }}>
                                            <Ionicons name="videocam-off-outline" size={40} color="#444" />
                                            <Text style={{ color: '#888', marginTop: 10, textAlign: 'center' }}>Aún no hay episodios subidos</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            <View style={styles.techSpecsContainer}>
                                <Text style={styles.sectionHeaderOrange}>METADATOS DEL ARCHIVO</Text>
                                <View style={styles.techSpecItem}><Text style={styles.techSpecLabel}>DIRECTOR Y ESTUDIO</Text><Text style={styles.techSpecValue}>{movie.director} • {movie.studio}</Text></View>
                                <View style={styles.techSpecItem}>
                                    <Text style={styles.techSpecLabel}>MOTOR DE VIDEO</Text>
                                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                        <View style={styles.qualityBadgeSmall}><Text style={styles.qualityBadgeTextSmall}>{movie?.qualities?.[0] || '1080p'}</Text></View>
                                        <View style={[styles.qualityBadgeSmall, { borderColor: PREMIUM_GOLD }]}><Text style={[styles.qualityBadgeTextSmall, { color: PREMIUM_GOLD }]}>{movie.videoCodec || 'H.264'}</Text></View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            ) : (
                // 🟢 TV: NUEVO LAYOUT PANORÁMICO PREMIUM
                <View style={{ flex: 1, backgroundColor: '#050505' }}>
                    <View style={{ position: 'absolute', top: 0, right: 0, width: '75%', height: '100%', zIndex: 0 }}>
                        {/* La imagen ahora se pega a la derecha y ocupa toda la altura, sin estirarse mal */}
                        <ExpoImage
                            source={[movie.bgImage ? { uri: movie.bgImage } : null, { uri: movie.tmdbBg }].filter(Boolean)}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                        />

                        {/* Solo un gradiente lateral oscuro para leer el texto, sin cortar la imagen por abajo */}
                        <LinearGradient
                            colors={['#050505', 'rgba(5,5,5,0.9)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0.4, y: 0 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                    </View>

                    {/* Quitamos paddingTop gigante porque la imagen ya no bloquea todo */}
                    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 80, paddingLeft: 80 }} showsVerticalScrollIndicator={false}>
                        <View style={{ width: '55%' }}>
                            <View style={styles.heroTopTags}>
                                <View style={styles.vipPremiumBadge}><Text style={styles.vipPremiumText}>VIP</Text></View>
                                <Text style={[styles.genreSubtitleText, { fontSize: 16 }]} numberOfLines={1}>{movie.genres}</Text>
                            </View>
                            <Text style={[styles.movieDetailsTitle, { fontSize: 60, height: 'auto', minHeight: 80, marginBottom: 20, marginTop: 10 }]}>{movie.title.toUpperCase()}</Text>

                            <View style={styles.techTagsRow}>
                                <View style={styles.techTagBox}><Text style={styles.techTagText}>{movie.year}</Text></View>
                                <View style={styles.techTagBox}><Text style={styles.techTagText}>{movie.rating}</Text></View>
                                <View style={styles.techTagBox}><Text style={styles.techTagText}>{movie.lang}</Text></View>
                                <View style={styles.starRatingBox}><Ionicons name="star" size={14} color={PREMIUM_GOLD} /><Text style={styles.starRatingText}>{movie.imdb}</Text></View>
                            </View>

                            <Text style={[styles.synopsisText, { fontSize: 16, lineHeight: 26, marginBottom: 30, maxWidth: 600 }]} numberOfLines={5}>{movie.overview}</Text>

                            <View style={[styles.detailsActionRow, { maxWidth: 500 }]}>
                                <TouchableOpacity style={[styles.btnPlayFlexible, { backgroundColor: themeColor }]} onPress={handlePlayPress}><Ionicons name="play" size={22} color="#1a1005" /><Text style={styles.btnPlayGoldenText}>Mira ahora</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.btnIconDark} onPress={() => { if (isSeries) setShowSeriesModal(true); else { setItemToProcessLocal(movie); setModalActionTypeLocal('download'); setShowQualityModal(true); } }}><Ionicons name="download-outline" size={24} color="#fff" /></TouchableOpacity>
                                <TouchableOpacity style={styles.btnIconDark} onPress={handleFavoritePress}><Animated.View style={{ transform: [{ scale: scaleAnim }] }}><Ionicons name={isFavorite ? "checkmark" : "add"} size={26} color={isFavorite ? PREMIUM_GOLD : "#fff"} /></Animated.View></TouchableOpacity>
                            </View>

                            {isSeries && seasons.length > 0 && (
                                <View style={{ marginTop: 20, maxWidth: 600 }}>
                                    <Text style={[styles.sectionHeaderOrange, { marginBottom: 15 }]}>TEMPORADAS</Text>
                                    <View style={{ gap: 10 }}>
                                        {seasons.map((season, index) => (
                                            <SeasonAccordion key={`season-${index}`} season={season} seriesMovie={movie} onSelectEpisode={handleEpisodePlay} onDownloadEpisode={handleEpisodeDownload} onDownloadSeason={handleSeasonDownload} />
                                        ))}
                                    </View>
                                </View>
                            )}

                            <View style={[styles.techSpecsContainer, { maxWidth: 600, backgroundColor: 'rgba(17,17,17,0.7)' }]}>
                                <View style={styles.techSpecItem}><Text style={styles.techSpecLabel}>DIRECTOR Y ESTUDIO</Text><Text style={styles.techSpecValue}>{movie.director} • {movie.studio}</Text></View>
                                <View style={styles.techSpecItem}>
                                    <Text style={styles.techSpecLabel}>MOTOR DE VIDEO</Text>
                                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                        <View style={styles.qualityBadgeSmall}><Text style={styles.qualityBadgeTextSmall}>{movie.qualities[0] || '1080p'}</Text></View>
                                        <View style={[styles.qualityBadgeSmall, { borderColor: PREMIUM_GOLD }]}><Text style={[styles.qualityBadgeTextSmall, { color: PREMIUM_GOLD }]}>{movie.videoCodec || 'H.264'}</Text></View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            )}
        </View>
    );
}
// 🟢 Pestañas dinámicas
const CATEGORY_TABS_DEFAULT = ["Recientes", "Recomendadas", "Acción", "Aventura", "Animación", "Comedia", "Drama", "Familia", "Fantasía", "Terror", "Misterio", "Romance", "Ciencia Ficción", "Suspense", "4K", "IMAX"];
const CATEGORY_TABS_NOVELAS = ["Todas", "Asiáticas", "Latinas"];

// 🟢 CATEGORÍAS CON SCROLL INFINITO (PAGINACIÓN)
function CategoryScreen({ route, navigation }) {
    const { category } = route.params;
    const { jellyfinMovies, fetchJellyfinData } = useContext(AppContext);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const defaultTab = category === 'Novelas' ? 'Todas' : 'Recientes';
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [isLoadingMore, setIsLoadingMore] = useState(false); // Estado para el spinner

    const currentTabs = category === 'Novelas' ? CATEGORY_TABS_NOVELAS : CATEGORY_TABS_DEFAULT;

    const getBaseMovies = () => {
        const sourceData = jellyfinMovies && jellyfinMovies.length > 0 ? jellyfinMovies : FALLBACK_HERO;
        if (category === 'Películas') return sourceData.filter(m => m.type === 'movie' && !m.isAnime);
        if (category === 'Serie') return sourceData.filter(m => m.type === 'series' && !m.isNovel && !m.isAnime);
        if (category === 'Novelas') return sourceData.filter(m => m.isNovel);
        if (category === 'Animes') return sourceData.filter(m => m.isAnime);
        return sourceData;
    };

    const baseData = getBaseMovies();

    const getFilteredData = () => {
        if (activeTab === "Recientes" || activeTab === "Todas") return baseData;
        if (activeTab === "Recomendadas") return baseData.filter(m => parseFloat(m.imdb) >= 8.0);
        if (activeTab === "4K") return baseData.filter(m => m.qualities && m.qualities.includes("4K UHD"));
        if (activeTab === "IMAX") return baseData.filter(m => m.title.includes("IMAX"));
        if (activeTab === "Animación") return baseData.filter(m => m.isAnimacion || m.isAnime);
        if (category === 'Novelas') {
            if (activeTab === "Asiáticas") return baseData.filter(m => m.genres.includes("K-Drama") || m.genres.includes("Asiática") || m.overview.toLowerCase().includes("corea") || m.overview.toLowerCase().includes("japón"));
            if (activeTab === "Latinas") return baseData.filter(m => m.genres.includes("Latina") || m.overview.toLowerCase().includes("méxico") || m.overview.toLowerCase().includes("colombia"));
        }
        return baseData.filter(m => m.genres && m.genres.includes(activeTab));
    };

    const displayData = getFilteredData();
    const openMovieDetails = (movieData) => { navigation.navigate('MovieDetails', { movie: movieData }); };

    // 🔥 MAGIA: Detectar si el usuario llegó al final de la pantalla
    const handleScroll = async (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 400; // 400px antes de llegar al fin

        if (isCloseToBottom && !isLoadingMore) {
            setIsLoadingMore(true);
            await fetchJellyfinData(true); // Pide las siguientes 100 películas
            setIsLoadingMore(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            {isMobile && <View style={{ height: 40 }} />}
            {isMobile && (
                <View style={{ position: 'absolute', top: 50, left: 15, zIndex: 10 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView
                style={styles.mainScreen}
                contentContainerStyle={{ paddingBottom: isMobile ? 100 : 60, paddingTop: isMobile ? 50 : 60 }}
                onScroll={handleScroll} // Conectado al scroll infinito
                scrollEventThrottle={400}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ paddingHorizontal: isMobile ? 15 : 80, marginBottom: 20, paddingLeft: isMobile ? 65 : 80 }}>
                    <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'serif' }}>
                        {category.toUpperCase()}
                    </Text>
                    <Text style={{ color: PREMIUM_GOLD, fontSize: 12, letterSpacing: 2, fontWeight: 'bold' }}>CATÁLOGO PREMIUM</Text>
                </View>

                {category !== 'Animes' && (
                    <View style={{ paddingLeft: isMobile ? 15 : 80, marginBottom: 25 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 30 }}>
                            {currentTabs.map(tab => (
                                <FilterPill key={tab} label={tab} active={activeTab === tab} onPress={() => setActiveTab(tab)} />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {category === 'Animes' ? (
                    <View style={{ marginTop: 10 }}>
                        {displayData.length > 0 ? (
                            <>
                                {displayData.filter(m => m.type === 'series').length > 0 && <MovieList title="Series Anime" data={displayData.filter(m => m.type === 'series')} onMoviePress={openMovieDetails} isMobile={isMobile} />}
                                {displayData.filter(m => m.type === 'movie').length > 0 && <MovieList title="Películas Anime" data={displayData.filter(m => m.type === 'movie')} onMoviePress={openMovieDetails} isMobile={isMobile} />}
                            </>
                        ) : (
                            <View style={{ padding: 40, alignItems: 'center', marginTop: 30 }}>
                                <Ionicons name="color-palette-outline" size={50} color="#333" />
                                <Text style={{ color: '#666', marginTop: 15, fontSize: 16 }}>No hay animes en tu servidor.</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    displayData.length > 0 ? (
                        <FilteredGridView movies={displayData} onMoviePress={openMovieDetails} isMobile={isMobile} />
                    ) : (
                        <View style={{ padding: 40, alignItems: 'center', marginTop: 30 }}>
                            <Ionicons name="film-outline" size={50} color="#333" />
                            <Text style={{ color: '#666', marginTop: 15, fontSize: 16 }}>No hay contenido en "{activeTab}".</Text>
                        </View>
                    )
                )}

                {/* 🔥 SPINNER DE CARGA INFINITA */}
                {isLoadingMore && (
                    <View style={{ paddingVertical: 25, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={PREMIUM_GOLD} />
                        <Text style={{ color: PREMIUM_GOLD, marginTop: 10, fontSize: 12, fontWeight: 'bold' }}>Cargando más títulos...</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

function HistoryScreen({ navigation }) {
    return (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={60} color="#c1915f" style={{ marginBottom: 15 }} />
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Historial</Text>
            <Text style={{ color: '#888', marginTop: 10 }}>Próximamente disponible en VERTƎX</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 30, padding: 10, borderColor: '#c1915f', borderWidth: 1, borderRadius: 8 }}>
                <Text style={{ color: '#c1915f', fontWeight: 'bold' }}>VOLVER</Text>
            </TouchableOpacity>
        </View>
    );
}

// --- 5. NAVEGADORES (VERSIÓN TV PREMIUM MINIMALISTA Y TRANSPARENTE) ---
function CustomDrawerContent(props) {
    const currentRoute = props.state?.routeNames[props.state.index];
    const { user, attemptPlay, setShowVipModal, watchlist, toggleWatchlist } = useContext(AppContext);

    return (
        <View style={styles.drawerGlass}>
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />

            <View style={{ paddingTop: 30, flex: 1, overflow: 'hidden' }}>
                <View style={styles.drawerAvatarContainer}>
                    {/* AHORA USA EL AVATAR Y NOMBRE REAL DEL USUARIO */}
                    <Image source={{ uri: user?.photo || 'https://ui-avatars.com/api/?name=Ǝ&background=c1915f&color=000&bold=true' }} style={styles.drawerAvatar} />
                    <Text style={styles.drawerUserName} numberOfLines={1}>{user?.name || 'Invitado'}</Text>
                </View>

                <View style={{ width: '100%', gap: 10 }}>
                    <DrawerItem icon="home-variant" label="Inicio" focused={currentRoute === 'Inicio'} onPress={() => props.navigation.navigate('Inicio')} />
                    <DrawerItem icon="television-play" label="TV en Vivo" focused={currentRoute === 'TV en Vivo'} onPress={() => props.navigation.navigate('TV en Vivo')} />
                    <DrawerItem icon="movie-play-outline" label="Películas" focused={currentRoute === 'Películas'} onPress={() => props.navigation.navigate('Películas')} />
                    <DrawerItem icon="television-classic" label="Series" focused={currentRoute === 'Serie'} onPress={() => props.navigation.navigate('Serie')} />
                    <DrawerItem icon="heart-outline" label="Novelas" focused={currentRoute === 'Novelas'} onPress={() => props.navigation.navigate('Novelas')} />
                    <DrawerItem icon="palette-outline" label="Animes" focused={currentRoute === 'Animes'} onPress={() => props.navigation.navigate('Animes')} />
                    <View style={{ height: 15 }} />
                    <DrawerItem icon="compass-outline" label="Descubrir" focused={currentRoute === 'Buscar'} onPress={() => props.navigation.navigate('Buscar')} />
                    <DrawerItem icon="account-circle-outline" label="Usuario" focused={currentRoute === 'Usuario'} onPress={() => props.navigation.navigate('Usuario')} />
                </View>
            </View>
        </View>
    );
}

const DrawerItem = ({ icon, label, focused, onPress }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <Pressable
            onPress={onPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            focusable={true}
            style={[
                styles.drawerItemPill,
                focused && styles.drawerItemActive,
                isFocused && { backgroundColor: 'rgba(255,255,255,0.15)', transform: [{ scale: 1.05 }] }
            ]}
        >
            <MaterialCommunityIcons
                name={icon}
                size={24}
                color={focused || isFocused ? PREMIUM_GOLD : "#888"}
            />
            <Text style={[
                styles.drawerItemLabel,
                { color: focused || isFocused ? '#fff' : '#888', fontWeight: isFocused ? '900' : '600' }
            ]}>
                {label}
            </Text>
        </Pressable>
    );
};
const MenuItem = ({ icon, label, focused, isExpanded, onPress, fadeAnim }) => (
    <TouchableOpacity onPress={onPress} style={styles.menuItemTouch}>
        <View style={[styles.iconWrapper, focused && styles.iconWrapperActive, isExpanded && focused && styles.iconWrapperActiveExpanded]}>
            <Ionicons name={icon} size={22} color={focused ? PREMIUM_GOLD : INACTIVE_ICON} style={{ marginRight: isExpanded ? 15 : 0 }} />
            {isExpanded && (
                <Animated.Text style={[styles.itemLabel, focused && { color: PREMIUM_GOLD }, { opacity: fadeAnim }]} numberOfLines={1}>
                    {label}
                </Animated.Text>
            )}
        </View>
    </TouchableOpacity>
);

// 🔥 NUEVA PANTALLA DE DESCARGAS (CATEGORIZADA POR PESTAÑAS) 🔥
function DownloadsScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const { activeDownloads, downloadQueue, cancelDownload, completedDownloads, deleteCompletedDownload } = useContext(AppContext);

    // Pestañas dinámicas
    const tabs = ['En progreso', 'Pelis', 'Series', 'Anime', 'Novelas'];
    const [activeTab, setActiveTab] = useState('En progreso');

    const activeArray = Object.entries(activeDownloads);
    const totalInQueue = activeArray.length + downloadQueue.length;

    // Filtro inteligente para descargas completadas
    const getFilteredDownloads = () => {
        if (activeTab === 'Pelis') return completedDownloads.filter(d => d.movie.type === 'movie' && !d.movie.isAnime);
        if (activeTab === 'Series') return completedDownloads.filter(d => d.movie.type === 'series' && !d.movie.isAnime && !d.movie.isNovel);
        if (activeTab === 'Anime') return completedDownloads.filter(d => d.movie.isAnime);
        if (activeTab === 'Novelas') return completedDownloads.filter(d => d.movie.isNovel);
        return [];
    };

    const displayCompleted = getFilteredDownloads();

    return (
        <View style={{ flex: 1, backgroundColor: '#131313' }}>
            <View style={styles.downloadsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
                        <Ionicons name="arrow-back" size={24} color="#c1915f" />
                    </TouchableOpacity>
                    <Text style={styles.downloadsHeaderTitle}>BÓVEDA OFFLINE</Text>
                </View>
                <Text style={styles.downloadsHeaderBrand}>VERTƎX</Text>
            </View>

            {/* 🔥 BARRA DE PESTAÑAS 🔥 */}
            <View style={{ paddingTop: 90, paddingBottom: 15, paddingHorizontal: 15 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.filterPill, activeTab === tab && styles.filterPillActive, { paddingVertical: 10 }]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.filterPillText, activeTab === tab && styles.filterPillTextActive]}>
                                {tab} {tab === 'En progreso' && totalInQueue > 0 ? `(${totalInQueue})` : ''}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

                {/* --- VISTA: EN PROGRESO --- */}
                {activeTab === 'En progreso' && (
                    <>
                        <View style={styles.globalStatusCard}>
                            <Ionicons name="cloud-download-outline" size={100} color="rgba(193, 145, 95, 0.1)" style={styles.globalStatusBgIcon} />
                            <View style={{ zIndex: 10 }}>
                                <Text style={styles.globalStatusLabel}>ESTADO GLOBAL</Text>
                                <Text style={styles.globalStatusNumber}>{totalInQueue} Ítems en cola</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={styles.premiumVipBadge}><Text style={styles.premiumVipText}>PREMIUM VIP</Text></View>
                                    <Text style={styles.speedText}>Velocidad Máxima</Text>
                                </View>
                            </View>
                        </View>

                        {totalInQueue === 0 ? (
                            <View style={[styles.emptyBox, { backgroundColor: '#0e0e0e', borderColor: 'transparent' }]}>
                                <Ionicons name="checkmark-done-circle-outline" size={50} color="#444" style={{ marginBottom: 15 }} />
                                <Text style={styles.emptyText}>No hay descargas activas.</Text>
                            </View>
                        ) : (
                            <View style={{ gap: 20 }}>
                                {/* Activas */}
                                {activeArray.map(([id, dl]) => (
                                    <View key={id} style={styles.downloadBentoCard}>
                                        <View style={styles.dlPosterContainer}>
                                            <Image source={{ uri: dl.movie.thumb || dl.movie.bgImage }} style={styles.dlPosterImage} />
                                            <View style={styles.dlQualityBadge}><Text style={styles.dlQualityText}>{dl.qualityStr}</Text></View>
                                        </View>
                                        <View style={styles.dlInfoContainer}>
                                            <View style={styles.dlTopRow}>
                                                <View style={{ flex: 1 }}><Text style={styles.dlTitle} numberOfLines={1}>{dl.movie.title}</Text></View>
                                                <TouchableOpacity style={styles.dlRoundBtn} onPress={() => cancelDownload(id, false)}><Ionicons name="close" size={16} color="#e2e2e2" /></TouchableOpacity>
                                            </View>
                                            <View style={styles.dlProgressContainer}>
                                                <View style={styles.dlProgressLabels}>
                                                    <Text style={styles.dlStatusText}>DESCARGANDO</Text>
                                                    <Text style={styles.dlProgressPercent}>{Math.round(dl.progress)}%</Text>
                                                </View>
                                                <View style={styles.dlProgressBarBg}>
                                                    <View style={[styles.dlProgressBarFill, { width: `${dl.progress}%` }]} />
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                                {/* En Cola */}
                                {downloadQueue.map((item, idx) => (
                                    <View key={`q-${idx}`} style={[styles.downloadBentoCard, { opacity: 0.5 }]}>
                                        <View style={styles.dlPosterContainer}><Image source={{ uri: item.thumb }} style={styles.dlPosterImage} /></View>
                                        <View style={styles.dlInfoContainer}>
                                            <View style={styles.dlTopRow}>
                                                <Text style={styles.dlTitle}>{item.title}</Text>
                                                <TouchableOpacity style={styles.dlRoundBtn} onPress={() => cancelDownload(item.id, true)}><Ionicons name="close" size={16} color="#fff" /></TouchableOpacity>
                                            </View>
                                            <Text style={{ color: '#888', fontSize: 12, marginTop: 10 }}>ESPERANDO EN FILA...</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}

                {/* --- VISTAS: CATALOGO DESCARGADO (Pelis, Series, etc) --- */}
                {activeTab !== 'En progreso' && (
                    displayCompleted.length === 0 ? (
                        <View style={[styles.emptyBox, { backgroundColor: '#0e0e0e', borderColor: 'transparent', marginTop: 50 }]}>
                            <Ionicons name="folder-open-outline" size={50} color="#444" style={{ marginBottom: 15 }} />
                            <Text style={styles.emptyText}>No has descargado nada en esta categoría.</Text>
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 }}>
                            {displayCompleted.map((dl) => (
                                <TouchableOpacity
                                    key={`dl-${dl.id}`}
                                    style={{ width: '47%', marginBottom: 20 }}
                                    onPress={() => navigation.navigate('VideoPlayer', { movie: dl.movie, localUri: dl.uri })}
                                >
                                    <View style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111' }}>
                                        <Image source={{ uri: dl.movie.thumb || dl.movie.bgImage }} style={{ width: '100%', height: '100%' }} />
                                        <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.8)', padding: 5, borderRadius: 20 }}>
                                            <Ionicons name="checkmark-done" size={16} color={PREMIUM_GOLD} />
                                        </View>
                                    </View>
                                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 8 }} numberOfLines={1}>{dl.movie.title}</Text>
                                    <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{dl.qualityStr} • Local</Text>

                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
                                        onPress={() => {
                                            Alert.alert("Eliminar", `¿Borrar "${dl.movie.title}" del dispositivo?`, [
                                                { text: "Cancelar", style: "cancel" },
                                                { text: "Borrar", style: "destructive", onPress: () => deleteCompletedDownload(dl.id) }
                                            ]);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={14} color="#ff4444" />
                                        <Text style={{ color: '#ff4444', fontSize: 11, marginLeft: 5 }}>Eliminar archivo</Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )
                )}

            </ScrollView>
        </View>
    );
}

function AuthScreen({ navigation }) {
    const { setIsLoggedIn, updateUserData, fetchJellyfinData } = useContext(AppContext);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // 🔥 CONFIGURACIÓN DE GOOGLE CORREGIDA PARA EVITAR CRASH EN ANDROID 🔥
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '375847819247-jllcfo7ab2asnl7849fgek61fdjdga81.apps.googleusercontent.com',
        androidClientId: '375847819247-6mb43urau0otdtod7unjaora090r59ll.apps.googleusercontent.com',
    });
    // Escuchador de la respuesta de Google
    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            handleGoogleLogin(authentication.accessToken);
        }
    }, [response]);

    const handleGoogleLogin = async (token) => {
        setIsLoading(true);
        try {
            // 1. Le pedimos a Google los datos reales del usuario usando su llave
            const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const googleUser = await response.json();

            // 2. Extraemos el correo y el nombre de la cuenta de Google
            const { email, name, id } = googleUser;

            // 3. Creamos una "contraseña maestra" encriptada basada en su ID único de Google
            // (Esto es un truco maestro si tu Django no tiene un endpoint especial para Google)
            const secureGooglePassword = `GAuth_${id}_V3RT3X!`;
            const safeUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 100);

            // 4. Intentamos hacer Login normal en Django
            const loginRes = await fetch(`${BACKEND_URL}/api/login/`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password: secureGooglePassword })
            });

            if (loginRes.ok) {
                // Ya estaba registrado con Google antes, entra directo (Auto-Login)
                await executeLogin(email, secureGooglePassword);
            } else {
                // Es la primera vez que entra con Google, lo registramos automáticamente en Django
                const regRes = await fetch(`${BACKEND_URL}/api/registro/`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: safeUsername, email: email, password: secureGooglePassword, first_name: name })
                });

                const regData = await regRes.json();
                if (regRes.ok || regData.status === "success") {
                    await executeLogin(email, secureGooglePassword);
                } else {
                    Alert.alert("Error de Sincronización", "No pudimos crear tu cuenta en VERTƎX.");
                }
            }
        } catch (e) {
            Alert.alert("Error de Conexión", "No pudimos comunicarnos con Google.");
        } finally {
            setIsLoading(false);
        }
    };

    const executeLogin = async (loginEmail, loginPassword) => {
        const response = await fetch(`${BACKEND_URL}/api/login/`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: loginEmail, password: loginPassword })
        });
        const data = await response.json();

        if (response.ok) {
            const profileRes = await fetch(`${BACKEND_URL}/api/perfil/`, { headers: { 'Authorization': `Bearer ${data.access}` } });
            const profileData = await profileRes.json();
            const finalName = profileData.username || loginEmail.split('@')[0];

            let hwId = 'web-visitor';
            if (Platform.OS === 'android') hwId = Application.androidId;
            else if (Platform.OS === 'ios') hwId = await Application.getIosIdForVendorAsync();
            else {
                hwId = await AsyncStorage.getItem('vertex_web_id') || ('browser-' + Math.random().toString(36).substr(2, 9));
                await AsyncStorage.setItem('vertex_web_id', hwId);
            }

            await fetch(`${BACKEND_URL}/api/dispositivos/`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.access}` },
                body: JSON.stringify({ device_id: hwId, device_name: finalName, device_type: Platform.OS === 'web' ? 'Web' : 'Móvil' })
            });

            // 🔒 Guardamos en la caja fuerte encriptada (o caché si es web)
            if (Platform.OS === 'web') {
                await AsyncStorage.setItem('vertex_access', data.access);
                await AsyncStorage.setItem('vertex_refresh', data.refresh);
            } else {
                await SecureStore.setItemAsync('vertex_access', data.access);
                await SecureStore.setItemAsync('vertex_refresh', data.refresh);
            }

            updateUserData({ id: profileData.id, name: finalName, email: profileData.email, vipDays: profileData.vip_days_left, isVip: profileData.is_vip });
            setIsLoggedIn(true);
            await fetchJellyfinData(false); // 🔥 ESTA ES LA LÍNEA NUEVA
            navigation.navigate('MainCatalog');
        } else {
            Alert.alert("Error", "Correo o contraseña incorrectos.");
        }
    };

    const handleSubmit = async () => {
        const cleanEmail = email.toLowerCase().trim();
        if (!cleanEmail || !password) return Alert.alert("Aviso", "Completa todos los campos.");
        if (password.length < 6) return Alert.alert("Seguridad", "La contraseña debe tener al menos 6 caracteres.");

        setIsLoading(true);
        try {
            if (isLoginMode) {
                await executeLogin(cleanEmail, password);
            } else {
                // Registro (Usamos parte del correo como username seguro)
                const safeUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);

                const response = await fetch(`${BACKEND_URL}/api/registro/`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: safeUsername, email: cleanEmail, password: password })
                });

                const data = await response.json();
                if (response.ok || data.status === "success") {
                    await executeLogin(cleanEmail, password); // AUTO-LOGIN Netflix Style
                } else {
                    Alert.alert("Error de registro", "Es posible que el correo ya esté en uso.");
                }
            }
        } catch (error) { Alert.alert("Error", "No hay conexión con el servidor."); }
        finally { setIsLoading(false); }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' }}>
            <StatusBar barStyle="light-content" />
            <View style={StyleSheet.absoluteFillObject}>
                <Image source={{ uri: 'https://image.tmdb.org/t/p/w1280/8rpDcsfLJypbO6vtec04H36xU2I.jpg' }} style={{ width: '100%', height: '100%', opacity: 0.3 }} blurRadius={15} />
                <LinearGradient colors={['rgba(5,5,5,0.7)', '#050505']} style={StyleSheet.absoluteFillObject} />
            </View>

            <View style={[styles.authContainer, !isMobile && { width: 450, padding: 40 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.authLogo}>VERTƎX</Text>
                <Text style={styles.authTitle}>{isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>
                <Text style={styles.authSubtitle}>Ingresa a tu bóveda personal y sincroniza tus dispositivos.</Text>

                <View style={styles.authForm}>
                    <View style={styles.authInputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#888" style={styles.authInputIcon} />
                        <TextInput style={[styles.authInput, { outlineStyle: 'none' }]} placeholder="Correo Electrónico" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                    </View>

                    <View style={styles.authInputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.authInputIcon} />
                        <TextInput style={[styles.authInput, { outlineStyle: 'none' }]} placeholder="Contraseña" placeholderTextColor="#666" secureTextEntry value={password} onChangeText={setPassword} />
                    </View>

                    <TouchableOpacity style={[styles.authBtnPrimary, isLoading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.authBtnPrimaryText}>{isLoginMode ? 'ENTRAR' : 'REGISTRARSE'}</Text>}
                    </TouchableOpacity>

                    {/* 🔥 THE NEW GOOGLE BUTTON GOES HERE 🔥 */}
                    <Text style={{ color: '#666', fontSize: 12, marginVertical: 15, textAlign: 'center', fontWeight: 'bold' }}>O INGRESA RÁPIDO CON</Text>

                    <TouchableOpacity
                        style={styles.googleBtn}
                        disabled={!request}
                        onPress={() => promptAsync()}
                    >
                        <Ionicons name="logo-google" size={20} color="#fff" />
                        <Text style={styles.googleBtnText}>Continuar con Google</Text>
                    </TouchableOpacity>

                </View>

                <View style={styles.authFooter}>
                    <Text style={styles.authFooterText}>{isLoginMode ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}</Text>
                    <TouchableOpacity onPress={() => { setIsLoginMode(!isLoginMode); setPassword(''); }}>
                        <Text style={styles.authFooterLink}>{isLoginMode ? 'Regístrate' : 'Inicia Sesión'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// ==========================================
// 5. ENRUTADORES Y NAVEGADORES
// ==========================================

// Stacks encapsulados
const HomeStackScreen = () => (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
);

const SearchStackScreen = () => (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="SearchMain" component={SearchScreen} />
    </Stack.Navigator>
);

const MySpaceStackScreen = () => (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="MySpaceMain" component={MySpaceScreen} />
    </Stack.Navigator>
);

const UserStackScreen = () => (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="UserMain" component={UserScreen} />
        <Stack.Screen name="LinkedAccounts" component={LinkedDevicesScreen} />
    </Stack.Navigator>
);

// 🔥 MODAL: RADAR VERTƎX CONNECT 🔥
const VertexConnectModal = () => {
    const { showCastModal, setShowCastModal, isCasting, setIsCasting, connectedTV, setConnectedTV } = useContext(AppContext);
    const [isScanning, setIsScanning] = useState(true);
    const [foundDevices, setFoundDevices] = useState([]);

    // Simulamos la búsqueda de dispositivos en la red Wi-Fi
    useEffect(() => {
        if (showCastModal && !isCasting) {
            setIsScanning(true);
            setFoundDevices([]);
            const timer = setTimeout(() => {
                setIsScanning(false);
                setFoundDevices([
                    { id: 'tv1', name: 'TV Sala (Android TV)' },
                    { id: 'tv2', name: 'Cuarto de estar (Fire TV)' }
                ]);
            }, 2500); // Tarda 2.5 segundos en "encontrar" las teles
            return () => clearTimeout(timer);
        }
    }, [showCastModal, isCasting]);

    const handleConnect = (device) => {
        setConnectedTV(device.name);
        setIsCasting(true);
        setShowCastModal(false);
        Alert.alert("VERTƎX Connect", `Conectado a ${device.name}. Ahora tu celular es el control remoto.`);
    };

    const handleDisconnect = () => {
        setConnectedTV(null);
        setIsCasting(false);
        setShowCastModal(false);
    };

    return (
        <Modal visible={showCastModal} transparent={true} animationType="fade">
            <View style={styles.qualityModalOverlay}>
                <View style={[styles.qualityModalBox, { padding: 20 }]}>

                    <Text style={[styles.qualityModalTitle, { marginBottom: 5 }]}>VERTƎX CONNECT</Text>
                    <Text style={styles.qualityModalText}>
                        {isCasting ? `Vinculado a: ${connectedTV}` : 'Transmitir a un dispositivo cercano'}
                    </Text>

                    {/* ESTADO: CONECTADO */}
                    {isCasting && (
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <Ionicons name="tv" size={60} color={PREMIUM_GOLD} style={{ marginBottom: 10 }} />
                            <TouchableOpacity style={[styles.qualityBtnSecondary, { borderColor: '#ff4444' }]} onPress={handleDisconnect}>
                                <Ionicons name="close-circle-outline" size={20} color="#ff4444" style={{ marginRight: 10 }} />
                                <Text style={[styles.qualityBtnSecondaryText, { color: '#ff4444' }]}>Desconectar</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ESTADO: BUSCANDO... */}
                    {!isCasting && isScanning && (
                        <View style={{ alignItems: 'center', marginVertical: 30 }}>
                            <ActivityIndicator size="large" color={PREMIUM_GOLD} />
                            <Text style={{ color: '#888', marginTop: 15, fontSize: 13 }}>Buscando pantallas en tu red Wi-Fi...</Text>
                        </View>
                    )}

                    {/* ESTADO: DISPOSITIVOS ENCONTRADOS */}
                    {!isCasting && !isScanning && foundDevices.length > 0 && (
                        <View style={{ width: '100%', marginBottom: 20 }}>
                            {foundDevices.map((device) => (
                                <TouchableOpacity key={device.id} style={styles.qualityBtnSecondary} onPress={() => handleConnect(device)}>
                                    <Ionicons name="tv-outline" size={20} color="#fff" style={{ marginRight: 15 }} />
                                    <Text style={styles.qualityBtnSecondaryText}>{device.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setShowCastModal(false)}>
                        <Text style={{ color: PREMIUM_GOLD, fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>CERRAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
// 🔥 CATÁLOGO PRINCIPAL (SOLO PARA VIPs) 🔥
function MainCatalog() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    if (isMobile) {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#000' } }}>
                <Stack.Screen name="Inicio" component={HomeStackScreen} />
                <Stack.Screen name="TV en Vivo" component={ReproductorTV} />
                <Stack.Screen name="Buscar" component={SearchStackScreen} />
                <Stack.Screen name="Mi Espacio" component={MySpaceStackScreen} />
                <Stack.Screen name="Usuario" component={UserStackScreen} />
                <Stack.Screen name="Películas" component={CategoryScreen} initialParams={{ category: 'Películas' }} />
                <Stack.Screen name="Serie" component={CategoryScreen} initialParams={{ category: 'Serie' }} />
                <Stack.Screen name="Novelas" component={CategoryScreen} initialParams={{ category: 'Novelas' }} />
                <Stack.Screen name="Animes" component={CategoryScreen} initialParams={{ category: 'Animes' }} />
            </Stack.Navigator>
        );
    }

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: 'permanent',
                drawerStyle: { width: 50, backgroundColor: 'transparent', borderRightWidth: 0 },
                sceneContainerStyle: { backgroundColor: '#000000' }
            }}>
            <Drawer.Screen name="Inicio" component={HomeStackScreen} />
            <Drawer.Screen name="TV en Vivo" component={ReproductorTV} />
            <Drawer.Screen name="Buscar" component={SearchStackScreen} />
            <Drawer.Screen name="Mi Espacio" component={MySpaceStackScreen} />
            <Drawer.Screen name="Usuario" component={UserStackScreen} />
            <Drawer.Screen name="Películas" component={CategoryScreen} initialParams={{ category: 'Películas' }} />
            <Drawer.Screen name="Serie" component={CategoryScreen} initialParams={{ category: 'Serie' }} />
            <Drawer.Screen name="Novelas" component={CategoryScreen} initialParams={{ category: 'Novelas' }} />
            <Drawer.Screen name="Animes" component={CategoryScreen} initialParams={{ category: 'Animes' }} />
        </Drawer.Navigator>
    );
}

// 🔥 EL CEREBRO DE NAVEGACIÓN (EL PORTERO ACTUALIZADO) 🔥
function RootNavigator() {
    return (
        <NavigationContainer theme={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: '#000000' } }}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <VertexConnectModal />
            <VipLockModal />

            {/* AHORA TODOS ENTRAN AL CATÁLOGO DIRECTAMENTE */}
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                <RootStack.Screen name="MainCatalog" component={MainCatalog} />
                <RootStack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
                <RootStack.Screen name="ReproductorTV" component={ReproductorTV} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
                <RootStack.Screen name="MovieDetails" component={MovieDetailsScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
                <RootStack.Screen name="History" component={HistoryScreen} options={{ animation: 'slide_from_right' }} />
                <RootStack.Screen name="Downloads" component={DownloadsScreen} options={{ presentation: 'modal', animation: 'fade' }} />

                {/* AÑADIMOS LA PANTALLA DE AUTENTICACIÓN COMO UN MODAL FLOTANTE */}
                <RootStack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            </RootStack.Navigator>
        </NavigationContainer>
    );
}
// 🔥 FUNCIÓN ÚNICA DE ENTRADA (APP) 🔥
export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AppProvider>
                <RootNavigator />
            </AppProvider>
        </GestureHandlerRootView>
    );
}

// --- 6. ESTILOS COMPLETOS (VERSIÓN PREMIUM FINAL) ---
const styles = StyleSheet.create({
    // 🔥 ESTILOS PARA LA PANTALLA DE USUARIO 🔥
    settingsGroup: { marginBottom: 25 },
    settingsGroupTitle: { color: '#888', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 10 },
    vipActionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(193, 145, 95, 0.3)' },
    vipActionText: { color: '#fff', fontSize: 15, marginLeft: 15, fontWeight: '500' },
    settingsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 12, marginBottom: 10 },
    settingsItemText: { color: '#fff', fontSize: 15, fontWeight: '500' },
    settingsItemDesc: { color: '#888', fontSize: 12, marginTop: 4 },
    settingsItemSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 12, marginBottom: 10 },
    saveSettingsButton: { backgroundColor: '#c1915f', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
    saveSettingsButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    adminJellyfinLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#c1915f' },
    adminJellyfinText: { color: '#c1915f', fontSize: 15, fontWeight: 'bold', flex: 1, marginLeft: 15 },

    // 🔥 ESTILOS GENERALES Y NAVEGACIÓN 🔥
    heroContainer: { width: '100%', overflow: 'hidden' },
    mobileHeaderInline: { height: 60, backgroundColor: '#000', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
    mobileHeaderTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'serif', letterSpacing: 2 },

    // Títulos de secciones principales
    sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginLeft: 80, letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Impact' : 'serif' },

    // 🔥 BARRA DE PIE PEGADA AL FONDO (MÓVIL) - ANCLADA PERFECTAMENTE 🔥
    bottomBarGroundedContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 65,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        zIndex: 1000 // Asegura que siempre esté por encima de las listas
    },
    bottomBarItemsRow: {
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    tabButtonGrounded: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    tabLabelGrounded: {
        color: INACTIVE_ICON,
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
        letterSpacing: 1.1,
        fontFamily: Platform.OS === 'ios' ? 'Gill Sans' : 'serif',
    },
    tabLabelActiveGrounded: { color: PREMIUM_GOLD },

    // 🔥 BARRA LATERAL DELGADA PARA TV - FLOTANTE Y TRANSPARENTE 🔥
    drawerContainer: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
        position: 'absolute', // 🔥 VITAL: Esto permite que el contenido de la peli pase por debajo
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100
    },
    scrollContent: { paddingTop: 40 },
    avatarContainer: { alignItems: 'center', width: '100%', marginBottom: 35 },
    avatar: { borderWidth: 1.5, borderColor: PREMIUM_GOLD },
    userInfo: { marginTop: 10, alignItems: 'center' },
    userName: { color: '#ffffff', fontSize: 16, fontWeight: '700', fontFamily: 'serif' },
    daysLeft: { color: PREMIUM_GOLD, fontSize: 10, letterSpacing: 1.2, marginTop: 4, fontFamily: 'serif' },
    menuItems: { width: '100%' },
    menuItemTouch: { width: '100%', marginVertical: 3, paddingLeft: 10 },
    iconWrapper: { flexDirection: 'row', alignItems: 'center', height: 40, borderRadius: 20, paddingHorizontal: 6 }, // Menos padding para iconos centrados
    iconWrapperActive: { backgroundColor: 'rgba(193, 145, 95, 0.1)' },
    iconWrapperActiveExpanded: { width: '90%' },
    itemLabel: { color: '#fff', fontSize: 15, fontFamily: 'serif', fontWeight: '500', marginLeft: 15 },

    mainScreen: { flex: 1, backgroundColor: '#000000' },
    heroGradient: { width: '100%', height: '100%', paddingLeft: 80, justifyContent: 'center' },
    heroContent: { width: '50%', paddingBottom: 50 },
    heroTitle: { color: '#ffffff', fontSize: 44, fontWeight: 'bold', fontFamily: 'serif', marginBottom: 15 },
    heroTags: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    tagText: { color: '#ccc', fontSize: 13, fontWeight: '600' },
    tagDot: { color: '#555', marginHorizontal: 6, fontSize: 12 },
    tagBox: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#222', borderRadius: 4, borderWidth: 1, borderColor: '#333' },
    heroOverview: { color: '#b0b0b0', fontSize: 15, lineHeight: 22, marginBottom: 15, paddingRight: 20 },
    heroGenres: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginBottom: 25 },
    heroButtonsRow: { flexDirection: 'row', alignItems: 'center' },

    btnPlayHeroMobile: { flex: 1, maxWidth: 260, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 8, marginRight: 12 },
    btnPlayTextMobile: { color: '#000000', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    btnAddHeroMobile: { backgroundColor: '#222', padding: 10, borderRadius: 8, width: 55, alignItems: 'center', justifyContent: 'center' },

    paginationDots: { flexDirection: 'row', marginTop: 25 },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 4 },
    dotActive: { backgroundColor: '#fff', width: 7, height: 7, borderRadius: 4 },

    carouselContainer: { marginBottom: 25 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    flatListContent: {
        paddingLeft: 80,
        paddingRight: 20,
        gap: 12
    },
    posterCard: { width: 130, height: 195, borderRadius: 6, marginRight: 12, overflow: 'hidden', backgroundColor: '#111' },
    posterImage: { width: '100%', height: '100%' },

    genreCard: { width: 220, height: 120, borderRadius: 8, marginRight: 15, overflow: 'hidden', backgroundColor: '#111' },
    genreImage: { width: '100%', height: '100%', justifyContent: 'flex-end' },
    genreGradient: { width: '100%', height: '100%', justifyContent: 'flex-end', padding: 15 },
    genreTitleText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    cwCard: { width: 280, height: 158, borderRadius: 8, marginRight: 16, overflow: 'hidden', backgroundColor: '#111', borderWidth: 2, borderColor: 'transparent' },
    cwCardFocused: { borderColor: PREMIUM_GOLD },
    cwImage: { width: '100%', height: '100%' },
    cwTitleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, paddingTop: 40 },
    cwTitleText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', fontFamily: 'serif' },
    progressBarContainer: { height: 3, backgroundColor: 'rgba(255,255,255,0.2)', width: '100%', position: 'absolute', bottom: 0 },
    progressBarFill: { height: '100%', backgroundColor: PREMIUM_GOLD },
    closeCwBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },

    studioCard: { width: 160, height: 90, borderRadius: 8, marginRight: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    studioCardActive: { borderColor: PREMIUM_GOLD, borderWidth: 2 },
    studioGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
    studioLogo: { width: '80%', height: '80%', opacity: 0.5 },
    activeDot: { position: 'absolute', bottom: 5, width: 6, height: 6, borderRadius: 3, backgroundColor: PREMIUM_GOLD },

    catalogWrapper: { paddingLeft: 80, paddingRight: 40, marginTop: 10 },
    catalogHeaderTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', fontFamily: 'serif', marginBottom: 20 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    gridPosterCard: { width: 130, height: 195, borderRadius: 6, marginRight: 15, marginBottom: 20, overflow: 'hidden', backgroundColor: '#111' },
    emptyFilterText: { color: '#888', fontSize: 16, marginTop: 20 },

    searchHeaderContainer: { paddingLeft: 80, paddingRight: 40, marginBottom: 20 },
    searchBarWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#181818', borderRadius: 8, height: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingHorizontal: 15, height: '100%' },
    filtersRow: { flexDirection: 'row', marginBottom: 25, flexWrap: 'wrap', alignItems: 'center' },
    filterGroup: { flexDirection: 'row', alignItems: 'center', marginRight: 30, marginBottom: 10 },
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a1a', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    filterPillActive: { backgroundColor: '#ffffff' },
    filterPillText: { color: '#a0a0a0', fontSize: 11, fontWeight: 'bold' },
    filterPillTextActive: { color: '#000000' },

    mySpaceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 80, paddingRight: 40, marginBottom: 30 },
    mySpaceTitle: { color: '#ffffff', fontSize: 36, fontWeight: 'bold', fontFamily: 'serif' },
    settingsIconTop: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
    emptyBox: { width: '100%', height: 200, backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    emptyText: { color: '#666', fontSize: 14, marginBottom: 15, fontWeight: 'bold' },
    btnExplore: { backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    btnExploreText: { color: '#000', fontWeight: 'bold' },

    profileSection: { alignItems: 'center', paddingVertical: 30, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    avatarBig: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: PREMIUM_GOLD },
    avatarEditContainer: { position: 'relative', marginBottom: 15 },
    editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: PREMIUM_GOLD, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
    nameEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    profileName: { color: '#fff', fontSize: 24, fontWeight: 'bold', fontFamily: 'serif' },
    profileDays: { color: PREMIUM_GOLD, fontSize: 12, letterSpacing: 1.5, fontWeight: 'bold' },
    settingsContainer: { paddingHorizontal: 20, paddingTop: 20 },
    settingsSectionTitle: { color: '#888', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 10 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, backgroundColor: '#0a0a0a', marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    settingRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 15 },
    settingTitle: { color: '#fff', fontSize: 16, fontWeight: '500', marginBottom: 2 },
    settingSubtitle: { color: '#888', fontSize: 13, lineHeight: 18 },

    // 🔥 MODALES DEL SISTEMA (ALARMAS) 🔥
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '85%', backgroundColor: '#080808', borderRadius: 15, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: PREMIUM_GOLD },
    modalTitle: { color: PREMIUM_GOLD, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    modalText: { color: '#ccc', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    modalButtonsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    modalBtnSecondary: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#1a1a1a', marginRight: 10, borderWidth: 1, borderColor: '#333' },
    modalBtnSecondaryText: { color: '#fff', fontWeight: 'bold' },
    modalBtnPrimary: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8, backgroundColor: PREMIUM_GOLD },
    modalBtnPrimaryText: { color: '#000', fontWeight: 'bold' },

    // 🔥 ESTILOS PANTALLA DETALLES (DARK & GOLD) 🔥
    detailsBackground: { width: '100%', height: '100%', justifyContent: 'flex-end' },
    detailsGradient: { ...StyleSheet.absoluteFillObject },
    detailsContentWrapper: { paddingBottom: 50 },

    detailsActionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    btnPlayBigTV: { flexDirection: 'row', alignItems: 'center', backgroundColor: PREMIUM_GOLD, paddingVertical: 14, paddingHorizontal: 35, borderRadius: 10, marginRight: 15 },
    btnPlayBigText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
    btnIconAction: { padding: 12, backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#222' },

    // 🔥 ESTILOS PARA EPISODIOS Y TEMPORADAS MINIMALISTAS 🔥
    seasonContainer: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    seasonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
    seasonTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
    episodesList: { paddingBottom: 15 },
    episodeCard: { marginBottom: 20, backgroundColor: 'rgba(10,10,10,0.5)', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
    episodeMainRow: { flexDirection: 'row', padding: 10, alignItems: 'center' },
    episodeThumb: { width: 120, height: 68, borderRadius: 6, backgroundColor: '#222' },
    episodeInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    episodeTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
    episodeDuration: { color: PREMIUM_GOLD, fontSize: 11, marginTop: 2, fontWeight: '600' },
    episodeOverview: { color: '#888', fontSize: 12, lineHeight: 18, paddingHorizontal: 10, paddingBottom: 15, paddingTop: 5, fontWeight: '400' },

    epActionBtn: { padding: 11, marginLeft: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20 },

    // Estilos de modales de calidad VERTƎX Connect
    qualityModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    qualityModalBox: { width: '85%', maxWidth: 450, backgroundColor: '#000000', borderRadius: 20, padding: 30, borderWidth: 2, borderColor: PREMIUM_GOLD },
    qualityModalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    qualityModalText: { color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 25 },
    qualityBtnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PREMIUM_GOLD, paddingVertical: 15, borderRadius: 12, marginBottom: 12 },
    qualityBtnPrimaryText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
    qualityBtnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
    qualityBtnSecondaryText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },

    // Estilos VERTƎX Connect y Menú Central Flotante
    floatingActionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    floatingActionContainer: { backgroundColor: '#050505', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: PREMIUM_GOLD, elevation: 10, width: '90%', maxWidth: 400 },
    floatingActionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    floatingActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
    floatingActionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 15 },

    mobileActionIconsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 25, paddingHorizontal: 10 },
    mobileActionIconBtn: { alignItems: 'center' },
    mobileActionIconText: { color: '#888', fontSize: 10, fontWeight: 'bold', marginTop: 8, letterSpacing: 0.5 },

    // --- ESTILOS DEL REPRODUCTOR PROFESIONAL ---
    playerContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 10 },
    videoWrapper: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    invisibleDoubleTapWrapper: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 2 },
    invisibleSkipZone: { flex: 1 },
    customControlsOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'space-between', zIndex: 5 },

    playerTopBar: { height: 90, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 25, paddingTop: 25 },
    playerTopTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.9)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10, marginTop: 10 },

    qualityBadge: { backgroundColor: PREMIUM_GOLD, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginLeft: 15, marginTop: 10 },
    qualityBadgeText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

    playerCloseBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 },
    topRightControls: { flexDirection: 'row', alignItems: 'center' },

    playerBottomBar: { paddingBottom: 20, paddingTop: 40, zIndex: 20 },
    timeAndBarRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, marginBottom: 15 },
    playerTimeText: { color: '#fff', fontSize: 13, fontWeight: 'bold', width: 60, textAlign: 'center' },
    customSliderContainer: { flex: 1, marginHorizontal: 15 },

    bottomIconsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 35 },

    gestureUIIndicatorRight: { position: 'absolute', right: 40, top: '45%', backgroundColor: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 12, alignItems: 'center', zIndex: 100 },
    gestureUIIndicatorLeft: { position: 'absolute', left: 40, top: '45%', backgroundColor: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 12, alignItems: 'center', zIndex: 100 },
    gestureUIText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 8 },

    tracksModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    tracksModalContainer: { width: 300, backgroundColor: '#111', borderRadius: 12, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    tracksModalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    tracksModalSubtitle: { color: '#ccc', fontSize: 14, textAlign: 'center', marginBottom: 20 },
    tracksModalBtn: { backgroundColor: '#c1915f', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 8 },
    tracksModalBtnText: { color: '#000', fontWeight: 'bold' },

    // 🔥 ESTILOS PANTALLA DE DESCARGAS 🔥
    downloadItemCard: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
    downloadItemPoster: { width: 65, height: 95, borderRadius: 6, backgroundColor: '#222' },
    downloadItemInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    downloadItemTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    downloadItemQuality: { color: '#888', fontSize: 12, marginBottom: 12 },
    downloadProgressRow: { flexDirection: 'row', alignItems: 'center' },
    downloadProgressBarBg: { flex: 1, height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden', marginRight: 12 },
    downloadProgressBarFill: { height: '100%', backgroundColor: PREMIUM_GOLD, borderRadius: 3 },
    downloadProgressText: { color: PREMIUM_GOLD, fontSize: 13, fontWeight: 'bold', width: 40, textAlign: 'right' },
    downloadItemCancelBtn: { padding: 10, marginLeft: 5 },

    lockedOverlayContainer: { position: 'absolute', top: 40, left: 40, zIndex: 100 },
    unlockButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    unlockText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },

    // 🔥 ESTILOS ESPECÍFICOS PARA MOVIE DETAILS (NUEVO DISEÑO VERTƎX) 🔥
    // 🔥 ESTILOS ESPECÍFICOS PARA MOVIE DETAILS (NUEVO DISEÑO VERTƎX) 🔥
    backButtonGlass: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },

    detailsMainPoster: { width: 110, height: 165, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: '#111' },

    heroTopTags: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    vipPremiumBadge: { backgroundColor: 'rgba(193, 145, 95, 0.2)', borderWidth: 1, borderColor: 'rgba(193, 145, 95, 0.4)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    vipPremiumText: { color: PREMIUM_GOLD, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    genreSubtitleText: { color: '#d4c4b6', fontSize: 12, fontWeight: '500', flex: 1 },

    movieDetailsTitle: { color: '#ffffff', fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', letterSpacing: 0, height: 90, textAlignVertical: 'bottom' },

    techTagsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 25, flexWrap: 'wrap' },
    techTagBox: { backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    techTagText: { color: '#e2e2e2', fontSize: 12, fontWeight: '600' },
    starRatingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 5 },
    starRatingText: { color: PREMIUM_GOLD, fontSize: 14, fontWeight: 'bold' },

    // 🔥 REGLA MAGICA: Botones que caben en todas las pantallas
    detailsActionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 35, gap: 12, width: '100%' },
    btnPlayFlexible: {
        flex: 1, // Esto hace que ocupe todo el espacio sobrante sin empujar a los otros
        height: 55,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#d1a87b',
        borderRadius: 12,
    },
    btnPlayGoldenText: { color: '#1a1005', fontSize: 16, fontWeight: 'bold', marginLeft: 10, textTransform: 'uppercase' },
    btnIconDark: { width: 55, height: 55, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },

    sectionHeaderOrange: { color: PREMIUM_GOLD, fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' },
    synopsisText: { color: '#d4c4b6', fontSize: 14, lineHeight: 22, marginBottom: 10 },

    // Episodios
    episodesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    seasonSelector: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    seasonSelectorText: { color: PREMIUM_GOLD, fontSize: 14, fontWeight: '600' },
    episodesContainer: { gap: 15 },
    episodeCardDark: { backgroundColor: '#111', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    episodeThumbContainer: { width: '100%', height: 200, position: 'relative' },
    episodeListThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
    episodePlayOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    episodePlayCircle: { width: 45, height: 45, backgroundColor: 'rgba(193, 145, 95, 0.9)', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    episodeDurationBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    episodeDurationText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    episodeListInfo: { padding: 15 },
    episodeListTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1, paddingRight: 10 },
    episodeListNumber: { color: 'rgba(255,255,255,0.2)', fontSize: 22, fontStyle: 'italic', fontWeight: '900' },
    episodeListOverview: { color: '#888', fontSize: 13, marginTop: 8, lineHeight: 18 },

    // Detalles Técnicos
    techSpecsContainer: { backgroundColor: '#111', borderRadius: 12, padding: 20, marginTop: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    techSpecItem: { marginBottom: 15 },
    techSpecLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
    techSpecValue: { color: '#e2e2e2', fontSize: 15, fontWeight: '600' },
    qualityBadgeSmall: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    qualityBadgeTextSmall: { color: '#aaa', fontSize: 10, fontWeight: 'bold' },

    // Contenido Similar
    similarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    similarCard: { width: '47%', aspectRatio: 2 / 3, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111' },
    similarImage: { width: '100%', height: '100%' },

    // 🔥 ESTILOS NUEVOS PARA PERFIL DE USUARIO VIP 🔥
    // 🔥 ESTILOS PARA PERFIL VIP (CUADRADO PERFECTO) 🔥
    vipProfileHeader: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
    vipAvatarContainer: { position: 'relative', marginBottom: 20 },

    // El contenedor dorado (Glow) ahora es un cuadrado puro con radio 24
    vipAvatarGlow: {
        padding: 4,
        borderRadius: 24,
        backgroundColor: '#050505',
        shadowColor: PREMIUM_GOLD,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 15,
        borderWidth: 2,
        borderColor: PREMIUM_GOLD
    },

    // La imagen es un cuadrado puro con radio 20 (encaja matemáticamente perfecto)
    vipAvatarImage: { width: 120, height: 120, borderRadius: 20 },
    vipBadgeContainer: { position: 'absolute', bottom: -10, alignSelf: 'center', backgroundColor: '#d1a87b', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 },
    vipBadgeText: { color: '#492901', fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    vipProfileName: { color: '#fff', fontSize: 26, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', letterSpacing: 1 },
    vipProfileDays: { color: PREMIUM_GOLD, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },

    vipSectionTitle: { color: '#888', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 15, marginLeft: 10, marginTop: 10 },
    vipSectionGroup: { marginBottom: 25 },
    vipSettingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, backgroundColor: 'transparent', borderRadius: 12 },
    vipSettingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    vipSettingIconBox: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    vipSettingTexts: { flex: 1, justifyContent: 'center' },
    vipSettingTitle: { color: '#e2e2e2', fontSize: 15, fontWeight: '600', marginBottom: 2 },
    vipSettingSubtitle: { fontSize: 12, fontWeight: '500' },

    vipLogoutBtn: { width: '100%', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.2)', alignItems: 'center', marginTop: 20, backgroundColor: 'rgba(255, 68, 68, 0.05)' },
    vipLogoutBtnText: { color: '#ff6b6b', fontSize: 13, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },

    // 🔥 ESTILOS PARA LA PANTALLA DE DESCARGAS BENTO VIP 🔥
    downloadsHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(19, 19, 19, 0.9)', flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 15, paddingHorizontal: 20, zIndex: 100, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    downloadsHeaderTitle: { color: '#e2e2e2', fontSize: 16, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', letterSpacing: 1, marginLeft: 10 },
    downloadsHeaderBrand: { color: PREMIUM_GOLD, fontSize: 18, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', letterSpacing: 1, position: 'absolute', right: 20, bottom: 15 },

    globalStatusCard: { backgroundColor: '#1f1f1f', borderRadius: 16, padding: 25, marginBottom: 30, overflow: 'hidden', position: 'relative' },
    globalStatusBgIcon: { position: 'absolute', right: 10, top: 10, opacity: 0.2 },
    globalStatusLabel: { color: PREMIUM_GOLD, fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 8 },
    globalStatusNumber: { color: '#fff', fontSize: 28, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', marginBottom: 15 },
    premiumVipBadge: { backgroundColor: 'rgba(193, 145, 95, 0.1)', borderWidth: 1, borderColor: 'rgba(193, 145, 95, 0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    premiumVipText: { color: PREMIUM_GOLD, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    speedText: { color: '#888', fontSize: 12 },

    downloadBentoCard: { flexDirection: 'row', backgroundColor: '#0e0e0e', borderRadius: 16, padding: 12, height: 140 },
    dlPosterContainer: { width: 85, height: '100%', borderRadius: 8, overflow: 'hidden', position: 'relative' },
    dlPosterImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    dlQualityBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    dlQualityText: { color: '#fff', fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },

    dlInfoContainer: { flex: 1, marginLeft: 15, justifyContent: 'space-between', paddingVertical: 5 },
    dlTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    dlTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed' },
    dlSubtitle: { color: '#888', fontSize: 11, fontWeight: '600', marginTop: 4 },
    dlActionButtons: { flexDirection: 'row', gap: 8 },
    dlRoundBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },

    dlProgressContainer: { width: '100%' },
    dlProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
    dlStatusText: { color: PREMIUM_GOLD, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    dlProgressPercent: { color: '#fff', fontSize: 14, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed' },
    dlProgressBarBg: { width: '100%', height: 4, backgroundColor: '#353535', borderRadius: 2, overflow: 'hidden' },
    dlProgressBarFill: { height: '100%', borderRadius: 2 },

    storageBentoCard: { backgroundColor: '#0e0e0e', borderRadius: 16, padding: 20, marginTop: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    storageTitle: { color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
    storageBarBg: { width: '100%', height: 8, backgroundColor: '#353535', borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
    storageBarFill: { height: '100%', backgroundColor: PREMIUM_GOLD },
    storageBarApp: { height: '100%', backgroundColor: 'rgba(193, 145, 95, 0.4)' },
    storageTextLabel: { color: '#888', fontSize: 10, fontWeight: '500' },

    // 🔥 ESTILOS PANTALLA GESTIÓN DE ACCESOS (LINKED ACCOUNTS) 🔥
    linkedDeviceCard: { backgroundColor: '#0e0e0e', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    linkedDeviceLeft: { flexDirection: 'row', flex: 1 },
    linkedDeviceAvatar: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#222' },
    linkedDeviceStatusDot: { width: 14, height: 14, borderRadius: 7, position: 'absolute', bottom: -4, right: -4, borderWidth: 3, borderColor: '#0e0e0e' },
    linkedDeviceName: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed' },
    linkedDeviceRole: { color: '#888', fontSize: 12, fontWeight: '600' },
    linkedDeviceBadge: { backgroundColor: 'rgba(193, 145, 95, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(193, 145, 95, 0.3)', marginTop: 10, alignSelf: 'flex-start' },
    linkedDeviceBadgeText: { color: PREMIUM_GOLD, fontSize: 9, fontWeight: '900', letterSpacing: 1 },

    linkedDeviceRight: { justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 2 },
    linkedDeviceBtnEdit: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(193, 145, 95, 0.3)' },
    linkedDeviceBtnEditText: { color: PREMIUM_GOLD, fontSize: 11, fontWeight: 'bold' },
    linkedDeviceBtnUnlink: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.2)' },
    linkedDeviceBtnUnlinkText: { color: '#ff4444', fontSize: 11, fontWeight: 'bold' },

    linkedDeviceAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, shadowColor: PREMIUM_GOLD, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
    linkedDeviceAddText: { color: '#2c1700', fontSize: 18, fontWeight: '900', marginLeft: 10, fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed' },

    // 🌟 ESTILOS SIDEBAR (TV) - DISEÑO COMPACTO Y FIJO
    drawerGlass: {
        flex: 1,
        backgroundColor: 'rgba(15, 15, 15, 0.4)',
        overflow: 'hidden',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.05)',
    },
    drawerAvatarContainer: { alignItems: 'center', marginBottom: 25, width: '100%' },
    // 🟢 Avatar achicado proporcionalmente
    drawerAvatar: { width: 42, height: 42, borderRadius: 12, borderWidth: 1.5, borderColor: PREMIUM_GOLD },
    drawerUserName: { color: '#fff', marginTop: 8, fontSize: 12, fontWeight: 'bold' },

    drawerItemPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12, // 🟢 Padding reducido para que quepa todo
        borderRadius: 10,
        width: '92%',
        alignSelf: 'center',
    },
    drawerItemActive: { backgroundColor: 'rgba(193, 145, 95, 0.12)' },
    // 🟢 Margen y fuente ajustados para el nuevo ancho
    drawerItemLabel: { marginLeft: 10, fontSize: 13, fontWeight: '600' },
    // 🌟 ESTILOS BARRA MÓVIL PÍLDORA FLOTANTE
    mobileBarPinned: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        height: 65,
        borderRadius: 35,
        overflow: 'hidden',
        backgroundColor: 'rgba(10, 10, 10, 0.65)',
        zIndex: 1000,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    mobileBarItems: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '100%'
    },
    bottomTabItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    bottomTabText: { fontSize: 10, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },

    // 🔥 ESTILOS PANTALLA DE AUTENTICACIÓN (LOGIN/REGISTRO) 🔥
    authContainer: { width: '90%', backgroundColor: 'rgba(15,15,15,0.8)', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
    authLogo: { color: PREMIUM_GOLD, fontSize: 28, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed', letterSpacing: 3, marginBottom: 10 },
    authTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    authSubtitle: { color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 30 },
    authForm: { width: '100%', marginBottom: 20 },
    authInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, borderWidth: 1, borderColor: '#333', marginBottom: 15, paddingHorizontal: 15, height: 55 },
    authInputIcon: { marginRight: 10 },
    authInput: { flex: 1, color: '#fff', fontSize: 16, height: '100%' },
    authBtnPrimary: { backgroundColor: PREMIUM_GOLD, width: '100%', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    authBtnPrimaryText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    authFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    authFooterText: { color: '#888', fontSize: 13 },
    authFooterLink: { color: PREMIUM_GOLD, fontSize: 13, fontWeight: 'bold' },

    // Estilo base del botón del reproductor
    playerControlBtn: {
        padding: 12,
        borderRadius: 40,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Efecto visual cuando el control remoto de la TV está sobre el botón
    playerControlBtnFocused: {
        backgroundColor: 'rgba(193, 145, 95, 0.25)', // Aura dorada VERTƎX
        transform: [{ scale: 1.2 }], // Crece un poco para dar feedback
        borderWidth: 1,
        borderColor: 'rgba(193, 145, 95, 0.5)',
    },

    // Estilos nuevos para Auth y Google
    authInvitationCard: { backgroundColor: '#111', margin: 20, padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(193, 145, 95, 0.3)', borderStyle: 'dashed' },
    googleBtn: { flexDirection: 'row', backgroundColor: '#4285F4', width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
    googleBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 15 },

});