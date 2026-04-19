import React, { createContext, useState, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import * as MediaLibrary from 'expo-media-library';

// 📡 Importamos la configuración que creamos en el paso anterior
import { JELLYFIN_CONFIG, BACKEND_URL } from './src/theme/Config';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // 🔐 1. ESTADOS DE SEGURIDAD
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Controla el candado de la Bóveda
    const [user, setUser] = useState({
        name: "Usuario VERTƎX",
        email: "",
        status: "Usuario Gold",
        vipDays: 15,
        downloadLimit: 1 // Límite de descargas simultáneas para tu cuenta
    });

    // 🎬 2. ESTADOS DE CONTENIDO
    const [watchlist, setWatchlist] = useState([]);
    const [continueWatching, setContinueWatching] = useState([]);
    const [history, setHistory] = useState([]);

    // 📥 3. MOTOR DE DESCARGAS INTELIGENTE (Cola y Activos)
    const [activeDownloads, setActiveDownloads] = useState({});
    const [downloadQueue, setDownloadQueue] = useState([]);
    const downloadResumables = useRef({});

    // 📺 4. VERTƎX CONNECT (Casting a TV)
    const [isCasting, setIsCasting] = useState(false);
    const [connectedTV, setConnectedTV] = useState(null);
    const [showCastModal, setShowCastModal] = useState(false);

    // --- 🛡️ CONFIGURACIÓN DE PERMISOS AL INICIAR ---
    useEffect(() => {
        const setupPermissions = async () => {
            if (Platform.OS !== 'web') {
                await Notifications.requestPermissionsAsync();
                await MediaLibrary.requestPermissionsAsync();
            }
        };
        setupPermissions();
    }, []);

    // --- 🚦 VIGILANTE DE LA COLA (Media Hunter Queue) ---
    useEffect(() => {
        const activeCount = Object.keys(activeDownloads).length;
        // Si hay espacio (según tu límite VIP) y hay películas esperando en la fila
        if (activeCount < user.downloadLimit && downloadQueue.length > 0) {
            const nextItem = downloadQueue[0];
            setDownloadQueue(prev => prev.slice(1)); // Lo sacamos de la fila
            startDownloadProcess(nextItem, nextItem.qualityStr); // Iniciamos descarga real
        }
    }, [activeDownloads, downloadQueue, user.downloadLimit]);

    // --- 🎯 FUNCIONES DE GESTIÓN DE CONTENIDO ---
    const toggleWatchlist = (movie) => {
        setWatchlist(prev => {
            const exists = prev.find(m => m.id === movie.id);
            if (exists) return prev.filter(m => m.id !== movie.id);
            return [movie, ...prev];
        });
    };

    const updateContinueWatching = (movie, progressValue) => {
        setContinueWatching(prev => {
            const filtered = prev.filter(m => m.id !== movie.id);
            return [{ ...movie, progress: progressValue }, ...filtered];
        });
    };

    const removeFromContinueWatching = (movieId) => {
        setContinueWatching(prev => prev.filter(m => m.id !== movieId));
    };

    // --- 🤖 FUNCIONES DEL ROBOT CAZADOR (BACKEND) ---
    const requestSmartDownload = async (item, qualityStr) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/hunt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-master-key': JELLYFIN_CONFIG.ADMIN_MASTER_KEY
                },
                body: JSON.stringify({ title: item.title, type: item.type })
            });
            const result = await response.json();

            if (result.status === 'success') {
                Alert.alert("🎯 Orden Recibida", `El robot está buscando "${item.title}" en calidad VIP.`);
                setDownloadQueue(prev => [...prev, { ...item, qualityStr }]);
            } else {
                Alert.alert("Aviso", "No se encontró el contenido en la red externa.");
            }
        } catch (error) {
            Alert.alert("Error de Conexión", "No se pudo contactar con el servidor del Robot.");
        }
    };

    // --- 📥 MOTOR DE DESCARGA NATIVA ---
    const startDownloadProcess = async (movie, qualityStr) => {
        const downloadId = movie.id.toString();
        if (activeDownloads[downloadId]) return;

        // UI: Marcamos como descargando al 0%
        setActiveDownloads(prev => ({
            ...prev,
            [downloadId]: { movie, qualityStr, progress: 0 }
        }));

        // La lógica real de FileSystem se activará aquí cuando conectemos Catalog.js
    };

    const cancelDownload = (downloadId, isQueued = false) => {
        if (isQueued) {
            setDownloadQueue(prev => prev.filter(item => item.id !== downloadId));
            return;
        }
        setActiveDownloads(prev => {
            const newDownloads = { ...prev };
            delete newDownloads[downloadId];
            return newDownloads;
        });
    };

    return (
        <AppContext.Provider value={{
            isLoggedIn, setIsLoggedIn,
            user, setUser,
            watchlist, toggleWatchlist,
            continueWatching, updateContinueWatching, removeFromContinueWatching,
            history, setHistory,
            activeDownloads, downloadQueue,
            requestSmartDownload, cancelDownload,
            isCasting, setIsCasting,
            connectedTV, setConnectedTV,
            showCastModal, setShowCastModal
        }}>
            {children}
        </AppContext.Provider>
    );
};