import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const COLORS = {
    bgDark: '#000000',
    bgGold: '#0a0802',
    oro: '#d4af37',
    textLight: '#ffffff',
    textMuted: '#999999',
    cardBg: '#111'
};

// --- CREDENCIALES JELLYFIN ---
const JELLYFIN_URL = 'http://192.168.0.128:8096';
const API_KEY = 'f5dd469974fb41309e7119ba7d77f292';

// Creador de URLs para imágenes
const getImageUrl = (itemId, type = 'Primary', w = 400) => `${JELLYFIN_URL}/Items/${itemId}/Images/${type}?api_key=${API_KEY}&fillWidth=${w}&quality=90`;
const getBackdropUrl = (itemId) => `${JELLYFIN_URL}/Items/${itemId}/Images/Backdrop?api_key=${API_KEY}&maxWidth=1920&quality=90`;

const Synopsis = ({ route, navigation }) => {
    const { mediaId, mediaType } = route.params;
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [related, setRelated] = useState([]);
    const [activeTab, setActiveTab] = useState('Contenido'); // 'Contenido' o 'Detalles'

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const detailsRes = await axios.get(`${JELLYFIN_URL}/Items/${mediaId}/?api_key=${API_KEY}`);
                setDetails(detailsRes.data);

                if (mediaType === 'Series') {
                    const seasonsRes = await axios.get(`${JELLYFIN_URL}/Items?ParentId=${mediaId}&IncludeItemTypes=Season&api_key=${API_KEY}`);
                    if (seasonsRes.data.Items.length > 0) {
                        const seasonId = seasonsRes.data.Items[0].Id;
                        const episodesRes = await axios.get(`${JELLYFIN_URL}/Items?ParentId=${seasonId}&IncludeItemTypes=Episode&api_key=${API_KEY}`);
                        setEpisodes(episodesRes.data.Items);
                    }
                } else {
                    const relatedRes = await axios.get(`${JELLYFIN_URL}/Items/${mediaId}/Similar?Limit=10&api_key=${API_KEY}`);
                    setRelated(relatedRes.data.Items);
                }
            } catch (error) {
                console.error("Error cargando sinopsis: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [mediaId, mediaType]);

    if (loading || !details) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.oro} />
            </View>
        );
    }

    // --- RENDERIZADORES DE CONTENIDO ---
    const renderEpisode = (item) => (
        <TouchableOpacity key={item.Id} style={styles.episodeCard} onPress={() => navigation.navigate('Player', { url: 'URL_TEMPORAL', isSeries: true })}>
            <View style={styles.episodeThumbContainer}>
                <Image source={{ uri: getImageUrl(item.Id, 'Primary', 150) }} style={styles.episodeThumb} />
                <View style={styles.playIconOverlay}>
                    <Ionicons name="play" size={20} color={COLORS.oro} />
                </View>
            </View>
            <View style={styles.episodeInfo}>
                <Text style={styles.episodeTitle}>E{item.IndexNumber} • {item.Name}</Text>
                <Text style={styles.episodeOverview} numberOfLines={2}>{item.Overview || 'Sin resumen disponible.'}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderRelated = (item) => (
        <TouchableOpacity key={item.Id} style={styles.relatedCard} onPress={() => navigation.replace('Synopsis', { mediaId: item.Id, mediaType: 'Movie' })}>
            <Image source={{ uri: getImageUrl(item.Id) }} style={styles.relatedPoster} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} bounces={false}>

                {/* 1. HEADER ESTILO "VERTEX" (Corte diagonal) */}
                <View style={styles.backdropContainer}>
                    <Image source={{ uri: getBackdropUrl(details.Id) }} style={styles.backdropImage} />

                    {/* Degradado en diagonal para darle el toque afilado de la marca */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)', COLORS.bgDark]}
                        start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
                        style={styles.backdropGradient}
                    />

                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
                    </TouchableOpacity>
                </View>

                {/* 2. INFORMACIÓN PRINCIPAL */}
                <View style={styles.infoContainer}>
                    <Text style={styles.title}>{details.Name.toUpperCase()}</Text>

                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>{details.ProductionYear || 'N/A'}</Text>
                        <Text style={styles.metaDot}>◆</Text>
                        <Text style={styles.metaText}>{details.OfficialRating || 'VIP'}</Text>
                        {mediaType === 'Movie' && (
                            <>
                                <Text style={styles.metaDot}>◆</Text>
                                <Text style={styles.metaText}>{Math.floor(details.RunTimeTicks / 600000000)} MIN</Text>
                            </>
                        )}
                    </View>

                    {/* Botón de Reproducir "Vertex" (Esquinas asimétricas) */}
                    <TouchableOpacity
                        style={styles.vertexPlayBtn}
                        onPress={() => navigation.navigate('Player', { url: 'URL_TEMPORAL', isSeries: mediaType === 'Series' })}
                    >
                        <Ionicons name="play" size={20} color="#000" />
                        <Text style={styles.playBtnText}>INICIAR BÓVEDA</Text>
                    </TouchableOpacity>

                    <Text style={styles.overview}>{details.Overview || 'Sin sinopsis disponible en este momento.'}</Text>
                </View>

                {/* 3. PESTAÑAS (Tabs estilo Vertex) */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('Contenido')}>
                        <Text style={[styles.tabText, activeTab === 'Contenido' && styles.tabTextActive]}>
                            {mediaType === 'Series' ? 'EPISODIOS' : 'SIMILARES'}
                        </Text>
                        {activeTab === 'Contenido' && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('Detalles')}>
                        <Text style={[styles.tabText, activeTab === 'Detalles' && styles.tabTextActive]}>MÁS DETALLES</Text>
                        {activeTab === 'Detalles' && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                </View>

                {/* 4. CONTENIDO DINÁMICO SEGÚN LA PESTAÑA */}
                <View style={styles.tabContent}>
                    {activeTab === 'Contenido' ? (
                        mediaType === 'Series' ? (
                            <View style={styles.episodeList}>
                                {episodes.length > 0 ? episodes.map(renderEpisode) : <Text style={styles.emptyText}>No hay episodios disponibles.</Text>}
                            </View>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
                                {related.length > 0 ? related.map(renderRelated) : <Text style={styles.emptyText}>No hay contenido similar.</Text>}
                            </ScrollView>
                        )
                    ) : (
                        <View style={styles.detailsBox}>
                            <Text style={styles.detailsLabel}>Géneros: <Text style={styles.detailsValue}>{details.Genres?.join(', ') || 'N/A'}</Text></Text>
                            <Text style={styles.detailsLabel}>Estudios: <Text style={styles.detailsValue}>{details.Studios?.map(s => s.Name).join(', ') || 'N/A'}</Text></Text>
                            <Text style={styles.detailsLabel}>ID de Bóveda: <Text style={styles.detailsValue}>{details.Id}</Text></Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgDark },
    loaderContainer: { flex: 1, backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },

    backdropContainer: { width: '100%', height: height * 0.45, position: 'relative' },
    backdropImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    backdropGradient: { position: 'absolute', bottom: 0, width: '100%', height: '100%' },
    backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 },

    infoContainer: { paddingHorizontal: 20, marginTop: -60, zIndex: 5 },
    title: { color: COLORS.oro, fontSize: 32, fontWeight: '900', letterSpacing: 1, marginBottom: 10, textShadowColor: 'rgba(0, 0, 0, 0.9)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 10 },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 25 },
    metaText: { color: COLORS.textLight, fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
    metaDot: { color: COLORS.oro, fontSize: 10 },

    // BOTÓN ESTILO VERTEX (Asimétrico)
    vertexPlayBtn: { flexDirection: 'row', backgroundColor: COLORS.oro, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 25, borderTopLeftRadius: 20, borderBottomRightRadius: 20, borderTopRightRadius: 4, borderBottomLeftRadius: 4 },
    playBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 2 },

    overview: { color: COLORS.textMuted, fontSize: 15, lineHeight: 24, marginBottom: 20 },

    // PESTAÑAS (TABS)
    tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', paddingHorizontal: 20, gap: 30, marginBottom: 20 },
    tab: { paddingVertical: 15, position: 'relative' },
    tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
    tabTextActive: { color: COLORS.textLight },
    activeIndicator: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, backgroundColor: COLORS.oro },

    tabContent: { paddingHorizontal: 20 },
    emptyText: { color: COLORS.textMuted, fontStyle: 'italic' },

    // SERIES: EPISODIOS
    episodeList: { gap: 15 },
    episodeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 8, overflow: 'hidden', paddingRight: 15 },
    episodeThumbContainer: { position: 'relative' },
    episodeThumb: { width: 120, height: 75, resizeMode: 'cover' },
    playIconOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    episodeInfo: { flex: 1, paddingLeft: 15, paddingVertical: 10 },
    episodeTitle: { color: COLORS.textLight, fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
    episodeOverview: { color: COLORS.textMuted, fontSize: 12, lineHeight: 16 },

    // PELÍCULAS: SIMILARES
    relatedScroll: { gap: 15 },
    relatedCard: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
    relatedPoster: { width: 110, height: 165, resizeMode: 'cover' },

    // DETALLES
    detailsBox: { backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderLeftColor: COLORS.oro },
    detailsLabel: { color: COLORS.textMuted, fontSize: 14, fontWeight: 'bold' },
    detailsValue: { color: COLORS.textLight, fontWeight: 'normal' }
});

export default Synopsis;