import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// 🎨 Importamos configuración, modales y contexto
import { JELLYFIN_CONFIG, THEME_COLORS } from '../src/theme/Config';
import QualitySelectorModal from './QualitySelectorModal';
import QuickLoginModal from './QuickLoginModal';
import { AppContext } from '../AppContext';

const { height } = Dimensions.get('window');

const MovieDetailsScreen = ({ route, navigation }) => {
    const { movie } = route.params;

    // 🧠 Obtenemos el estado de la sesión y la lista de seguimiento del Cerebro Global
    const { isLoggedIn, watchlist, toggleWatchlist } = useContext(AppContext);
    const isFavorite = watchlist.some(m => m.id === movie.id);

    const [showQualityModal, setShowQualityModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // 🚀 LÓGICA DE SEGURIDAD VERTƎX: Interceptamos el Play si no hay sesión
    const handlePlayPress = () => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
        } else {
            setShowQualityModal(true);
        }
    };

    // 🎥 Función que genera la URI de video final (Nube vs Local)
    const handleStartPlayback = (selectedQuality) => {
        setShowQualityModal(false);

        let finalVideoUri = '';
        if (selectedQuality.isLocal) {
            // Reproducción desde el almacenamiento interno del dispositivo
            finalVideoUri = selectedQuality.localUri;
        } else {
            // 🌐 STREAMING DESDE LA NUBE (Usando el Pase VIP de Swizzin)
            const API_KEY = JELLYFIN_CONFIG.API_KEY;
            // Usamos la URL base configurada en el Paso 1
            finalVideoUri = `${JELLYFIN_CONFIG.URL}/Videos/${movie.id}/stream.mp4?api_key=${API_KEY}`;
        }

        // Navegamos al reproductor con la señal inteligente
        navigation.navigate('VideoPlayer', {
            movie: movie,
            sourceURI: finalVideoUri,
            qualityName: selectedQuality.name,
            isOffline: selectedQuality.isLocal
        });
    };

    return (
        <View style={styles.container}>
            {/* 🔐 La "Trampa" de Login VIP */}
            <QuickLoginModal
                visible={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={() => {
                    setShowLoginModal(false);
                    setShowQualityModal(true);
                }}
            />

            {/* 🛰️ Selector de Calidad e Inteligencia Offline */}
            <QualitySelectorModal
                visible={showQualityModal}
                onClose={() => setShowQualityModal(false)}
                onSelect={handleStartPlayback}
                movie={movie}
            />

            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                {/* 🖼️ Cabecera con Backdrop de la Nube */}
                <View style={styles.heroSection}>
                    <ImageBackground
                        source={{ uri: movie.bgImage || movie.thumb }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    >
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <BlurView intensity={40} tint="dark" style={styles.glassIcon}>
                                <Ionicons name="chevron-back" size={28} color="#fff" />
                            </BlurView>
                        </TouchableOpacity>

                        <LinearGradient
                            colors={['transparent', 'rgba(5,5,5,0.8)', THEME_COLORS.bgAbsolute]}
                            style={styles.heroGradient}
                        />
                    </ImageBackground>
                </View>

                {/* 📝 Contenido y Sinopsis */}
                <View style={styles.contentSection}>
                    <Text style={styles.title}>{movie.title}</Text>

                    <View style={styles.tagsRow}>
                        <Text style={styles.tagText}>{movie.year || '2026'}</Text>
                        <Text style={styles.tagDot}> • </Text>
                        <View style={styles.tagBox}>
                            <Text style={styles.tagText}>{movie.rating || 'VIP'}</Text>
                        </View>
                        <Text style={styles.tagDot}> • </Text>
                        <Text style={styles.tagText}>{movie.lang || 'Latino (VIP)'}</Text>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.btnPlayPrimary}
                            onPress={handlePlayPress}
                        >
                            <Ionicons name="play" size={24} color="#000" />
                            <Text style={styles.btnPlayText}>Mira ahora</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.btnActionGlass}
                            onPress={() => toggleWatchlist(movie)}
                        >
                            <Ionicons
                                name={isFavorite ? "checkmark" : "add"}
                                size={28}
                                color={isFavorite ? THEME_COLORS.gold : "#fff"}
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.overview}>{movie.overview || 'Cargando sinopsis de la Bóveda...'}</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME_COLORS.bgAbsolute },
    heroSection: { width: '100%', height: height * 0.65 },
    heroImage: { width: '100%', height: '100%', justifyContent: 'space-between' },
    heroGradient: { height: '40%', width: '100%', position: 'absolute', bottom: 0 },
    backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    glassIcon: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: THEME_COLORS.glassBorder },
    contentSection: { paddingHorizontal: 25, marginTop: -40, zIndex: 5 },
    title: { color: THEME_COLORS.textMain, fontSize: 34, fontWeight: '900', marginBottom: 15 },
    tagsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    tagText: { color: THEME_COLORS.textMuted, fontSize: 14, fontWeight: 'bold' },
    tagDot: { color: THEME_COLORS.textMuted, marginHorizontal: 8 },
    tagBox: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    actionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
    btnPlayPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: THEME_COLORS.goldLight, paddingVertical: 15, borderRadius: 16 },
    btnPlayText: { color: '#000', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    btnActionGlass: { width: 54, height: 54, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME_COLORS.glassBg, borderRadius: 16, borderWidth: 1.2, borderColor: THEME_COLORS.glassBorder },
    overview: { color: '#cccccc', fontSize: 15, lineHeight: 24, paddingBottom: 50 }
});

export default MovieDetailsScreen;